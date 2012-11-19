

var REVIEWS={};

REVIEWS.aliasName="reviews";
REVIEWS.typeName="review";


REVIEWS.getLastUpdated=function(){
	var result=yield (ESQuery.run({
		"from":REVIEWS.aliasName,
		"select":[
			{"name":"last_request", "value":"reviews.request_time", "operation":"maximum"}
		]
	}));
	yield Date.newInstance(result.cube.last_request);
};


REVIEWS.makeSchema=function(successFunction){
	//MAKE SCHEMA
	REVIEWS.indexName=REVIEWS.aliasName+Date.now().format("yyMMdd_HHmmss");

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
			"done_reason":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"component":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"product":{"type":"string", "store":"yes", "index":"not_analyzed"}
		}
	};

	var setup={
		"mappings":{
		}
	};
	setup.mappings[REVIEWS.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.baseURL+"/"+REVIEWS.indexName,
		"data":setup
	}));
	D.println(data);

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.baseURL+"/_aliases"}));

	D.println(data);

	//REMOVE ALL BUT MOST RECENT REVIEW
	//				forAllKeys(data, function(name){
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
		yield (Rest["delete"]({url: ElasticSearch.baseURL+"/"+name}));
	}//for
};






REVIEWS.get=function(minBug, maxBug){

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


	status.message("Get Review Requests");
	var inReview=yield(esQuery.run());

	status.message("Get Review Ends");
	var doneReview=yield(esQuery2.run());

	status.message("Get Review Re-assignments");
	var switchedReview=yield(esQuery3.run());

	status.message("processing Data...");
	D.println("start processing "+Date.now().format("HH:mm:ss"));

//	D.println(CNV.List2Tab(inReview.list));
//	D.println(CNV.List2Tab(doneReview.list));
//	D.println(CNV.List2Tab(switchedReview.list));

	doneReview.list.appendArray(switchedReview.list);


	var reviewQueues = (yield (CUBE.calc2List({
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
				"allowNulls":true,
				"value":undefined,
				"domain":{"type":"set", "name":"doneReview", "key":[], "partitions":doneReview.list}
			}
		]

	}))).list;

	D.println("end processing "+Date.now().format("HH:mm:ss"));

	yield (reviewQueues);
};//method


REVIEWS.insert=function(reviews){
	var uid=Util.UID();
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : uid+"-"+i } }));
		insert.push(JSON.stringify(r));
	});
	status.message("Push review queues to ES");
	yield (Rest.post({
		"url":ElasticSearch.baseURL+"/"+REVIEWS.indexName+"/"+REVIEWS.typeName+"/_bulk",
		"data":insert.join("\n")
	}));
};//method



REVIEWS["delete"]=function(bugList){
	for(var i=0;i<bugList.length;i++){
		yield (Rest["delete"]({
			"url":ElasticSearch.baseURL+"/"+REVIEWS.aliasName+"/"+REVIEWS.typeName+"?q=bug_id:"+bugList[i]
		}));
	}//for
};//method
