/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("../aLibrary.js");
importScript("../ESQuery.js");


ETL={};


aThread.run(function(){
	yield (ESQuery.loadColumns({"from":"bugs", "url":"http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/bug_version"}));

	ETL.allFlags = aThread.runSynchronously(CUBE.calc2List({
		"from":ESQuery.INDEXES.bugs.columns,
		"edges":["name"],
		"where":"name.startsWith('cf_')"
	})).list.map(function(v){return v.name;});
});


////////////////////////////////////////////////////////////////////////////////
// REDIRECT alias TO POINT FROM oldIndexName TO newIndexName
////////////////////////////////////////////////////////////////////////////////
ETL.updateAlias=function(etl){


	//UPDATE THE AUTO-INDEXING TO EVERY SECOND
	data=yield (Rest.put({
		"url": ElasticSearch.pushURL+"/"+etl.newIndexName+"/_settings",
		"data":{"index":{"refresh_interval":"1s"}}
	}));
	D.println(data);



	var a=D.action("Change alias pointer");
	//MAKE ALIAS FROM reviews
	var param={
		"url":ElasticSearch.pushURL+"/_aliases",
		"data":{
			"actions":[
				{"add":{"index":etl.newIndexName, "alias":etl.aliasName}}
			]
		}
	};

	if (etl.oldIndexName!==undefined && etl.oldIndexName!=etl.newIndexName){
		param.data.actions.push({"remove":{"index":etl.oldIndexName, "alias":etl.aliasName}});
	}//endif

	yield (Rest.post(param));
};


ETL.getMaxBugID=function(){
	var maxResults=yield(ESQuery.run({
		"select": {"name":"bug_id", "value":"bug_id", "operation":"maximum"},
		"from" : "bugs",
		"edges" :[]
	}));
	yield maxResults.cube.bug_id;
};//method




ETL.newInsert=function(etl){
	D.println("NEW INDEX CREATED");
	yield (etl.makeSchema());

	//DO NOT UPDATE INDEX WHILE DOING THE BULK LOAD
	data=yield (Rest.put({
		"url": ElasticSearch.pushURL+"/"+etl.newIndexName+"/_settings",
		"data":{"index":{"refresh_interval":"-1"}}
	}));
	D.println("Turn off indexing: "+CNV.Object2JSON(data));

	var maxBug=yield(ETL.getMaxBugID());
	var maxBatches=aMath.floor(maxBug/etl.BATCH_SIZE);

	yield(ETL.insertBatches(etl, 0, maxBatches, maxBatches));

	if (etl.postMarkup) yield (etl.postMarkup());

	yield(ETL.updateAlias(etl));
	D.action("Success!");
};



ETL.resumeInsert=function(etl){
	//MAKE SCHEMA

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	var data=yield(Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));

	D.println(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(etl.aliasName)) continue;

		if (Object.keys(data[name].aliases).length>0){
			etl.oldIndexName=name;
		}//endif

		if (etl.newIndexName===undefined || name>etl.newIndexName){
			etl.newIndexName=name;
		}//endif
	}//for

	if (etl.newIndexName===undefined || etl.newIndexName==etl.oldIndexName){
		yield (ETL.newInsert(etl));
		yield null;
	}//endif


	//GET THE MAX AND MIN TO FIND WHERE TO START
	var maxResults=yield(ESQuery.run({
		"url":ElasticSearch.pushURL+"/"+etl.newIndexName+"/"+etl.typeName,
		"from":etl.aliasName,
		"select":[
			{"name":"maxBug", "value":"bug_id", "operation":"maximum"},
			{"name":"minBug", "value":"bug_id", "operation":"minimum"}
			]
	}));

	var minBug=maxResults.cube.minBug;
	var maxBug=maxResults.cube.maxBug;
	if (!isFinite(minBug)){
		minBug=yield (ETL.getMaxBugID());
		maxBug=minBug;
	}//endif
//D.warning("minbug set to 750000");
//minBug=750000;
	var toBatch=aMath.floor(minBug/etl.BATCH_SIZE)-1;

	yield (ETL.insertBatches(etl, 0, toBatch, aMath.floor(maxBug/etl.BATCH_SIZE)));

	if (etl.postMarkup) yield (etl.postMarkup());

	yield (ETL.updateAlias(etl));

	D.action("Success!");
};


//SET THE etl.newIndexName TO THE INDEX BEING USED BY etl.aliasName
ETL.getCurrentIndex=function(etl){

	var data = yield(Rest.get({url: ElasticSearch.pushURL + "/_aliases"}));
	D.println(data);
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
	var startTime=yield (etl.getLastUpdated());


	//FIND RECENTLY TOUCHED BUGS
	var a=D.action("Get changed bugs", true);
	var data=yield (ESQuery.run({
		"from":"bugs",
		"select": {"name":"bug_id", "value":"bug_id", "operation":"count"},
		"edges":[
			{"name":"bug_ids", "value":"bug_id"}
		],
		"esfilter":{
			"range":{"modified_ts":{"gte":startTime.addHour(-1).getMilli()}}
		}
	}));
	D.actionDone(a);


	var buglist=[]=data.edges[0].domain.partitions.map(function(v,i){
		return v.value;
	});
	D.println(buglist.length+" bugs found: "+JSON.stringify(buglist));
	//FIND EXISTING RECORDS FOR THOSE BUGS

	//GET NEW RECORDS FOR THOSE BUGS
	var bugSummaries=yield (etl.get(buglist, null));

//	D.action("remove changed bugs");
//	yield (etl["delete"](buglist));				//NEVER DO THIS, ENSURE _id IS ALWAYS THE SAME
	a=D.action("insert changed bugs", true);
	yield (etl.insert(bugSummaries));
	D.actionDone(a);

	if (etl.postMarkup) yield (etl.postMarkup());

	D.println("Done incremental update");
};


ETL.insertBatches=function(etl, fromBatch, toBatch, maxBatch){
	for(var b=toBatch;b>=fromBatch;b--){
		var data=yield (etl.get(b*etl.BATCH_SIZE, (b+1)*etl.BATCH_SIZE));
		if (data.length>0){
			yield (etl.insert(data));
		}//endif
		D.println("Done batch "+b+"/"+maxBatch+" (from "+(b*etl.BATCH_SIZE)+" to "+((b+1)*etl.BATCH_SIZE)+") into "+etl.newIndexName);
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
			threads.push(aThread.run(insertFunction(data)));

			e = s;
			bytes = 0;
		}//endif
	}//for

	data = insert.substring(0, e).join("\n") + "\n";
	threads.push(aThread.run(insertFunction(data)));

	for(var t=threads.length;t--;){
		yield (aThread.join(threads[t]));
	}//for

};

ETL.parseWhiteBoard=function(whiteboard){
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
		getFlags += "_cf_+=getFlagValue(" + MVEL.Value2Code(v) + ");\n";
//		getFlags += "if (" + v + "\"]!=null && " + v + "\"].value!=null) output+=\" " + v + "\"+" + v + "\"].value.trim();\n";
	});
	getFlags += "_cf_ = _cf_.trim();\n_cf_;";
	return getFlags;
};//method




