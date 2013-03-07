/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("ETL.js");


var HIERARCHY={};
HIERARCHY_BATCH_SIZE=20000;
HIERARCHY.aliasName="bug_hierarchy";
HIERARCHY.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
HIERARCHY.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
HIERARCHY.typeName="bug_hierarchy";


HIERARCHY.allPrograms = CNV.Table2List(MozillaPrograms);


HIERARCHY.getLastUpdated=function(){
	var data=yield (ESQuery.run({
		"from":HIERARCHY.aliasName,
		"select":[
			{"name":"last_request", "value":"modified_time", "operation":"maximum"}
		]
	}));
	yield (new Date(data.cube.last_request));
};


HIERARCHY.makeSchema=function(){
	//MAKE SCHEMA
	HIERARCHY.newIndexName=HIERARCHY.aliasName+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"properties":{
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"children":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"descendents":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"modified_ts":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"expires_on":{"type":"long", "store":"yes", "index":"not_analyzed"}
		}
	};

	//ADD MOZILLA PROGRAMS
	(yield (CUBE.calc2List({
		"from":HIERARCHY.allPrograms,
		"edges":["projectName"]
	}))).list.forall(function(v,i){
		config.properties[v.projectName+"_time"]={"type":"long", "store":"yes", "index":"not_analyzed"};
	});




	var setup={
		"mappings":{
		}
	};
	setup.mappings[HIERARCHY.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+HIERARCHY.newIndexName,
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
		if (!name.startsWith(HIERARCHY.aliasName)) continue;
		if (name==HIERARCHY.newIndexName) continue;

		if (HIERARCHY.newIndexName===undefined || name>HIERARCHY.newIndexName){
			HIERARCHY.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			HIERARCHY.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for

};





HIERARCHY.get=function(minBug, maxBug){


	//DETERMINE IF WE ARE LOOKING AT A RANGE, OR A SPECIFIC SET, OF BUGS
	var esfilter;
	if (maxBug===undefined || maxBug==null){
		esfilter={"terms":{"bug_id":minBug}};
	}else{
		esfilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
	}//endif


	var a=D.action("Get largest bug_id", true);
	var maxBugID=yield (ESQuery.run({
		"from":"bugs",
		"select":{"value":"bug_id", "operation":"maximum"}
	}));
	maxBugID=maxBugID.cube.bug_id;
	D.actionDone(a);

	var all=[];

	var BLOCK_SIZE=10000;
	for(var i=40000;i<maxBugID+1;i+=BLOCK_SIZE){
		esfilter={"and":[
			{"range":{"bug_id":{"gte":i, "lt":i+BLOCK_SIZE}}},
			{"not":{"term":{"bug_id":41273}}}
		]};

		var a=D.action("Get Current Bug Info", true);
		var currentData=yield (ESQuery.run({
			"from":"bugs",
			"select":[
				"bug_id", "modified_ts","expires_on", "dependson"
			],
			"esfilter":{"and":[
				esfilter,
				{"not":{"missing":{"field":"dependson"}}},
				{"or":[
					{"term":{"changes.field_name":"blocked"}}, 	//ONLY NEED RECORDS WHERE blocked CHANGED
					{"term":{"bug_version_num":1}}			//THE FIRST BUG MAY HAVE INITIAL DATA
				]}
			]},
//FOR SOME REASON bug_id=28424 WILL NOT ALLOW ACCESS TO bug_version_num
//			"where":{"or":[
//				{"term":{"changes.field_name":"blocked"}}, 	//ONLY NEED RECORDS WHERE blocked CHANGED
//				{"term":{"bug_version_num":1}}			//THE FIRST BUG MAY HAVE INITIAL DATA
//			]}
		}));

		D.println("Num hierarchy records from "+i+" to "+(i+BLOCK_SIZE)+": "+currentData.list.length);
		all.appendArray(currentData.list);
		D.actionDone(a);
	}//for


	a=D.action("Process Data", true);

	var sorted=all.sort(function(a, b){return a.modified_ts-b.modified_ts;});
	D.println(sorted.length);

	D.actionDone(a);

	yield r;
};//method


HIERARCHY.insert=function(hierarchy){
	var uid=Util.UID();
	var insert=[];
	hierarchy.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : r.bug_id } }));
		insert.push(JSON.stringify(r));
	});
	var a=D.action("Push bug summary to ES", true);
	yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+HIERARCHY.newIndexName+"/"+HIERARCHY.typeName+"/_bulk",
		"data":insert.join("\n")+"\n",
		dataType: "text"
	}));
	D.actionDone(a);
};//method


