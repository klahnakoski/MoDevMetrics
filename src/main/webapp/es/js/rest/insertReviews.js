

var esReviews={};

esReviews.BATCH_SIZE=20000;

esReviews.makeSchema=function(){
	//MAKE SCHEMA
	esReviews.aliasName="reviews";
	esReviews.indexName="reviews"+Date.now().format("yyMMdd_HHmmss");
	esReviews.typeName="review";

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"bug_id":{"type":"integer", "store":"yes", "index":"analyzed"},
		"attach_id":{"type":"integer", "store":"yes", "index":"analyzed"},
		"requester":{"type":"string", "store":"yes", "index":"analyzed"},
		"reviewer":{"type":"string", "store":"yes", "index":"analyzed"},
		"request_time":{"type":"long", "store":"yes", "index":"analyzed"},
		"review_time":{"type":"long", "store":"yes", "index":"analyzed"}
	};

	var setup={
		"mappings":{
		}
	};
	setup.mappings[esReviews.typeName]=config;


	ElasticSearch.request(ElasticSearch.baseURL+"/"+esReviews.indexName, setup, function(data){
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
				var keys=Object.keys(data);
				for(var k=keys.length;k--;){
					var name=keys[k];
					if (!name.startsWith(esReviews.aliasName)) continue;
					if (name==esReviews.indexName) continue;

					if (Object.keys(data[name].aliases).length>0){
						esReviews.lastAlias=name;
						continue;
					}//endif

					//OLD, REMOVE IT
//					$.ajax({
//						url: ElasticSearch.baseURL+"/"+name,
//						type: "DELETE",
//						dataType: "json",
//
//						success: function(data){},
//						error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);}
//					});
				}//for

			},
			error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);}
		});

		var maxBugQuery=new ESQuery({
			"select": {"name":"bug_id", "value":"bugs.bug_id", "operation":"maximum"},
			"from" : "bugs",
			"edges" :[]
		});

		maxBugQuery.run(function(maxResults){
			var maxBug=maxResults.data.bug_id;
			var maxBatches=Math.floor(maxBug/esReviews.BATCH_SIZE);

			esReviews.insertBatch(maxBatches);
		});
	});






};


//esReviews.getAllReviews=function(){
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



esReviews.getReviews=function(minBug, maxBug, successFunction){


	var esQuery=new ESQuery({
		"select" : [
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"attach_id", "value":"bugs.attachments.attach_id"},
			{"name":"modified_ts", "value":"bugs.modified_ts"},
			{"name":"requestee", "value":"bugs.attachments.flags.requestee"},
			{"name":"modified_by", "value":"bugs.attachments.flags.modified_by"}
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
			{"range":{"bug_id":{"gte":minBug, "lt":maxBug}}}
	});



	var esQuery2 = new ESQuery({
		"select" : [
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"attach_id", "value":"bugs.attachments.attach_id"},
			{"name":"modified_ts", "value":"bugs.attachments[\"attachments.isobsolete\"]==1 ? bugs.attachments.modified_ts : ((bugs.bug_status=='resolved'||bugs.bug_status=='verified'||bugs.bug_status=='closed') ? bugs.modified_ts : bugs.attachments.flags.modified_ts)"},
			{"name":"requestee", "value":"bugs.attachments.flags.requestee"},
			{"name":"modified_by", "value":"bugs.attachments.flags.modified_by"},
			{"name":"done_reason", "value":"bugs.attachments[\"attachments.isobsolete\"]==1 ? 'obsolete' : ((bugs.bug_status=='resolved'||bugs.bug_status=='verified'||bugs.bug_status=='closed') ? 'closed':'done')"}
		],
		"from":
			"bugs.attachments.flags",
		"where":
			{"and" : [
				{"not":{"missing":{"field":"bugs.attachments.flags.request_type", "existence":true, "null_value":true}}},
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
			{"range":{"bug_id":{"gte":minBug, "lt":maxBug}}}
	});

	//REVIEWS END WHEN REASSIGNED TO SOMEONE ELSE
	var esQuery3 = new ESQuery({
		"select" : [
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"attach_id", "value":"bugs.changes.attach_id"},
			{"name":"modified_ts", "value":"bugs.modified_ts"},
			{"name":"requestee", "value":"bugs.changes.field_value_removed"},
			{"name":"modified_by", "value":"null"},
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
			{"range":{"bug_id":{"gte":minBug, "lt":maxBug}}}
	});


	////////////////////////////////////////////////////////////////////////
	status.message("Get Review Requests");
	esQuery.run(function(inReview){
	status.message("Get Review Ends");
	esQuery2.run(function(doneReview){
	status.message("Get Review Re-assignments");
	esQuery3.run(function(switchedReview){
	////////////////////////////////////////////////////////////////////////

	status.message("processing Data");


//	D.println(CNV.List2Tab(inReview.list));
//	D.println(CNV.List2Tab(doneReview.list));
//	D.println(CNV.List2Tab(switchedReview.list));

	doneReview.list.appendArray(switchedReview.list);


	var reviewQueues = new CUBE().calc2List({
		"from":
			inReview.list,
		"select":[
//				{"name":"close_record", "order":["doneReview.end_time", ""]},
			{"name":"review_time", "value":"new Date(Util.coalesce(doneReview.modified_ts, Date.now().getMilli()))", "operation":"minimum"}
		],
		"edges":[
			{"name":"bug_id", "value":"bug_id"},
			{"name":"attach_id", "value":"attach_id"},
			{"name":"reviewer", "value":"requestee"},
			{"name":"requester", "value":"modified_by"},
			{"name":"request_time", "value":"new Date(modified_ts)"},
			{"name":"close_record",
				"test":"bug_id==doneReview.bug_id && attach_id==doneReview.attach_id && requestee==doneReview.requestee && modified_ts<=doneReview.modified_ts",
				allowNulls:true,
				"domain":{"type":"set", "name":"doneReview", "key":[], "partitions":doneReview.list}
			}
		]

	}).list;


	status.message("Done");
	successFunction(reviewQueues);
		
	////////////////////////////////////////////////////////////////////////
	});
	});
	});
	////////////////////////////////////////////////////////////////////////

};//method



esReviews.insertBatch=function(b){

	var list=esReviews.getReviews(b*esReviews.BATCH_SIZE, (b+1)*esReviews.BATCH_SIZE, function(reviews){
		var insert="";
		reviews.forall(function(r, i){
			insert+=
				JSON.stringify({ "create" : { "_id" : b*esReviews.BATCH_SIZE+i } })+"\n"+
				JSON.stringify(r)+"\n"
			;
		});
		status.message("Push review queues to ES");
		ElasticSearch.request(ElasticSearch.baseURL+"/"+esReviews.indexName+"/"+esReviews.typeName+"/_bulk", insert, function(result){
			if (b>0){
				esReviews.insertBatch(b-1);
			}else{//WHEN ALL BUGS HAVE BEEN PROCESSED...
				status.message("Done bulk load, change alias pointer");
				//MAKE ALIAS FROM reviews
				var rename={
					"actions":[
						{"add":{"index":esReviews.indexName, "alias":esReviews.aliasName}}
					]
				};
				if (esReviews.lastAlias!==undefined){
					rename.actions.push({"delete":{"index":esReviews.lastAlias, "alias":esReviews.aliasName}});
				}//endif

				ElasticSearch.request(ElasticSearch.baseURL+"/_aliases", rename, function(result){
					status.message("Success!");
					D.println(result);
				});
			}//endif
		});
	});
};//method