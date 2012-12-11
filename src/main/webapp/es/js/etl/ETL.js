ETL={};




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



	status.message("Done bulk load, change alias pointer");
	//MAKE ALIAS FROM reviews
	var param={
		"url":ElasticSearch.pushURL+"/_aliases",
		"data":{
			"actions":[
				{"add":{"index":etl.newIndexName, "alias":etl.aliasName}}
			]
		}
	};

	if (etl.oldIndexName!==undefined){
		param.data.actions.push({"remove":{"index":etl.oldIndexName, "alias":etl.aliasName}});
	}//endif

	yield (Rest.post(param));
};


ETL.getMaxBugID=function(){
	var maxResults=yield(ESQuery.run({
		"select": {"name":"bug_id", "value":"bugs.bug_id", "operation":"maximum"},
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
	var maxBatches=Math.floor(maxBug/etl.BATCH_SIZE);

	yield(ETL.insertBatches(etl, 0, maxBatches, maxBatches));

	if (etl.postMarkup) yield (etl.postMarkup());

	yield(ETL.updateAlias(etl));
	status.message("Success!");
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
		"from":"temp",
		"select":[
			{"name":"maxBug", "value":"temp.bug_id", "operation":"maximum"},
			{"name":"minBug", "value":"temp.bug_id", "operation":"minimum"}
			]
	}));

	var minBug=maxResults.cube.minBug;
	var maxBug=maxResults.cube.maxBug;
	if (!isFinite(minBug)){
		minBug=yield (ETL.getMaxBugID());
		maxBug=minBug;
	}//endif
	var toBatch=Math.floor(minBug/etl.BATCH_SIZE)-1;

	yield (ETL.insertBatches(etl, 0, toBatch, Math.floor(maxBug/etl.BATCH_SIZE)));

	if (etl.postMarkup) yield (etl.postMarkup());

	yield (ETL.updateAlias(etl));

	status.message("Success!");
};



//UPDATE BUG_TAGS THAT MAY HAVE HAPPENED AFTER startTime
ETL.incrementalInsert=function(etl){

	//FIND CURRENT ALIAS
	data = yield(Rest.get({url: ElasticSearch.pushURL + "/_aliases"}));
	D.println(data);
	var keys = Object.keys(data);
	for(var k = keys.length; k--;){
		var name = keys[k];
		if (!name.startsWith(etl.aliasName)) continue;
		if (Object.keys(data[name].aliases).length > 0){
			etl.newIndexName = name;
		}//endif
	}//for

	var startTime=yield (etl.getLastUpdated());

	//FIND RECENTLY TOUCHED BUGS
	var data=yield (ESQuery.run({
		"from":"bugs",
		"select": {"name":"bug_id", "value":"bug_id", "operation":"count"},
		"edges":[
			{"name":"bug_ids", "value":"bug_id"}
		],
		"esfilter":{
			"range":{"modified_ts":{"gte":startTime.getMilli()}}
		}
	}));

	var buglist=[]=data.edges[0].domain.partitions.map(function(v,i){
		return v.value;
	});
	D.println(buglist.length+" bugs found: "+JSON.stringify(buglist));
	//FIND EXISTING RECORDS FOR THOSE BUGS

	//GET NEW RECORDS FOR THOSE BUGS
	var bugSummaries=yield (etl.get(buglist, null));

//	status.message("remove changed bugs");
//	yield (etl["delete"](buglist));
	status.message("insert changed bugs");
	yield (etl.insert(bugSummaries));

	if (etl.postMarkup) yield (etl.postMarkup());

	status.message("Done");
	D.println("Done incremental update");
};


ETL.insertBatches=function(etl, fromBatch, toBatch, maxBatch){
//	var maxConcurrent=3;
//	var numRemaining=maxBatch+1;

	for(var b=toBatch;b>=fromBatch;b--){
		//RUNNING MORE THAN ONE JUST CRASHES BROWSER
//		while(numRemaining>b+maxConcurrent){
//			//LIMIT REQUESTS
//			yield (aThread.sleep(100));
//		}//while

//		(function(b){
//			aThread.run(function(){
				var data=yield (etl.get(b*etl.BATCH_SIZE, (b+1)*etl.BATCH_SIZE));
				yield (etl.insert(data));
				D.println("Done batch "+b+"/"+maxBatch+" into "+etl.newIndexName);
//				numRemaining--;
//			});
//		})(b);
	}//for

//	while(numRemaining>0){
//		yield (aThread.sleep(100));
//	}//while

	yield (null);
};//method


//insert MUST BE AN ARRAY OF STRINGS WHICH WILL BE CONCATENATED WITH \n AND
//LIMITED TO 10MEG CHUNKS AND SENT TO insertFunction FOR PROCESSING
ETL.chunk=function(insert, insertFunction){
//ES HAS 100MB LIMIT, BREAK INTO SMALLER CHUNKS
	var bytes = 0;
	var e = insert.length;
	for(var s = insert.length; s -= 2;){
		bytes += insert[s].length + insert[s + 1].length + 2;
		if (bytes > 10 * 1024 * 1024){//STOP AT 10 MEGS
			s += 2;	//NOT THE PAIR THAT PUT IT OVER

			var data = insert.substring(s, e).join("\n") + "\n";
			insertFunction(data);

			e = s;
			bytes = 0;
		}//endif
	}//for

	data = insert.substring(0, e).join("\n") + "\n";
	insertFunction(data);
};


ETL.parseWhiteBoard=function(whiteboard){
	return whiteboard.split("[").map(function(v, i){
		var index=v.indexOf("]");
		if (index==-1) index=v.indexOf(" ");
		if (index==-1) index=v.length;
		return v.substring(0, index).trim().toLowerCase();
	}).join(" ");
};
