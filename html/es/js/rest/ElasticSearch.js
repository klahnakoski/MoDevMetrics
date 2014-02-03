/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("Rest.js");

ElasticSearch=function(esquery){
	this.esquery=esquery;
};


//THE CONTENT FOUND AT https://metrics.mozilla.com/bugzilla-analysis IS ACTUALLY
//A PROXY OF WHAT CAN BE FOUND AT http://people.mozilla.com/~klahnakoski/es
//THIS ALLOWS THE BROWSER TO ACCESS METRIC'S ES DOCUMENT STORE.

//OTHERWISE, YOU WILL REQUIRE VPN ACCESS TO MOZILLA-MPT TO MAKE THESE PAGES WORK
if (window.location.hostname=="metrics.mozilla.com"){
	//FROM Daniel Einspanjer  Oct 20, 2012 (for use on website)
	//FOR ANYONE, BUT ONLY THROUGH METRIC'S SERVERS
	ElasticSearch.queryURL = "/bugzilla-analysis-es/bugs/_search";
}else{
	//FROM Mark Reid Sept 25, 2012 (for use during coding)
	//ONLY WITH MOZILLA_MPT
//	ElasticSearch.queryURL = "http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/_search";

	ElasticSearch.pushURL="http://localhost:9200";
//	ElasticSearch.pushURL="http://klahnakoski-es.corp.tor1.mozilla.com:9200";
//	ElasticSearch.pushURL="http://elasticsearch4.bugs.scl3.mozilla.com:9200";

	//THESE ARE NOW ALL GOOD NODES!!
	//(2:13:01 PM) mreid: ekyle, if you've still got things set to only hit elasticsearch7, you should probably change it to know about all 4 nodes
	//(2:13:34 PM) ekyle: what are the numbers?
	//(2:13:34 PM) pires [Paulo@moz-13DD0BFB.static.cpe.netcabo.pt] entered the room.
	//(2:17:56 PM) mreid: ekyle, 4,5,7,8
	//(2:18:16 PM) ekyle: thanks, I will see what I can do to distribute load!

//	ElasticSearch.queryURL = "http://localhost:9292/bugs/_search";
//	ElasticSearch.queryURL = "http://elasticsearch4.bugs.scl3.mozilla.com:9200";
//	ElasticSearch.queryURL = "http://klahnakoski-es.corp.tor1.mozilla.com:9204/private_bugs/_search";
//	ElasticSearch.queryURL = "http://klahnakoski-es.corp.tor1.mozilla.com:9200/bugs/_search";
	ElasticSearch.queryURL = "http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/_search";


}//endif



ElasticSearch.search=function(index, esquery){
	yield (ESQuery.loadColumns(index));
	var meta = ESQuery.INDEXES[index];
	if (meta.host===undefined) Log.error("most have host defined");
	var url = meta.host+meta.path+"/_search";

	var output=yield (Rest.post({
		url: url,
		data: CNV.Object2JSON(esquery),
		dataType: "json"
	}));

	yield (output);
};



ElasticSearch.setRefreshInterval=function(indexName, rate){
	var data=yield (Rest.put({
		"url": ElasticSearch.pushURL+"/"+indexName+"/_settings",
		"data":{"index":{"refresh_interval":"1s"}}
	}));
	Log.note("Refresh Interval to "+rate+": "+CNV.Object2JSON(data));
	yield (data);
};//method


//EXPECTING THE DATA ARRAY TO ALREADY HAVE ODD ENTRIES STARTING WITH { "create":{ "_id" : ID } }
ElasticSearch.bulkInsert=function(indexName, typeName, dataArray){
//	try{
		yield (Rest.post({
			"url":ElasticSearch.pushURL+"/"+indexName+"/"+typeName+"/_bulk",
			"data":dataArray.join("\n")+"\n",
			dataType: "text"
		}));
//	} catch(e){
//		Log.warning("problem with _bulk", e)
//	}//try
};


//ONLY BECAUSE I AM TOO LAZY TO ENHANCE THE ESQuery WITH MORE FACETS (A BATTERY OF FACETS PER SELECT COLUMN)
//RETURN ALL BUGS THAT MATCH FILTER ALONG WITH THE TIME RANGE THEY MATCH
//EXPECTING esfilter
ElasticSearch.getMinMax=function(esfilter){

	//MUST CALL ES TWICE BECAUSE WE CAN ONLY HAVE ONE SELECT COLUMN IF WE HAVE EDGES
	var u1 = yield(ESQuery.run({
		"from":"bugs",
		"select":{"name":"min", "value":"modified_ts", "aggregate":"minimum"},
		"edges":[
			"bug_id"
		],
		"esfilter":esfilter
	}));

	var u2 = yield(ESQuery.run({
		"from":"bugs",
		"select":{"name":"max", "value":"expires_on ", "aggregate":"maximum"},
		"edges":[
			"bug_id"
		],
		"esfilter":esfilter
	}));

	//CONVERT TO DATE VALUES (ALSO CONVERTS HIGH DATE VALUE TO null)
	u1.cube.forall(function(v, i){
		u1.cube[i]=Date.newInstance(v);
		if (u1.cube[i]==null) u1.cube[i]=undefined;
	});
	u2.cube.forall(function(v, i){
		u2.cube[i]=Date.newInstance(v);
		if (u2.cube[i]==null) u2.cube[i]=undefined;		//NULL MEANS UNKNOWN, WHEREAS undefined MEANS NOT DEFINED
	});

	var u = Qb.merge({"cubes":[
		{"from":u1, "edges":["bug_id"]},
		{"from":u2, "edges":["bug_id"]}
	]});
	yield u;
};//method



////////////////////////////////////////////////////////////////////////////////
// THE REST OF THIS FILE IS DEPRECIATED
////////////////////////////////////////////////////////////////////////////////


ElasticSearch.makeBasicQuery=function(esfilter){
	return {
		"query":{
			"filtered":{
			  "query":{"match_all":{}},
			  "filter":{"and": [esfilter]}
			}
		},
		"from": 0,
		"size": 0,
		"sort": [],
		"facets":{}
	};
};

ElasticSearch.injectFilter=function(esquery, filter){
	if (esquery.query.filtered === undefined){
		var filtered = {};
		filtered.filtered = {};
		filtered.filtered.query = esquery.query;
		filtered.filtered.filter = esquery.filter;

		esquery.query = filtered;
		esquery.filter = undefined;
	}//endif

	var and = esquery.query.filtered.filter.and;
	and.push(filter);
};


