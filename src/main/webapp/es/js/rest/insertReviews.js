

var REVIEWS={};

REVIEWS.BATCH_SIZE=20000;

REVIEWS.aliasName="reviews";
REVIEWS.typeName="review";



REVIEWS.makeSchema=function(successFunction){
	//MAKE SCHEMA
	REVIEWS.indexName="reviews"+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"properties":{
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"attach_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"requester":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"reviewer":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"request_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"review_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"done_reason":{"type":"string", "store":"yes", "index":"not_analyzed"}
		}
	};

	var setup={
		"mappings":{
		}
	};
	setup.mappings[REVIEWS.typeName]=config;


	ElasticSearch.post(ElasticSearch.baseURL+"/"+REVIEWS.indexName, setup, function(data){
		D.println(data);

//		var lastAlias;  		//THE VERSION CURRENTLY IN USE

		//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
		$.ajax({
			url: ElasticSearch.baseURL+"/_aliases",
			type: "GET",
			dataType: "json",

			success: function(data){
				D.println(data);

				//REMOVE ALL BUT MOST RECENT REVIEW
//				ForAllKeys(data, function(name){
//
//				});
				var keys=Object.keys(data);
				for(var k=keys.length;k--;){
					var name=keys[k];
					if (!name.startsWith(REVIEWS.aliasName)) continue;
					if (name==REVIEWS.indexName) continue;

					if (REVIEWS.lastInsert===undefined || name>REVIEWS.lastInsert){
						REVIEWS.lastInsert=name;
					}//endif

					if (Object.keys(data[name].aliases).length>0){
						REVIEWS.lastAlias=name;
						continue;
					}//endif

					//OLD, REMOVE IT
					$.ajax({
						url: ElasticSearch.baseURL+"/"+name,
						type: "DELETE",
						dataType: "json",

						success: function(data){},
						error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);}
					});
				}//for

				successFunction();

			},
			error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);}
		});

	});
};


REVIEWS.updateAlias=function(){
	status.message("Done bulk load, change alias pointer");
	//MAKE ALIAS FROM reviews
	var rename={
		"actions":[
			{"add":{"index":REVIEWS.indexName, "alias":REVIEWS.aliasName}}
		]
	};
	if (REVIEWS.lastAlias!==undefined){
		rename.actions.push({"remove":{"index":REVIEWS.lastAlias, "alias":REVIEWS.aliasName}});
	}//endif

	ElasticSearch.post(ElasticSearch.baseURL+"/_aliases", rename, function(result){
		status.message("Success!");
		D.println(result);
	});
};



REVIEWS.newInsert=function(){

	REVIEWS.makeSchema(function(){
		var maxBugQuery=new ESQuery({
			"select": {"name":"bug_id", "value":"bugs.bug_id", "operation":"maximum"},
			"from" : "bugs",
			"edges" :[]
		});

		maxBugQuery.run(function(maxResults){
			var maxBug=maxResults.data.bug_id;
			var maxBatches=Math.floor(maxBug/REVIEWS.BATCH_SIZE);
//			maxBatches=32;
			REVIEWS.insertBatch(0, maxBatches, REVIEWS.updateAlias);
		});
	});
};


REVIEWS.resumeInsert=function(){
	//MAKE SCHEMA

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	$.ajax({
		url: ElasticSearch.baseURL+"/_aliases",
		type: "GET",
		dataType: "json",
		error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);},
		success: function(data){
			D.println(data);

			var keys=Object.keys(data);
			for(var k=keys.length;k--;){
				var name=keys[k];
				if (!name.startsWith(REVIEWS.aliasName)) continue;

				if (Object.keys(data[name].aliases).length>0){
					REVIEWS.lastAlias=name;
				}//endif

				if (REVIEWS.lastInsert===undefined || name>REVIEWS.lastInsert){
					REVIEWS.lastInsert=name;
				}//endif
			}//for

			if (REVIEWS.lastInsert===undefined || REVIEWS.lastInsert==REVIEWS.lastAlias){
				return REVIEWS.newInsert();
			}//endif
			REVIEWS.indexName=REVIEWS.lastInsert;

			//GET THE MAX AND MIN TO FIND WHERE TO START
			var q=new ESQuery({
				"from":"reviews",
				"select":[
					{"name":"maxBug", "value":"reviews.bug_id", "operation":"maximum"},
					{"name":"minBug", "value":"reviews.bug_id", "operation":"minimum"}
					]
			});
			ESQuery.INDEXES.reviews={"path":"/"+REVIEWS.lastInsert+"/"+REVIEWS.typeName};
			q.run(function(maxResults){
				var minBug=maxResults.data.minBug;
				var maxBatches=Math.floor(minBug/REVIEWS.BATCH_SIZE)-1;
				REVIEWS.insertBatch(0, maxBatches, REVIEWS.updateAlias);
			});

		}//success
	});
};


REVIEWS.incrementalInsert=function(howFarBack){
	var d=Duration.newInstance(howFarBack);
	d.milli=Math.abs(d.milli);
	d.month=Math.abs(d.month);
	var startTime=Date.now().subtract(d);

	//FIND RECENTLY TOUCHED BUGS
	var q=new ESQuery({
		"from":"bugs",
		"select": {"name":"bug_id", "value":"bug_id", "operation":"count"},
		"edges":[
			{"name":"bug_ids", "value":"bug_id"}
		],
		"esfilter":{
			"range":{"modified_ts":{"gte":startTime.getMilli()}}
		}
	});
	q.run(function(data){
		var buglist=[];
		data.edges[0].domain.partitions.forall(function(v,i){
			buglist.push(v.value);
		});

		//FIND REVIEW QUEUES ON THOSE BUGS
		REVIEWS.getReviews(buglist, null, function(reviews){
			REVIEWS.deleteReviews(buglist, function(){
				REVIEWS.insertReviews(reviews, function(){
					status.message("Done");
					D.println("Done incremental update");
				});
			});
		});
	});
};


//REVIEWS.getAllReviews=function(){
//
//	return [
//		//INSERT A REVIEW
//		{
//			"bug_id":100,
//			"attach_id":101,
//			"request_time":Date.now().addHour(-2).getMilli(),
//			"review_time":Date.now().addHour(-2).getMilli(),
//			"requester":"kyle",
//			"reviewer":"joe"
//		}
//	];
//
//
//
//};



REVIEWS.getReviews=function(minBug, maxBug, successFunction){

	//DETERMINE IF WE ARE LOOKING AT A RANGE, OR A SPECIFIC SET, OF BUGS
	var esfilter;
	if (maxBug===undefined || maxBug==null){
		esfilter={"terms":{"bug_id":minBug}};
	}else{
		esfilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
	}//endif



	var esQuery=new ESQuery({
		"select" : [
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"attach_id", "value":"bugs.attachments.attach_id"},
			{"name":"modified_ts", "value":"bugs.modified_ts"},
			{"name":"requestee", "value":"bugs.attachments.flags.requestee"},
			{"name":"modified_by", "value":"bugs.attachments.flags.modified_by"},
			{"name":"product", "value":"bugs.product"},
			{"name":"component", "value":"bugs.component"},
			{"name":"bug_status", "value":"(bugs.bug_status=='resolved'||bugs.bug_status=='verified'||bugs.bug_status=='closed') ? 'closed':'open'"}
		],
		"from":
			"bugs.attachments.flags",
		"where":
			{"and" : [
				{"terms" : {"bugs.attachments.flags.request_status" : ["?"]}},
				{"terms" : {"bugs.attachments.flags.request_type" : ["review", "superreview"]}},
				{"script" :{"script":"bugs.attachments.flags.modified_ts==bugs.modified_ts"}},
				{"term":{"bugs.attachments[\"attachments.isobsolete\"]" : 0}}
			]},
		"esfilter":
			esfilter
	});



	var esQuery2 = new ESQuery({
		"select" : [
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"attach_id", "value":"bugs.attachments.attach_id"},
			{"name":"modified_ts", "value":"maximum(bugs.modified_ts, maximum(bugs.attachments.modified_ts, bugs.attachments.flags.modified_ts))"},
			{"name":"requestee", "value":"bugs.attachments.flags.requestee"},
			{"name":"modified_by", "value":"bugs.attachments.flags.modified_by"},
			{"name":"product", "value":"bugs.product"},
			{"name":"component", "value":"bugs.component"},
			{"name":"done_reason", "value":"bugs.attachments.flags.request_status!='?' ? 'done' : (bugs.attachments[\"attachments.isobsolete\"]==1 ? 'obsolete' : 'closed')"}
		],
		"from":
			"bugs.attachments.flags",
		"where":
			{"and" : [
				{"not":{"missing":{"field":"bugs.attachments.flags.request_type", "existence":true, "null_value":true}}},
//				{"term":{"bugs.attachments.attach_id":"420463"}},
				{"terms" : {"bugs.attachments.flags.request_type" : ["review", "superreview"]}},
				{"or" : [
					{ "and" : [//IF THE REQUESTEE SWITCHED THE ? FLAG, THEN IT IS DONE
						{"not": {"terms" : {"bugs.attachments.flags.request_status" : ["?"]}}}
					]},
					{"and":[//IF OBSOLEETED THE ATTACHMENT, IT IS DONE
						{"term":{"bugs.attachments[\"attachments.isobsolete\"]" : 1}},
						{"not":{"missing":{"field":"bugs.previous_values", "existence":true, "null_value":true}}},
						{"term":{"bugs.previous_values[\"attachments.isobsolete_values\"]" : 0}}
					]},
					{ "and" : [//SOME BUGS ARE CLOSED WITHOUT REMOVING REVIEW
						{"terms" : {"bugs.bug_status" : ["resolved", "verified", "closed"]}},
						{"not":{"missing":{"field":"bugs.previous_values", "existence":true, "null_value":true}}},
						{"not":{"missing":{"field":"bugs.previous_values.bug_status_value", "existence":true, "null_value":true}}},
						{"not": {"terms":{"bugs.previous_values.bug_status_value": ["resolved", "verified", "closed"]}}}
					]}
				]}
			]},
		"esfilter":
			esfilter
	});

	//REVIEWS END WHEN REASSIGNED TO SOMEONE ELSE
	var esQuery3 = new ESQuery({
		"select" : [
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"attach_id", "value":"bugs.changes.attach_id"},
			{"name":"modified_ts", "value":"bugs.modified_ts"},
			{"name":"requestee", "value":"bugs.changes.field_value_removed"},
			{"name":"modified_by", "value":"null"},
			{"name":"product", "value":"bugs.product"},
			{"name":"component", "value":"bugs.component"},
			{"name":"done_reason", "value":"'reasigned'"}
		],
		"from":
			"bugs.changes",
		"where":
			{"and":[//ONLY LOOK FOR NAME CHANGES IN THE "review?" FIELD
				{"term":{"bugs.changes.field_name":"flags"}},
				{"or":[
					{"prefix":{"bugs.changes.field_value":"review?"}},
					{"prefix":{"bugs.changes.field_value":"superreview?"}}
				]},
				{"or":[
					{"prefix":{"bugs.changes.field_value_removed":"review?"}},
					{"prefix":{"bugs.changes.field_value_removed":"superreview?"}}
				]}
			]},
		"esfilter":
			esfilter
	});


	////////////////////////////////////////////////////////////////////////
	status.message("Get Review Requests");
	esQuery.run(function(inReview){
	status.message("Get Review Ends");
	esQuery2.run(function(doneReview){
	status.message("Get Review Re-assignments");
	esQuery3.run(function(switchedReview){
	////////////////////////////////////////////////////////////////////////

	status.message("processing Data...");
	D.println("start processing "+Date.now().format("HH:mm:ss"));

//	D.println(CNV.List2Tab(inReview.list));
//	D.println(CNV.List2Tab(doneReview.list));
//	D.println(CNV.List2Tab(switchedReview.list));

	doneReview.list.appendArray(switchedReview.list);


	var reviewQueues = new CUBE().calc2List({
		"from":
			inReview.list,
		"select":[
			{"name":"bug_status", "value":"bug_status", "operation":"one"},
			{"name":"review_time", "value":"Util.coalesce(doneReview.modified_ts, null)", "operation":"minimum"},
			{"name":"product", "value":"Util.coalesce(doneReview.product, product)", "operation":"minimum"},
			{"name":"component", "value":"Util.coalesce(doneReview.component, component)", "operation":"minimum"}
//			{"name":"is_first", "value":"rownum==1", "groupby":"bug_id", "sort":"request_time"}
		],
		"edges":[
			{"name":"bug_id", "value":"bug_id"},
			{"name":"attach_id", "value":"attach_id"},
			{"name":"reviewer", "value":"requestee"},
			{"name":"requester", "value":"modified_by"},
			{"name":"request_time", "value":"modified_ts"},
			{"name":"close_record",
				"test":
					"bug_id==doneReview.bug_id && "+
					"attach_id==doneReview.attach_id && "+
					"requestee==doneReview.requestee && "+
					"!(bug_status=='closed' && doneReview.done_reason=='closed') && "+
					"modified_ts<=doneReview.modified_ts",
				allowNulls:true,
				"domain":{"type":"set", "name":"doneReview", "key":[], "partitions":doneReview.list}
			}
		]

	}).list;


	D.println("end processing "+Date.now().format("HH:mm:ss"));
	status.message("Done");
	successFunction(reviewQueues);
		
	////////////////////////////////////////////////////////////////////////
	});
	});
	});
	////////////////////////////////////////////////////////////////////////

};//method


//PROCESS ALL BATCHES, IN REVERSE ORDER (NEWEST FIRST)
//MAKE SURE THE DEEPEST STACKTRACE IS USED FIRST, SO RESULTS CAN BE GCed
REVIEWS.insertBatch=function(b, max, workQueue){
	if (b>max){
		workQueue();
		return;
	}//endif

	REVIEWS.insertBatch(b+1, max, function(){
		REVIEWS.getReviews(b*REVIEWS.BATCH_SIZE, (b+1)*REVIEWS.BATCH_SIZE, function(reviews){
			REVIEWS.insertReviews(reviews, function(){
				D.println("Done batch "+b+" into "+REVIEWS.indexName);
				workQueue();
			});
		});
	});

};//method


REVIEWS.insertReviews=function(reviews, successFunction){
	var uid=Util.UID();
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : uid+"-"+i } }));
		insert.push(JSON.stringify(r));
	});
	status.message("Push review queues to ES");
	ElasticSearch.post(ElasticSearch.baseURL+"/"+REVIEWS.indexName+"/"+REVIEWS.typeName+"/_bulk", insert.join("\n"), successFunction);
};//method



REVIEWS.deleteReviews=function(bugList, successFunction){
	//DELETE REVIEWS OF THOSE BUGS FROM COPY
	$.ajax({
		url: ElasticSearch.baseURL+"/"+REVIEWS.aliasName+"/"+REVIEWS.typeName,
		type: "DELETE",
		dataType: "json",
		data: CNV.Object2JSON({"terms":{"bug_id": bugList}}),
		error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);},
		success: successFunction
	});
};//method