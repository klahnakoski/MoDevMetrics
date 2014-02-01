/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("../util/aLibrary.js");
importScript("../qb/ESQuery.js");
importScript("../qb/Qb.js");



ETL={};


Thread.run("get bug columns", function(){
	yield (ESQuery.loadColumns({"from":"bugs"}));

	if (ESQuery.INDEXES.bugs.columns===undefined) yield (null);

	var temp = yield (Qb.calc2List({
		"from":ESQuery.INDEXES.bugs.columns,
		"edges":["name"],
		"where":"name.startsWith('cf_')"
	}));
	ETL.allFlags=temp.list.map(function(v){return v.name;});
});



////////////////////////////////////////////////////////////////////////////////
// RUN THIS NEAR BEGINNING TO REMOVE ALL BUT THE oldIndex (ONE WITH THE ALIAS)
// AND THE newIndex (THE NEWEST WITHOUT AN ALIAS)
///////////////////////////////////////////////////////////////////////////////
ETL.removeOldIndexes=function(etl){
	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	var data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	Log.note(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(etl.aliasName)) continue;
		if (name==etl.newIndexName) continue;

		if (etl.newIndexName===undefined){
			etl.newIndexName=name;
			continue;
		}else if (name>etl.newIndexName){
			var oldName=etl.newIndexName;
			etl.newIndexName=name;
			name=oldName;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			if (etl.oldIndexName===undefined){
				etl.oldIndexName=name;
				continue;
			}else if (name>etl.oldIndexName){
				//DELETE VERY OLD INDEX
				yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+etl.oldIndexName}));
				etl.oldIndexName=name;
				continue;
			}//endif
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for
};



////////////////////////////////////////////////////////////////////////////////
// REDIRECT alias TO POINT FROM oldIndexName TO newIndexName
////////////////////////////////////////////////////////////////////////////////
ETL.updateAlias=function(etl){


	//UPDATE THE AUTO-INDEXING TO EVERY SECOND
	yield (ElasticSearch.setRefreshInterval(etl.newIndexName, "1s"));

	var a=Log.action("Change alias pointers");

	//MAKE ALIAS
	yield (Rest.post({
		"url":ElasticSearch.pushURL+"/_aliases",
		"data":{
			"actions":[
				{"add":{"index":etl.newIndexName, "alias":etl.aliasName}}
			]
		}
	}));

	if (etl.oldIndexName!==undefined && etl.oldIndexName!=etl.newIndexName){
		try{
			yield (Rest.post({
				"url":ElasticSearch.pushURL+"/_aliases",
				"data":{
					"actions":[
						{"remove":{"index":etl.oldIndexName, "alias":etl.aliasName}}
					]
				}
			}));
		}catch(e){
			Log.warning("Could not remove alias from "+etl.oldIndexName, e);
		}//try
	}//endif

};


ETL.getMaxBugID=function(){
	var maxResults=yield(ESQuery.run({
		"select":{"name":"bug_id", "value":"bug_id", "aggregate":"maximum"},
		"from" : "bugs",
		"edges":[]
	}));
	yield maxResults.cube.bug_id;
};//method




ETL.newInsert=function(etl){

	yield (etl.makeSchema());
	yield (ETL.removeOldIndexes(etl));

	//DO NOT UPDATE INDEX WHILE DOING THE BULK LOAD
	yield (ElasticSearch.setRefreshInterval(etl.newIndexName, "-1"));

	var maxBug=yield(ETL.getMaxBugID());
	var maxBatches=aMath.floor(maxBug/etl.BATCH_SIZE);

	if (etl.start) yield (etl.start());

	yield(ETL.insertBatches(etl, 0, maxBatches, maxBatches));

	if (etl.postMarkup) yield (etl.postMarkup());

	yield(ETL.updateAlias(etl));
	Log.action("Success!");
};



ETL.resumeInsert=function(etl){
	//MAKE SCHEMA
	yield (ETL.removeOldIndexes(etl));

	if (etl.newIndexName==etl.oldIndexName){
		ETL.newInsert(etl);
		return;
	}//endif

	//GET THE MAX AND MIN TO FIND WHERE TO START
	var maxResults=yield(ESQuery.run({
		"url":ElasticSearch.pushURL+"/"+etl.newIndexName+"/"+etl.typeName,
		"from":etl.aliasName,
		"select":[
			{"name":"maxBug", "value":"bug_id", "aggregate":"maximum"},
			{"name":"minBug", "value":"bug_id", "aggregate":"minimum"}
			]
	}));

	var minBug=maxResults.cube.minBug;
	var maxBug=maxResults.cube.maxBug;
	if (!isFinite(minBug)){
		minBug=yield (ETL.getMaxBugID());
		maxBug=minBug;
	}//endif
//Log.warning("minbug set to 750000");
//minBug=750000;

	if (etl.resume) yield (etl.resume());

	var toBatch=aMath.floor(minBug/etl.BATCH_SIZE);

	yield (ETL.insertBatches(etl, 0, toBatch, aMath.floor(maxBug/etl.BATCH_SIZE)));

	if (etl.postMarkup) yield (etl.postMarkup());

	yield (ETL.updateAlias(etl));

	Log.action("Success!");
};


//SET THE etl.newIndexName TO THE INDEX BEING USED BY etl.aliasName
ETL.getCurrentIndex=function(etl){

	var data = yield(Rest.get({url: ElasticSearch.pushURL + "/_aliases"}));
	Log.note(data);
	var keys = Object.keys(data);
	for(var k = keys.length; k--;){
		var name = keys[k];
		if (!name.startsWith(etl.aliasName)) continue;
		if (Object.keys(data[name].aliases).length > 0){
			etl.newIndexName = name;
		}//endif
	}//for

};//method


//UPDATE BUG_TAGS THAT MAY HAVE HAPPENED AFTER startTime
ETL.incrementalInsert=function(etl){

	yield (ETL.getCurrentIndex(etl));
	if (etl.newIndexName===undefined) Log.error("No index found! (Initial ETL not completed?)");
	var startTime=yield (etl.getLastUpdated());

	if (etl.resume) yield (etl.resume());


	//FIND RECENTLY TOUCHED BUGS
	var a=Log.action("Get changed bugs", true);
	var data=yield (ESQuery.run({
		"from":"bugs",
		"select":{"name":"bug_id", "value":"bug_id", "aggregate":"count"},
		"edges":[
			{"name":"bug_ids", "value":"bug_id"}
		],
		"esfilter":{
			"range":{"modified_ts":{"gte":startTime.addHour(-4).getMilli()}}
		}
	}));
	Log.actionDone(a);


	var buglist=[]=data.edges[0].domain.partitions.map(function(v,i){
		return v.value;
	});
	Log.note(buglist.length+" bugs found: "+JSON.stringify(buglist));
	//FIND EXISTING RECORDS FOR THOSE BUGS

	//GET NEW RECORDS FOR THOSE BUGS
	var batches=buglist.groupBy(etl.BATCH_SIZE);
	for(var b=0;b<batches.length;b++){
		a=Log.action("get changed bugs", true);
		var batch=batches[b].values;
		var bugSummaries=yield (etl.get(batch, null));
		Log.actionDone(a);

		a=Log.action("insert changed bugs", true);
		yield (etl.insert(bugSummaries));
		Log.actionDone(a);
	}//for

	if (etl.postMarkup) yield (etl.postMarkup());

	Log.note("Done incremental update");
};


ETL.insertBatches=function(etl, fromBatch, toBatch, maxBatch){
	if (aMath.isNaN(toBatch)) toBatch=1000000;
	if (aMath.isNaN(maxBatch)) maxBatch=1000000;

	for(var b=toBatch;b>=fromBatch;b--){
		var data=yield (etl.get(b*etl.BATCH_SIZE, (b+1)*etl.BATCH_SIZE));
		if (data instanceof Array && data.length==0) continue;
		yield (etl.insert(data));
		Log.note("Done batch "+b+"/"+maxBatch+" (from "+(b*etl.BATCH_SIZE)+" to "+((b+1)*etl.BATCH_SIZE)+") into "+etl.newIndexName);
	}//for
};//method


//insert MUST BE AN ARRAY OF STRINGS WHICH WILL BE CONCATENATED WITH \n AND
//LIMITED TO 10MEG CHUNKS AND SENT TO insertFunction FOR PROCESSING
ETL.chunk=function(insert, insertFunction){
//ES HAS 100MB LIMIT, BREAK INTO SMALLER CHUNKS
	var threads=[];

	if (insert.length==0) yield(null);
	var bytes = 0;
	var e = insert.length;
	for(var s = insert.length; s -= 2;){
		bytes += insert[s].length + insert[s + 1].length + 2;
		if (bytes > 5 * 1024 * 1024){//STOP AT 10 MEGS
			s += 2;	//NOT THE PAIR THAT PUT IT OVER

			var data = insert.substring(s, e).join("\n") + "\n";
			threads.push(Thread.run("insert some data", insertFunction(data)));

			e = s;
			bytes = 0;
		}//endif
	}//for

	data = insert.substring(0, e).join("\n") + "\n";
	threads.push(Thread.run("insert some data", insertFunction(data)));

	for(var t=threads.length;t--;){
		yield (Thread.join(threads[t]));
	}//for

};

ETL.parseWhiteBoard=function(whiteboard){
	if (whiteboard==null || whiteboard===undefined)
		return "";
	return whiteboard.split("[").map(function(v, i){
		var index=v.indexOf("]");
		if (index==-1) index=v.indexOf(" ");
		if (index==-1) index=v.length;
		return v.substring(0, index).trim().toLowerCase();
	}).join(" ");
};


// GET THE cf_* FLAGS FROM THE bug_history DOCUMENTS
ETL.getFlags=function(){
	var getFlags = "var _cf_ = \"\";\n";
	ETL.allFlags.map(function(v){
		getFlags += "_cf_+=getFlagValue(" + MVEL.Value2MVEL(v) + ");\n";
//		getFlags += "if (" + v + "\"]!=null && " + v + "\"].value!=null) output+=\" " + v + "\"+" + v + "\"].value.trim();\n";
	});
	getFlags += "_cf_ = _cf_.trim();\n_cf_;";
	return getFlags;
};//method




