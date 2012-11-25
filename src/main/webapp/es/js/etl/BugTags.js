
importScript("ETL.js");
importScript("../filters/ProgramFilter.js");


var BUG_TAGS={};
BUG_TAGS.BATCH_SIZE=5000;

BUG_TAGS.aliasName="bug_tags";
BUG_TAGS.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
BUG_TAGS.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
BUG_TAGS.typeName="bug_tags";




BUG_TAGS.getLastUpdated=function(){
	var data=yield (ESQuery.run({
		"from":BUG_TAGS.aliasName,
		"select":[
			{"name":"last_request", "value":BUG_TAGS.aliasName+".date", "operation":"maximum"}
		]
	}));
	yield (Date.newInstance(data.cube.last_request));
};


BUG_TAGS.makeSchema=function(){
	//MAKE SCHEMA
	BUG_TAGS.newIndexName=BUG_TAGS.aliasName+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"properties":{
			"date":{"type":"long", "store":"yes", "index":"not_analyzed"},
			"bug_id":{"type":"integer", "store":"yes", "index":"not_analyzed"},
			"bug_status":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"product":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"component":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"assigned_to":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"keywords":{"type":"string", "store":"yes", "index":"analyzed"}
		}
	};

	var setup={
		"mappings":{
		}
	};
	setup.mappings[BUG_TAGS.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.baseURL+"/"+BUG_TAGS.newIndexName,
		"data":setup
	}));

	D.println(data);


	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.baseURL+"/_aliases"}));
	D.println(data);

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
		yield (Rest["delete"]({url: ElasticSearch.baseURL+"/"+name}));
	}//for

};





BUG_TAGS.get=function(minBug, maxBug){

	var minDate=new Date(2009,0,1);
	var maxDate=Date.eod();



	//DETERMINE IF WE ARE LOOKING AT A RANGE, OR A SPECIFIC SET, OF BUGS
	var bugFilter;
	if (maxBug===undefined || maxBug==null){
		bugFilter={"terms":{"bug_id":minBug}};
	}else{
		bugFilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
	}//endif

	var dateFilter={"and":[
		{"range":{"expires_on":{"gt":minDate.addDay(-1).getMilli()}}},
		{"range":{"modified_ts":{"lt":maxDate.getMilli()}}},
		bugFilter
	]};
//{"terms" : { "bug_status" : ["resolved", "verified", "closed"] }}

	status.message("Get Current Bug Info");
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
			{"name":"bug_id", "value":"bugs.bug_id"},
			{"name":"bug_status", "value":"bugs.bug_status"},
			{"name":"product", "value":"bugs.product"},
			{"name":"component", "value":"bugs.component"},
			{"name":"assigned_to", "value":"bugs.assigned_to"},
			{"name":"keywords", "value":"doc[\"keywords\"].value"},
			{"name":"whiteboard", "value":"bugs.status_whiteboard"}
		],
		"esfilter":
			dateFilter
	}));

//D.println(CNV.List2Tab(current.list));
	
	status.message("Generate per-day stats");
	var results=(yield(CUBE.calc2List({
		"from":current,
		"select":[
			{"name":"bug_status", "value":"bug_status", "operation":"one"},
			{"name":"product", "value":"product", "operation":"one"},
			{"name":"component", "value":"component", "operation":"one"},
			{"name":"assigned_to", "value":"assigned_to", "operation":"one"},
			{"name":"keywords", "value":"(Util.coalesce(keywords, '')+' '+BUG_TAGS.parseWhiteBoard(whiteboard)).trim()", "operation":"one"}
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



BUG_TAGS.insert=function(reviews){
	var uid=Util.UID();
	var insert=[];
	reviews.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : uid+"-"+i } }));
		insert.push(JSON.stringify(r));
	});
	var data=insert.join("\n")+"\n";
	status.message("Push bug tags to ES");
	try{
		yield (Rest.post({
			"url":ElasticSearch.baseURL+"/"+BUG_TAGS.newIndexName+"/"+BUG_TAGS.typeName+"/_bulk",
			"data":data,
			"dataType":"text"
		}));
	}catch(e){
		D.warning("problem with _bulk", e)
	}
};//method



BUG_TAGS["delete"]=function(bugList){
	for(var i=0;i<bugList.length;i++){
		yield(Rest["delete"]({url: ElasticSearch.baseURL+"/"+BUG_TAGS.aliasName+"/"+BUG_TAGS.typeName+"?q=bug_id:"+bugList[i]}));
	}//for
};//method


BUG_TAGS.parseWhiteBoard=function(whiteboard){
	return whiteboard.split("[").map(function(v, i){
		var index=v.indexOf("]");
		if (index==-1) index=v.indexOf(" ");
		if (index==-1) index=v.length;
		return v.substring(0, index).trim().toLowerCase();
	}).join(" ");
};