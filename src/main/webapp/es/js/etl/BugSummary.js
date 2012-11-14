
importScript("ETL.js");
importScript("../filters/ProgramFilter.js");


var BUG_SUMMARY={};

BUG_SUMMARY.BATCH_SIZE=20000;

BUG_SUMMARY.aliasName="bug_history";
BUG_SUMMARY.typeName="bug_history";


BUG_SUMMARY.BUG_STATUS=[
	"new",
	"unconfirmed",
	"assigned",
	"resolved",
	"verified",
	"closed",
	"reopened"
];

BUG_SUMMARY.allPrograms = CNV.Table2List(MozillaPrograms);


BUG_SUMMARY.getLastUpdated=function(successFunction){
	var q=new ESQuery({
		"from":BUG_SUMMARY.aliasName,
		"select":[
			{"name":"last_request", "value":REVIEWS.aliasName+".last_modified", "operation":"maximum"}
		]
	});

	q.run(function(data){
		successFunction(Date.newInstance(data.cube.last_request));
	});
};


BUG_SUMMARY.makeSchema=function(successFunction){
	//MAKE SCHEMA
	BUG_SUMMARY.indexName="reviews"+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"properties":{
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"product":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"product_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"component":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"component_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},

			"assigned_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"closed_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"new_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"reopened_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"resolved_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"unconfirmed_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"verified_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},

			"create_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"close_time":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"modified_time":{"type":"integer", "store":"yes", "index":"not_analyzed"}
		}
	};

	//ADD MOZILLA PROGRAMS
	new CUBE.calc2List({
		"from":BUG_SUMMARY.allPrograms,
		"edges":["projectName"]
	}).list.forEach(function(v,i){
		config.properties[v+"_time"]={"type":"string", "store":"yes", "index":"not_analyzed"};
	});

	var setup={
		"mappings":{
		}
	};
	setup.mappings[BUG_SUMMARY.typeName]=config;


	ElasticSearch.post(ElasticSearch.baseURL+"/"+BUG_SUMMARY.indexName, setup, function(data){
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
					if (!name.startsWith(BUG_SUMMARY.aliasName)) continue;
					if (name==BUG_SUMMARY.indexName) continue;

					if (BUG_SUMMARY.lastInsert===undefined || name>BUG_SUMMARY.lastInsert){
						BUG_SUMMARY.lastInsert=name;
					}//endif

					if (Object.keys(data[name].aliases).length>0){
						BUG_SUMMARY.lastAlias=name;
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




BUG_SUMMARY.newInsert=function(){

	BUG_SUMMARY.makeSchema(function(){
		var maxBugQuery=new ESQuery({
			"select": {"name":"bug_id", "value":"bugs.bug_id", "operation":"maximum"},
			"from" : "bugs",
			"edges" :[]
		});

		maxBugQuery.run(function(maxResults){
			var maxBug=maxResults.cube.bug_id;
			var maxBatches=Math.floor(maxBug/BUG_SUMMARY.BATCH_SIZE);
//			maxBatches=32;
			BUG_SUMMARY.insertBatch(0, maxBatches, BUG_SUMMARY.updateAlias);
		});
	});
};


BUG_SUMMARY.resumeInsert=function(){
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
				if (!name.startsWith(BUG_SUMMARY.aliasName)) continue;

				if (Object.keys(data[name].aliases).length>0){
					BUG_SUMMARY.lastAlias=name;
				}//endif

				if (BUG_SUMMARY.lastInsert===undefined || name>BUG_SUMMARY.lastInsert){
					BUG_SUMMARY.lastInsert=name;
				}//endif
			}//for

			if (BUG_SUMMARY.lastInsert===undefined || BUG_SUMMARY.lastInsert==BUG_SUMMARY.lastAlias){
				return BUG_SUMMARY.newInsert();
			}//endif
			BUG_SUMMARY.indexName=BUG_SUMMARY.lastInsert;

			//GET THE MAX AND MIN TO FIND WHERE TO START
			var q=new ESQuery({
				"from":"reviews",
				"select":[
					{"name":"maxBug", "value":"reviews.bug_id", "operation":"maximum"},
					{"name":"minBug", "value":"reviews.bug_id", "operation":"minimum"}
					]
			});
			ESQuery.INDEXES.reviews={"path":"/"+BUG_SUMMARY.lastInsert+"/"+BUG_SUMMARY.typeName};
			q.run(function(maxResults){
				var minBug=maxResults.cube.minBug;
				var maxBatches=Math.floor(minBug/BUG_SUMMARY.BATCH_SIZE)-1;
				BUG_SUMMARY.insertBatch(0, maxBatches, BUG_SUMMARY.updateAlias);
			});

		}//success
	});
};

//UPDATE BUG_SUMMARY THAT MAY HAVE HAPPENED AFTER startTime
BUG_SUMMARY.incrementalInsert=function(startTime){

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
		BUG_SUMMARY.getReviews(buglist, null, function(reviews){
			BUG_SUMMARY.deleteReviews(buglist, function(){
				BUG_SUMMARY.insert(reviews, function(){
					status.message("Done");
					D.println("Done incremental update");
				});
			});
		});
	});
};




BUG_SUMMARY.getBugSummaries=function(minBug, maxBug, successFunction){

	//DETERMINE IF WE ARE LOOKING AT A RANGE, OR A SPECIFIC SET, OF BUGS
	var esfilter;
	if (maxBug===undefined || maxBug==null){
		esfilter={"terms":{"bug_id":minBug}};
	}else{
		esfilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
	}//endif


	var current=new ESQuery({
		"from":"bugs",
		"select":[
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"product", "value":"bugs.product"},
			{"name":"product_time", "value":"coalesce(bugs.?previous_values.?product_change_away_ts, bugs.created_ts)"},
			{"name":"component", "value":"bugs.component"},
			{"name":"component_time", "value":"coalesce(bugs.?previous_values.?component_change_away_ts, bugs.created_ts)"},
			{"name":"create_time", "value":"bugs.created_ts"},
			{"name":"modified_time", "value":"bugs.modified_ts"}
		],
		"esfilter":
			{"range":{"expires_on":{"gt":Date.now().ceilingDay().getMilli()}}}
	});
	ElasticSearch.injectFilter(current.esQuery, esfilter);



	
	var times=ElasticSearch.makeBasicQuery(esfilter);

	//GET THE FIRST TIME FOR EACH BUGS STATUS
	BUG_SUMMARY.BUG_STATUS.forall(function(v,i){
		times.facets[v+"_time"]={
			"terms_stats": {
				"key_field": "bug_id",
				"value_field": "modified_ts",
				"size": 100000
			},
			"facet_filter": {
				"term":{"bug_status":v}
			}
		}
	});

	//ADD FACETS TO COUNT ALL MOZILLA PROGRAMS
	new CUBE().calc2List({
		"from":BUG_SUMMARY.allPrograms,
		"edges":["projectName"]
	}).list.forall(function(v, i){
		times.facets[v.projectName+"_time"]={
			"terms_stats": {
				"key_field": "bug_id",
				"value_field": "modified_ts",
				"size": 100000
			},
			"facet_filter":{"or":[]}
		};

		var or=times.facets[v.projectName+"_time"].facet_filter.or;
		for(var j=0;j<BUG_SUMMARY.allPrograms.length;j++){
			if (BUG_SUMMARY.allPrograms[j].projectName == v.projectName){
				var name = BUG_SUMMARY.allPrograms[j].attributeName;
				var value = BUG_SUMMARY.allPrograms[j].attributeValue;
				var term = {};
				term[name] = value;
				or.push({"prefix":term});
			}//endif
		}//for
	});
	ElasticSearch.injectFilter(times, esfilter);



	status.message("Get Current Bug Info");
	current.run(function(currentData){
		status.message("Get Historical Timestamps");
		ElasticSearchQuery.Run({"query":times,"success":function(timesData){
			var joinItAll={
				"from":currentData.list,
				"select":[],
				"edges":[]
			};

			currentData.select.forall(function(v, i){
				joinItAll.select.push({"name":v.name, "value":v.name});
			});

			//JOIN IN ALL TIME FACETS
			var removeList=[];
			ForAllKey(timesData.facets, function(k, v){
				var domainName=k.deformat()+"part"
				var s={"name":k, "value":"Util.coalesce("+domainName+".min, null)", "operation":"minimum"};
				var e={"name":domainName+"__edge", "value":"bug_id", allowNulls:true, "domain":{"name":domainName, "type":"set", "key":"term", "partitions":v.terms}};
				removeList.push(domainName+"__edge");
				joinItAll.select.push(s);
				joinItAll.edges.push(e);
			});

			var r=new CUBE().calc2List(joinItAll).list;

			//REMOVE EDGES
			for(var e=removeList.length;e--;){
				var k=removeList[e];
				for(var i=r.length;i--;) r[i][k]=undefined;
			}//for

			successFunction(r);
		}});
	});

};//method


//PROCESS ALL BATCHES, IN REVERSE ORDER (NEWEST FIRST)
//MAKE SURE THE DEEPEST STACKTRACE IS USED FIRST, SO RESULTS CAN BE GCed
BUG_SUMMARY.insertBatch=function(b, max, workQueue){
	if (b>max){
		workQueue();
		return;
	}//endif

	BUG_SUMMARY.insertBatch(b+1, max, function(){
		BUG_SUMMARY.getReviews(b*BUG_SUMMARY.BATCH_SIZE, (b+1)*BUG_SUMMARY.BATCH_SIZE, function(reviews){
			BUG_SUMMARY.insert(reviews, function(){
				D.println("Done batch "+b+" into "+BUG_SUMMARY.indexName);
				workQueue();
			});
		});
	});

};//method


BUG_SUMMARY.insert=function(reviews, successFunction){
	var uid=Util.UID();
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : uid+"-"+i } }));
		insert.push(JSON.stringify(r));
	});
	status.message("Push review queues to ES");
	ElasticSearch.post(ElasticSearch.baseURL+"/"+BUG_SUMMARY.indexName+"/"+BUG_SUMMARY.typeName+"/_bulk", insert.join("\n"), successFunction);
};//method



BUG_SUMMARY.deleteBugSummary=function(bugList, successFunction){
	var numleft=bugList.length;

	bugList.forall(function(v, i){
		//DELETE BUG_SUMMARY OF THOSE BUGS FROM COPY
		$.ajax({
			url: ElasticSearch.baseURL+"/"+BUG_SUMMARY.aliasName+"/"+BUG_SUMMARY.typeName+"?q=bug_id:"+v,
			type: "DELETE",
//			dataType: "json",
			error: function(errorData, errorMsg, errorThrown){D.error(errorMsg, errorThrown);},
			success: function(){
				numleft--;
				if (numleft==0)
					successFunction();
			}
		});
	});

};//method