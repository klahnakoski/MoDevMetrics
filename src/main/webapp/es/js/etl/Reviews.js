

var REVIEWS={};
REVIEWS.BATCH_SIZE=20000;
REVIEWS.aliasName="reviews";
REVIEWS.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
REVIEWS.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
REVIEWS.typeName="review";


REVIEWS.ALIASES=[
	{"name":"ben@netscape.com", "alias":"ben"},
	{"name":"bas.schouten@live.nl", "alias":"bas@basschouten.com"}
];



//aThread.run(function(){
//	ETL.allFlags = yield (CUBE.calc2List({
//		"from":CNV.Table2List(MozillaPrograms),
//		"edges":["attributeName"],
//		"where":"attributeName.startsWith('cf_')"
//	}));
//});


//CNV.Table2List(MozillaPrograms).map(function(v){
//	if (v.attributeName.startsWith("cf_")) return v.attributeName;
//});


REVIEWS.getLastUpdated=function(){
	var url;
	if (REVIEWS.newIndexName){
		url=ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/"+REVIEWS.typeName;
	}//endif


	var result=yield (ESQuery.run({
		"url":url,
		"from":REVIEWS.aliasName,
		"select":[
			{"name":"last_request", "value":"reviews.request_time", "operation":"maximum"}
		]
	}));
	yield Date.newInstance(result.cube.last_request);
};


REVIEWS.makeSchema=function(successFunction){
	//MAKE SCHEMA
	REVIEWS.newIndexName=REVIEWS.aliasName+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"_id" : {"type":"string", "store" : "yes", "index": "not_analyzed"},
		"properties":{
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"attach_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"requester":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"reviewer":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"request_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"review_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"done_reason":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"component":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"product":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"is_first":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"requester_review_num":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"keywords":{"type":"string", "store":"yes", "index":"analyzed", analyzer: 'whitespace'}
//			"status_whiteboard":{"type":"string", "store":"yes", "index":"not_analyzed"},
//			"status_whiteboard.tokenized":{"type":"string", "store":"yes", "index":"analyzed", analyzer: 'whitespace'}
		}
	};

	var setup={
		"analysis": {
			"analyzer": {
				"whitespace":{
					"type": "pattern",
					"pattern":"\\s+"
				}
			}
		},
		"mappings":{
		}
	};
	setup.mappings[REVIEWS.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+REVIEWS.newIndexName,
		"data":setup
	}));
	D.println(data);

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));

	D.println(data);

	//REMOVE ALL BUT MOST RECENT REVIEW
	//				forAllKeys(data, function(name){
	//
	//				});
	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(REVIEWS.aliasName)) continue;
		if (name==REVIEWS.newIndexName) continue;

		if (REVIEWS.newIndexName===undefined || name>REVIEWS.newIndexName){
			REVIEWS.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			REVIEWS.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
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
			{"name":"created_by", "value":"bugs.attachments.created_by"},
			{"name":"product", "value":"bugs.product"},
			{"name":"component", "value":"bugs.component"},
			{"name":"bug_status", "value":"(bugs.bug_status=='resolved'||bugs.bug_status=='verified'||bugs.bug_status=='closed') ? 'closed':'open'"},
			{"name":"keywords", "value":"doc[\"keywords\"].value"},
			{"name":"whiteboard", "value":"bugs.status_whiteboard"},
			{"name":"flags", "value":ETL.getFlags()}
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

//	var esQueryAttachments=new ESQuery({
//		"select" : [
//			{"name":"bug_id", "value":"bugs.bug_id"},
//			{"name":"attach_id", "value":"bugs.attachments.attach_id"},
//			{"name":"modified_ts", "value":"bugs.modified_ts"},
//			{"name":"requestee", "value":"bugs.attachments.flags.requestee"},
//			{"name":"modified_by", "value":"bugs.attachments.flags.modified_by"},
//			{"name":"product", "value":"bugs.product"},
//			{"name":"component", "value":"bugs.component"},
//			{"name":"bug_status", "value":"(bugs.bug_status=='resolved'||bugs.bug_status=='verified'||bugs.bug_status=='closed') ? 'closed':'open'"}
//		],
//		"from":
//			"bugs.attachments.flags",
//		"where":
//			{"and" : [
//				{"terms" : {"bugs.attachments.flags.request_status" : ["?"]}},
//				{"terms" : {"bugs.attachments.flags.request_type" : ["review", "superreview"]}},
//				{"script" :{"script":"bugs.attachments.flags.modified_ts==bugs.modified_ts"}},
//				{"term":{"bugs.attachments[\"attachments.isobsolete\"]" : 0}}
//			]},
//		"esfilter":
//			esfilter
//	});





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


	var inReview;
	var A=aThread.run(function(){
		inReview=yield(esQuery.run());
		status.message("Got Review Requests");
	});

	var doneReview;
	var B=aThread.run(function(){
		doneReview=yield(esQuery2.run());
		status.message("Got Review Ends");
	});

	var switchedReview;
	var C=aThread.run(function(){
		switchedReview=yield(esQuery3.run());
		status.message("Get Review Re-assignments");
	});

	status.message("Get Review Data");
	yield (aThread.join(A));
	yield (aThread.join(B));
	yield (aThread.join(C));


	status.message("processing Data...");
	D.println("start processing "+Date.now().format("HH:mm:ss"));

//	D.println(CNV.List2Tab(inReview.list));
//	D.println(CNV.List2Tab(doneReview.list));
//	D.println(CNV.List2Tab(switchedReview.list));

	doneReview.list.appendArray(switchedReview.list);


	var reviewQueues = (yield (CUBE.calc2List({
		"from":
			inReview.list,
		"analytic":[
			{"name":"is_first", "value":"rownum==0 ? 1 : 0", "sort":"request_time", "edges":["bug_id"]}
		],
		"select":[
			{"name":"bug_status", "value":"bug_status", "operation":"one"},
			{"name":"review_time", "value":"Util.coalesce(doneReview.modified_ts, null)", "operation":"minimum"},
			{"name":"product", "value":"Util.coalesce(doneReview.product, product)", "operation":"minimum"},
			{"name":"component", "value":"Util.coalesce(doneReview.component, component)", "operation":"minimum"},
			{"name":"keywords", "value":"(Util.coalesce(keywords, '')+' '+ETL.parseWhiteBoard(whiteboard)).trim()+' '+flags", "operation":"one"},
			{"name":"requester_review_num", "value":"-1", "operation":"one"}
//			{"name":"status_whiteboard", "value":"whiteboard", "operation":"one"},
//			{"name":"status_whiteboard.tokenized", "value":"ETL.parseWhiteBoard(whiteboard)).trim()", "operation":"one"}
		],
		"edges":[
			{"name":"bug_id", "value":"bug_id"},
			{"name":"attach_id", "value":"attach_id"},
			{"name":"reviewer", "value":"requestee"},
			{"name":"requester", "value":"created_by"},
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
	var uid=Date.now().getMilli()+"";
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "index" : { "_id" : r.bug_id+"-"+r.attach_id } }));
		insert.push(JSON.stringify(r));
	});
	status.message("Push review queues to ES");
	yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/"+REVIEWS.typeName+"/_bulk",
		"data":insert.join("\n")+"\n",
		dataType: "text"
	}));
};//method




REVIEWS.postMarkup=function(){

//
//	var knownTimes=yield(ESQuery.run({
//		"from":"reviews",
//		"select":{"name":"num", "value":"doc[\"is_first_outgoing_review\"].value", "operation":"maximum"},
//		"edges":["requester"],
//		esfilter:batchFilter
//	}));

	//FIND THE INDEX TO UPDATE
	var data=yield(Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(REVIEWS.aliasName)) continue;

		if (Object.keys(data[name].aliases).length>0){
			REVIEWS.oldIndexName=name;
		}//endif

		if (REVIEWS.newIndexName===undefined || name>REVIEWS.newIndexName){
			REVIEWS.newIndexName=name;
		}//endif
	}//for

	REVIEWS.newIndexName=Util.coalesce(REVIEWS.newIndexName, REVIEWS.oldIndexName);
	ESQuery.INDEXES.reviews.path="/"+REVIEWS.newIndexName+"/review";

	//UPDATE THE AUTO-INDEXING TO EVERY SECOND
	data=yield (Rest.put({
		"url": ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/_settings",
		"data":{"index":{"refresh_interval":"1s"}}
	}));


	////////////////////////////////////////////////////////////////////////////
	// MAIN UPDATE FUNCTION
	////////////////////////////////////////////////////////////////////////////
	var update=function(emails){
		status.message("Get reviews by requester");
		var firstTime=yield(ESQuery.run({
			"url":ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/"+REVIEWS.typeName,
			"from":"reviews",
			"select":[
				{"name":"_id", "value":"doc[\"_id\"].value"},
				{"name":"bug_id", "value":"reviews.bug_id"},
				{"name":"attach_id", "value":"reviews.attach_id"},
				{"name":"requester", "value":"reviews.requester"},
				{"name":"request_time", "value":"reviews.request_time"},
				{"name":"old_requester_review_num", "value":"reviews.requester_review_num"}
			],
			esfilter:{"and":[
				{"terms":{"requester":emails}}
			]}
		}));

		status.message("Calculate request ordering");
		var review_count=yield (CUBE.calc2List({//FIRST REVIEW FOR EACH BUG BY REQUESTER
			"from":firstTime,
			"analytic":[
				{"name":"requester_first_review", "value":"rownum==0", "sort":["request_time"], "edges":["requester", "bug_id"]},
				{"name":"requester_review_num", "value":"rownum+1", "sort":["request_time"], "edges":["requester"], "where":"requester_first_review"}
			],
			"sort":["requester_review_num"]
		}));

//		$("#results").html(CNV.List2HTMLTable(review_count.list));


		status.message("Sending changes");
		D.println("Sending "+review_count.list.length+" changes to "+ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/"+REVIEWS.typeName);
		var maxPush=6;
		for(var i=0;i<review_count.list.length;i++){
			var v=review_count.list[i];
			if (isNaN(v.requester_review_num)) continue;
			if (v.requester_review_num==v.old_requester_review_num)
				continue;

			while(maxPush<=0) yield(aThread.sleep(100));
			maxPush--;

			aThread.run(function(){
				try{
					yield (Rest.post({
						"url":ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/"+REVIEWS.typeName+"/"+v._id+"/_update",
						"data":{
							"script" : "ctx._source.requester_review_num = "+v.requester_review_num
						}
					}));
				}catch(e){
					D.error("problem updating review", e);
				}//try
				maxPush++;
			});
		}//for
		D.println("Done sending "+review_count.list.length+" changes");

		status.message("Done");
	};










	//MARK EACH PERSON'S FIRST REVIEW
	var requesterCount=yield(ESQuery.run({
		"url":ElasticSearch.pushURL+"/"+REVIEWS.newIndexName+"/"+REVIEWS.typeName,
		"from":"reviews",
		"select":{"name":"num", "value":"1", "operation":"count"},
		"edges":[
			{"name":"requester", "value":"requester"}
		]
	}));

	var BATCH_SIZE=90000;
	var MAX_EMAIL=2000;

	var numReviews=0;
	var emails=[];
	var num=requesterCount.edges[0].domain.partitions.length;

	for(var c=num;c--;){
		numReviews+=requesterCount.cube[c];
		emails.push(requesterCount.edges[0].domain.partitions[c].value);

		if (numReviews>BATCH_SIZE || emails.length>MAX_EMAIL){
			yield (update(emails));
			numReviews=0;
			emails=[];
		}//endif
	}//for
	yield (update(emails));


};//method