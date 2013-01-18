/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("ETL.js");
importScript("../filters/ProgramFilter.js");




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
			{"name":"last_request", "value":BUG_SUMMARY.aliasName+".last_modified", "operation":"maximum"}
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
	(yield (CUBE.calc2List({
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

	D.println(data);

//		var lastAlias;  		//THE VERSION CURRENTLY IN USE

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	D.println(data);

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
			{"name":"modified_time", "value":"modified_ts"}
		],
		"esfilter":
			{"range":{"expires_on":{"gt":Date.eod().getMilli()}}}
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

	//GET THE FIRST TIME FOR CLOSE EVENT
	times.facets["close_time"]={
		"terms_stats": {
			"key_field": "bug_id",
			"value_field": "modified_ts",
			"size": 100000
		},
		"facet_filter": {
			"terms":{"bug_status":["resolved", "verified", "closed"]}
		}
	};

	//ADD FACETS TO COUNT ALL MOZILLA PROGRAMS
	(yield (CUBE.calc2List({
		"from":BUG_SUMMARY.allPrograms,
		"edges":["projectName"]
	}))).list.forall(function(v, i){
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



	var a=D.action("Get Current Bug Info", true);
	var currentData=yield (current.run());
	D.actionDone(a);

	a=D.action("Get Historical Timestamps", true);
	var timesData=yield (Rest.post({
		"url":window.ElasticSearch.queryURL,
		"data":times
	}));
	D.actionDone(a);


	var joinItAll={
		"from":currentData.list,
		"select":[],
		"edges":[]
	};

	currentData.select.forall(function(v, i){
		joinItAll.select.push({"name":v.name, "value":v.name});
	});

	//JOIN IN ALL TIME FACETS
	var edgeList=[];
	forAllKey(timesData.facets, function(k, v){
		var domainName=k.deformat()+"part";
		var edgeName=domainName+"__edge";
		var s={"name":k, "value":"Util.coalesce("+domainName+".min, null)", "operation":"minimum"};
		var e={"name":edgeName, "value":"bug_id", allowNulls:true, "domain":{"name":domainName, "type":"set", "key":"term", "partitions":v.terms}};
		edgeList.push(edgeName);
		joinItAll.select.push(s);
		joinItAll.edges.push(e);
	});

	var r=(yield (CUBE.calc2List(joinItAll))).list;

	//REMOVE EDGES
	for(var e=edgeList.length;e--;){
		var k=edgeList[e];
		for(var i=r.length;i--;) r[i][k]=undefined;
	}//for

	//REMOVE NULL VALUES
	var keys=Object.keys(r[0]);
	for(var e=keys.length;e--;){
		var k=keys[e];
		for(var i=r.length;i--;){
			if (r[i][k]==null) r[i][k]=undefined;
		}//for
	}//for

	yield r;
};//method


BUG_SUMMARY.insert=function(reviews){
	var uid=Util.UID();
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : r.bug_id } }));
		insert.push(JSON.stringify(r));
	});
	var a=D.action("Push bug summary to ES", true);
	yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+BUG_SUMMARY.newIndexName+"/"+BUG_SUMMARY.typeName+"/_bulk",
		"data":insert.join("\n")+"\n",
		dataType: "text"
	}));
	D.actionDone(a);
};//method


