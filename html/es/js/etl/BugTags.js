/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("ETL.js");



var BUG_TAGS={};
BUG_TAGS.BATCH_SIZE=1000;

BUG_TAGS.aliasName="bug_tags";
BUG_TAGS.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
BUG_TAGS.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
BUG_TAGS.typeName="bug_tags";




BUG_TAGS.getLastUpdated=function(){
	var data=yield (ESQuery.run({
		"from":BUG_TAGS.aliasName,
		"select":[
			{"name":"last_request", "value":BUG_TAGS.aliasName+".date", "aggregate":"maximum"}
		],
		"esfilter":{"and":[
			{"range":{"date":{"gt":Date.now().subtract(Duration.MONTH).getMilli()}}}
		]}
	}));
	yield (Date.newInstance(data.cube.last_request));
};


BUG_TAGS.makeSchema=function(){
	//MAKE SCHEMA
	BUG_TAGS.newIndexName=BUG_TAGS.aliasName+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all":{"enabled" : false},
		"properties":{
			"date":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"bug_status":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"product":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"component":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"assigned_to":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"keywords":{"type":"string", "store":"yes", "index":"analyzed", analyzer: 'whitespace'}
		}
	};

	var setup={
		"index":{
	 	   "refresh_interval" : "-1"
   		},
		"mappings":{
		}
	};
	setup.mappings[BUG_TAGS.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+BUG_TAGS.newIndexName,
		"data":setup
	}));
	Log.note(data);


	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	Log.note(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(BUG_TAGS.aliasName)) continue;
		if (name==BUG_TAGS.newIndexName) continue;

		if (BUG_TAGS.newIndexName===undefined || name>BUG_TAGS.newIndexName){
			BUG_TAGS.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			BUG_TAGS.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for

};





BUG_TAGS.get=function(minBug, maxBug, minDate, maxDate){

	if (minDate===undefined) minDate=new Date(2009,0,1);
	if (maxDate===undefined) maxDate=Date.eod();



	//DETERMINE IF WE ARE LOOKING AT A RANGE, OR A SPECIFIC SET, OF BUGS
	var bugFilter;
	if (maxBug===undefined || maxBug==null){
		bugFilter={"terms":{"bug_id":minBug}};
	}else{
		bugFilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
	}//endif

	var dateFilter={"and":[
		{"range":{"expires_on":{"gt":minDate.floorDay().getMilli()}}},
		{"range":{"modified_ts":{"lt":maxDate.getMilli()}}},
		bugFilter
	]};
//{"terms":{ "bug_status" : ["resolved", "verified", "closed"] }}

	var a=Log.action("Get Current Bug Info", true);
	var current=yield (ESQuery.run({
		"from":"bugs",
		"select":[
			{"name":"modified_ts", "value":"bugs.modified_ts"},
			{"name":"expires_on", "value": //WE WILL NOT MAKE DAILY RECORDS FOR UNCHANGING CLOSED BUGS
				"if (bugs.expires_on==null && (bugs.bug_status==\"resolved\" || bugs.bug_status==\"verified\" || bugs.bug_status==\"closed\")){ "+
					"bugs.modified_ts+"+Duration.MILLI_VALUES.day+"; "+
				"} else { "+
					"coalesce(bugs.expires_on, "+Date.eod().getMilli()+"); "+
				"}"
			},
			{"name":"bug_id", "value":"bug_id"},
			{"name":"bug_status", "value":"bug_status"},
			{"name":"product", "value":"product"},
			{"name":"component", "value":"component"},
			{"name":"assigned_to", "value":"assigned_to"},
			{"name":"keywords", "value":"keywords"},
			{"name":"whiteboard", "value":"status_whiteboard"},
			{"name":"flags", "value":ETL.getFlags()}
		],
		"esfilter":
			dateFilter
	}));
	Log.actionDone(a);

//Log.note(CNV.List2Tab(current.list));
	
	Log.action("Generate per-day stats");
	var results=(yield(Qb.calc2List({
		"from":current,
		"select":[
			{"name":"bug_status", "value":"bug_status", "aggregate":"one"},
			{"name":"product", "value":"product", "aggregate":"one"},
			{"name":"component", "value":"component", "aggregate":"one"},
			{"name":"assigned_to", "value":"assigned_to", "aggregate":"one"},
			{"name":"keywords", "value":"(nvl(keywords, '')+' '+ETL.parseWhiteBoard(whiteboard)).trim()+' '+flags", "aggregate":"one"}
		],
		"edges":[
			{"name":"date", "test":"modified_ts<=time.max.getMilli() && time.max.getMilli()<expires_on",
				"domain":{"type":"time", "min":minDate, "max":maxDate, "interval":"day", "value":"value.getMilli()"}
			},
			{"name":"bug_id", "value":"bug_id"}
		]
	}))).list;

	yield results;
};//method




BUG_TAGS.insert=function(tags){
	var insert=[];
	tags.forall(function(r, i){
		insert.push(JSON.stringify({ "index":{ "_id" : r.bug_id+"-"+Date.newInstance(r.date).format("yyMMdd") } }));
		insert.push(JSON.stringify(r));
	});

	Log.action("Push bug tags to ES");
	yield ETL.chunk(insert, function(data){
		try{
			yield (Rest.post({
				"url":ElasticSearch.pushURL + "/" + BUG_TAGS.newIndexName + "/" + BUG_TAGS.typeName + "/_bulk",
				"data":data,
				"dataType":"text"
			}));
		} catch(e){
			Log.warning("problem with _bulk", e)
		}//try
	});
};//method




BUG_TAGS.addMissing=function(){

	yield (ETL.getCurrentIndex(BUG_TAGS));
	var maxBug=yield (ETL.getMaxBugID());

	var totals=(yield (ESQuery.run({
		"url":ElasticSearch.pushURL + "/" + BUG_TAGS.newIndexName + "/" + BUG_TAGS.typeName,
		"from":"bug_tags",
		"select":{"name":"count", "value":"1", "aggregate":"count"},
		"edges":[
			{"name":"bug_id", "value":"bug_id", "domain":{"type":"numeric", "min":0, "max":maxBug, "interval":10000}},
			{"name":"date", "value":"date", "domain":{"type":"date", "min":new Date(2000, 0, 1), "max":Date.eod(), "interval":"8week"}}
		]
	})));


//	var all=Thread.parallel(4);
	var pid=totals.edges[0].domain.partitions;
	var mid=totals.edges[1].domain.partitions;

	for(var m=mid.length;m--;){
		var month=mid[m];
		for(var p=0;p<pid.length;p++){
			var part=pid[p];
			if (totals.cube[p][m]==0){
				Log.note("Get tags for bugs from "+part.min+" to "+part.max+" between "+month.min.format("dd MMM yyyy")+" and "+month.max.format("dd MMM yyyy"));

				//GET INFO FOR THIS RANGE OF BUGS
				var tags=(yield (BUG_TAGS.get(part.min, part.max, month.min, month.max)));
				Log.note("Writing "+tags.length+" tags");
				Log.action("Writing Tags");
				yield (BUG_TAGS.insert(tags));
			}//endif
		}//for
	}//for

	yield (ETL.updateAlias(BUG_TAGS));

	};