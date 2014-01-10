/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("ETL.js");
importScript("../gui/ProgramFilter.js");




var BUG_SUMMARY={};
BUG_SUMMARY.BATCH_SIZE=20000;
BUG_SUMMARY.aliasName="bug_summary";
BUG_SUMMARY.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
BUG_SUMMARY.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
BUG_SUMMARY.typeName="bug_summary";


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


BUG_SUMMARY.getLastUpdated=function(){
	var data=yield (ESQuery.run({
		"from":BUG_SUMMARY.aliasName,
		"select":[
			{"name":"last_request", "value":"modified_time", "aggregate":"maximum"}
		]
	}));
	yield (new Date(data.cube.last_request));
};


BUG_SUMMARY.makeSchema=function(){
	//MAKE SCHEMA
	BUG_SUMMARY.newIndexName=BUG_SUMMARY.aliasName+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"properties":{
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"product":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"product_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"component":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"component_time":{"type":"long", "store":"yes", "index":"not_analyzed"},

			"assigned_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"closed_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"new_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"reopened_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"resolved_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"unconfirmed_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"verified_time":{"type":"long", "store":"yes", "index":"not_analyzed"},

			"create_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"close_time":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"modified_time":{"type":"long", "store":"yes", "index":"not_analyzed"}
		}
	};

	//ADD MOZILLA PROGRAMS
	(yield (Qb.calc2List({
		"from":BUG_SUMMARY.allPrograms,
		"edges":["projectName"]
	}))).list.forall(function(v,i){
		config.properties[v.projectName+"_time"]={"type":"long", "store":"yes", "index":"not_analyzed"};
	});




	var setup={
		"mappings":{
		}
	};
	setup.mappings[BUG_SUMMARY.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+BUG_SUMMARY.newIndexName,
		"data":setup
	}));

	Log.note(data);

//		var lastAlias;  		//THE VERSION CURRENTLY IN USE

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	Log.note(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(BUG_SUMMARY.aliasName)) continue;
		if (name==BUG_SUMMARY.newIndexName) continue;

		if (BUG_SUMMARY.newIndexName===undefined || name>BUG_SUMMARY.newIndexName){
			BUG_SUMMARY.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			BUG_SUMMARY.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for

};





BUG_SUMMARY.get=function(minBug, maxBug){

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
			{"name":"bug_id", "value":"bug_id"},
			{"name":"product", "value":"product"},
			{"name":"product_time", "value":"coalesce(get(bugs.?previous_values, 'product_change_away_ts'), created_ts)"},
			{"name":"component", "value":"component"},
			{"name":"component_time", "value":"coalesce(get(bugs.?previous_values, 'component_change_away_ts'), created_ts)"},
			{"name":"create_time", "value":"created_ts"},
			{"name":"modified_time", "value":"modified_ts"},
			{"name":"expires_on", "value":"getDocValue(\"expires_on\")"}
		],
		"esfilter":{"and":[
			{"range":{"expires_on":{"gt":Date.eod().getMilli()}}}
		]}
	});
	ElasticSearch.injectFilter(current.esQuery, esfilter);

	var a=Log.action("Get Current Bug Info", true);
	var currentData=yield (current.run());
	Log.actionDone(a);


	//WE SOMETIMES GET MORE THAN ONE "CURRENT" RECORD FROM ES, THIS WILL FIND
	//THE YOUNGEST, AND FILTER OUT THE REST
	currentData=yield (Qb.calc2List({
		"from":{
			"from":currentData,
			"analytic":{"name":"num", "value":"(rows.length-1)-rownum", "edges":["bug_id"], "sort":["modified_time"]}
		},
		"where":"num==0"
	}));


	
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

	//GET THE FIRST TIME FOR CLOSE EVENT
	times.facets["close_time"]={
		"terms_stats": {
			"key_field": "bug_id",
			"value_field": "modified_ts",
			"size": 100000
		},
		"facet_filter": Mozilla.BugStatus.Closed.esfilter
	};

	//ADD FACETS TO COUNT ALL MOZILLA PROGRAMS
	var programFilter=new ProgramFilter();
	(yield (Qb.calc2List({
		"from":BUG_SUMMARY.allPrograms,
		"edges":["projectName"]
	}))).list.forall(function(v, i){
		times.facets[v.projectName+"_time"]={
			"terms_stats": {
				"key_field": "bug_id",
				"value_field": "modified_ts",
				"size": 100000
			},
			"facet_filter":programFilter.makeFilter("bugs", [v.projectName])
		};

	});
	ElasticSearch.injectFilter(times, esfilter);



	a=Log.action("Get Historical Timestamps", true);
	var timesData=yield (Rest.post({
		"url":window.ElasticSearch.queryURL,
		"data":times
	}));
	Log.actionDone(a);


	var joinItAll={
		"from":currentData.list,
		"select":[
			{"name":"bug_id", "value":"bug_id", "aggregate":"one"},
			{"name":"product", "value":"product", "aggregate":"one"},
			{"name":"product_time", "value":"product_time", "aggregate":"minimum"},
			{"name":"component", "value":"component", "aggregate":"one"},
			{"name":"component_time", "value":"component_time", "aggregate":"minimum"},
			{"name":"create_time", "value":"create_time", "aggregate":"one"},
			{"name":"modified_time", "value":"modified_time", "aggregate":"maximum"}
		],
		"edges":[]
	};

	
	//JOIN IN ALL TIME FACETS
	var edgeList=[];
	forAllKey(timesData.facets, function(k, v){
		var domainName=k.deformat()+"part";
		var edgeName=domainName+"__edge";
		var s={"name":k, "value":"nvl("+domainName+".min, null)", "aggregate":"minimum"};
		var e={"name":edgeName, "value":"bug_id", allowNulls:true, "domain":{"name":domainName, "type":"set", "key":"term", "partitions":v.terms}};
		edgeList.push(edgeName);
		joinItAll.select.push(s);
		joinItAll.edges.push(e);
	});

//	{
//		var f=joinItAll.from;
//		joinItAll.from=undefined;
//		var j=Map.jsonCopy(joinItAll);
//		joinItAll.from=f;
//
//		j.edges.forall(function(v, i){
//			v.domain.partitions=undefined;
//		});
//		Log.note(CNV.Object2JSON(j));
//	}

	a=Log.action("Process Data", true);

	var r=(yield (Qb.calc2List(joinItAll))).list;

	//REMOVE EDGES
	for(let e=edgeList.length;e--;){
		let k=edgeList[e];
		for(let i=r.length;i--;) r[i][k]=undefined;
	}//for

	//REMOVE NULL VALUES
	var keys=Object.keys(r[0]);
	for(let e=keys.length;e--;){
		let k=keys[e];
		for(var i=r.length;i--;){
			if (r[i][k]==null) r[i][k]=undefined;
		}//for
	}//for
	Log.actionDone(a);

	yield r;
};//method


BUG_SUMMARY.insert=function(reviews){
	var uid=Util.GUID();
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : r.bug_id } }));
		insert.push(JSON.stringify(r));
	});
	var a=Log.action("Push bug summary to ES", true);
	yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+BUG_SUMMARY.newIndexName+"/"+BUG_SUMMARY.typeName+"/_bulk",
		"data":insert.join("\n")+"\n",
		dataType: "text"
	}));
	Log.actionDone(a);
};//method


