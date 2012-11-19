ETL={};

ETL.BATCH_SIZE=20000;


////////////////////////////////////////////////////////////////////////////////
// REDIRECT alias TO POINT FROM oldIndexName TO newIndexName
////////////////////////////////////////////////////////////////////////////////
ETL.updateAlias=function(etl){
	var alias=etl.aliasName;
	var oldIndexName=etl.lastAlias;
	var newIndexName=etl.indexName;

	status.message("Done bulk load, change alias pointer");
	//MAKE ALIAS FROM reviews
	var param={
		"url":ElasticSearch.baseURL+"/_aliases",
		"data":{
			"actions":[
				{"add":{"index":newIndexName, "alias":alias}}
			]
		}
	};

	if (oldIndexName!==undefined){
		param.data.actions.push({"remove":{"index":oldIndexName, "alias":alias}});
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
	yield (etl.makeSchema());

	var maxBug=yield(ETL.getMaxBugID());
	var maxBatches=Math.floor(maxBug/ETL.BATCH_SIZE);

	yield(ETL.insertBatches(etl, 0, maxBatches));
	yield(ETL.updateAlias(etl));
	status.message("Success!");
};



ETL.resumeInsert=function(etl){
	//MAKE SCHEMA

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	var data=yield(Rest.get({url: ElasticSearch.baseURL+"/_aliases"}));

	D.println(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(etl.aliasName)) continue;

		if (Object.keys(data[name].aliases).length>0){
			etl.lastAlias=name;
		}//endif

		if (etl.lastInsert===undefined || name>etl.lastInsert){
			etl.lastInsert=name;
		}//endif
	}//for

	if (etl.lastInsert===undefined || etl.lastInsert==etl.lastAlias){
		yield (etl.newInsert());
		yield null;
	}//endif

	etl.indexName=etl.lastInsert;

	//GET THE MAX AND MIN TO FIND WHERE TO START
	ESQuery.INDEXES.reviews={"path":"/"+etl.lastInsert+"/"+etl.typeName};
	var maxResults=yield(ESQuery.run({
		"from":"reviews",
		"select":[
			{"name":"maxBug", "value":"reviews.bug_id", "operation":"maximum"},
			{"name":"minBug", "value":"reviews.bug_id", "operation":"minimum"}
			]
	}));

	var minBug=maxResults.cube.minBug;
	var maxBatches=Math.floor(minBug/ETL.BATCH_SIZE)-1;

	yield (ETL.insertBatches(etl, 0, maxBatches));
	yield (ETL.updateAlias(etl));
	ESQuery.INDEXES.reviews={"path":"/"+etl.indexName+"/"+etl.typeName};
	status.message("Success!");
};



//UPDATE BUG_SUMMARY THAT MAY HAVE HAPPENED AFTER startTime
ETL.incrementalInsert=function(etl, startTime){

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

	//FIND REVIEW QUEUES ON THOSE BUGS
	var bugSummaries=yield (etl.get(buglist, null));

	yield (etl["delete"](buglist));
	yield (etl.insert(bugSummaries));
	status.message("Done");
	D.println("Done incremental update");
};


ETL.insertBatches=function(etl, minBatch, maxBatch){
	for(var b=maxBatch;b>=0;b--){
		var reviews=yield (etl.get(b*ETL.BATCH_SIZE, (b+1)*ETL.BATCH_SIZE));
		yield (etl.insert(reviews));
		D.println("Done batch "+b+"/"+maxBatch+" into "+etl.indexName);
	}//for
};//method

