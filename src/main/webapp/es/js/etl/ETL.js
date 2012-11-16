ETL={};

ETL.BATCH_SIZE=200;


////////////////////////////////////////////////////////////////////////////////
// REDIRECT alias TO POINT FROM oldIndexName TO newIndexName
////////////////////////////////////////////////////////////////////////////////
ETL.updateAlias=function(alias, oldIndexName, newIndexName){
	status.message("Done bulk load, change alias pointer");
	//MAKE ALIAS FROM reviews
	var rename={
		"actions":[
			{"add":{"index":newIndexName, "alias":alias}}
		]
	};
	if (oldIndexName!==undefined){
		rename.actions.push({"remove":{"index":oldIndexName, "alias":alias}});
	}//endif

	yield (Rest.post(ElasticSearch.baseURL+"/_aliases", rename));
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
	var maxBatches=Math.floor(maxBug/etl.BATCH_SIZE);

	yield(ETL.insertBatches(etl, 0, maxBatches));
	yield(etl.updateAlias());
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

	yield (etl.insertBatches(0, maxBatches));
	yield (etl.updateAlias());
	ESQuery.INDEXES.reviews={"path":"/"+etl.indexName+"/"+etl.typeName};
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
		D.println("Done batch "+b+" into "+REVIEWS.indexName);
	}//for
};//method

