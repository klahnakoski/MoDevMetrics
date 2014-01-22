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
	ElasticSearch.baseURL="/bugzilla-analysis-es";
	ElasticSearch.queryURL = "/bugzilla-analysis-es/bugs/_search";
}else{
	//FROM Mark Reid Sept 25, 2012 (for use during coding)
	//ONLY WITH MOZILLA_MPT
//	ElasticSearch.baseURL="http://elasticsearch7.metrics.scl3.mozilla.com:9200";
//	ElasticSearch.queryURL = "http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/_search";

	ElasticSearch.pushURL="http://elasticsearch4.bugs.scl3.mozilla.com:9200";
//	ElasticSearch.pushURL="http://klahnakoski-es.corp.tor1.mozilla.com:9200";
//	ElasticSearch.pushURL="http://elasticsearch7.metrics.scl3.mozilla.com:9200";

	//THESE ARE NOW ALL GOOD NODES!!
	//(2:13:01 PM) mreid: ekyle, if you've still got things set to only hit elasticsearch7, you should probably change it to know about all 4 nodes
	//(2:13:34 PM) ekyle: what are the numbers?
	//(2:13:34 PM) pires [Paulo@moz-13DD0BFB.static.cpe.netcabo.pt] entered the room.
	//(2:17:56 PM) mreid: ekyle, 4,5,7,8
	//(2:18:16 PM) ekyle: thanks, I will see what I can do to distribute load!

//	ElasticSearch.baseURL="http://elasticsearch4.metrics.scl3.mozilla.com:9200";
//	ElasticSearch.baseURL="http://elasticsearch5.metrics.scl3.mozilla.com:9200";
	ElasticSearch.baseURL="http://elasticsearch7.metrics.scl3.mozilla.com:9200";
//	ElasticSearch.baseURL="http://elasticsearch8.metrics.scl3.mozilla.com:9200";

//	ElasticSearch.baseURL="http://localhost:9292";
//	ElasticSearch.baseURL="http://elasticsearch7.bugs.scl3.mozilla.com:9200";
//	ElasticSearch.baseURL="http://klahnaksoski-es.corp.tor1.mozilla.com:9292";
//	ElasticSearch.baseURL="http://klahnakoski-es.corp.tor1.mozilla.com:9204";


//	ElasticSearch.queryURL = "http://localhost:9292/bugs/_search";
//	ElasticSearch.queryURL = "http://elasticsearch4.bugs.scl3.mozilla.com:9200";
//	ElasticSearch.queryURL = "http://klahnakoski-es.corp.tor1.mozilla.com:9204/private_bugs/_search";
//	ElasticSearch.queryURL = "http://klahnakoski-es.corp.tor1.mozilla.com:9200/bugs/_search";
	ElasticSearch.queryURL = "http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/_search";


}//endif



ElasticSearch.search=function(esquery){
	var output=yield (Rest.post({
		url: window.ElasticSearch.queryURL,
		data: CNV.Object2JSON(esquery),
		dataType: "json"
	}));

	yield (output);
};


//RETURN MAPPINGS FOR GIVEN INDEX AND TYPE
ElasticSearch.getSchema=function(indexName, typeName){
	var URL = ElasticSearch.baseURL + "/" + indexName +"/" + "/_mapping";

	var schema = yield(Rest.get({
		"url":URL
	}));

	yield (schema[indexName][typeName]);
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
		"select": {"name":"min", "value":"modified_ts", "aggregate":"minimum"},
		"edges":[
			"bug_id"
		],
		"esfilter":esfilter
	}));

	var u2 = yield(ESQuery.run({
		"from":"bugs",
		"select": {"name":"max", "value":"expires_on ", "aggregate":"maximum"},
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
		"query": {
			"filtered": {
			  "query": {"match_all": {}},
			  "filter": {"and": [esfilter]}
			}
		},
		"from": 0,
		"size": 0,
		"sort": [],
		"facets": {}
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



var ElasticSearchQuery = function(query, successFunction, errorFunction){
	if (query.success!==undefined){
		if (query.query===undefined)
			Log.error("if passing a parameter object, it must have both query and success attributes");
		this.callbackObject = query;
		this.query = query.query;
	}else{
		if (successFunction===undefined)
			Log.error("expecting an object to report back response");
		this.callbackObject = {"success":successFunction, "error":errorFunction};
		this.query = query;
	}//endif
	this.request = undefined;
};

ElasticSearchQuery.DEBUG=false;



ElasticSearchQuery.Run = function(param){
	var q=new ElasticSearchQuery(
		param.query,
		param.success,
		param.error
	);
	q.Run();
	return q;
};//method






//JUST LIKE RUN, BUT INSTEAD OF SENDING QUERY, EXECUTE success() USING data
//JUST COMMENT-OUT A COUPLE OF LINES TO SWITCH BETWEEN LOCAL AND NETORK TESTING
ElasticSearchQuery.Use = function(data, reportBackObj, id, esQuery){
	reportBackObj.success(data);
};//method

ElasticSearchQuery.prototype.Run = function(){
	if (this.callbackObject.success===undefined) Log.error();
	if (ElasticSearchQuery.DEBUG) Log.note(CNV.Object2JSON(this.query));

	var self = this;
	this.request = $.ajax({
		url: window.ElasticSearch.queryURL,
		type: "POST",
		data: CNV.Object2JSON(this.query),
		dataType: "json",

		success: function(data){
			self.success(data);
		},
		error: function(errorData, errorMsg, errorThrown){self.error(errorData, errorMsg, errorThrown);}
	});
};

ElasticSearchQuery.prototype.success = function(data){
	if (data==null){
		Log.action("Not connected?");
		Log.warning("Maybe you are not connected to Mozilla-MPT?");
		if (data==null && this.callbackObject===undefined) return;	//CAN HAPPEN WHEN REQUEST HAS NOT BEEN SENT, YET HAS BEEN KILLED
		try{
			this.callbackObject.success(data);
		}catch(e){
			Log.warning("Problem calling success()", e);
		}//try
		return;
	}//endif
	if (this.callbackObject===undefined) return;
	if (this.callbackObject.success===undefined) Log.error("ElasticSearchQuery - Can not report back success!!");

	if (data._shards.failed>0){
		Log.warning("Must resend query...");
		var self=this;
		self.timeout=nvl(self.timeout, 1000)*2;
		setTimeout(function(){self.Run();}, self.timeout);
//		this.Run();
		return;
	}//endif

	try{
		this.callbackObject.success(data);
	}catch(e){
		Log.warning("Problem calling success()", e);
	}//try
};


ElasticSearchQuery.prototype.error = function(errorData, errorMsg, errorThrown){
	if (this.callbackObject===undefined) return;
	if (this.callbackObject.error===undefined) Log.error(errorMsg);
	
	try{
		this.callbackObject.error(this, errorData, errorMsg, errorThrown);
	}catch(e){
		Log.warning("Problem with reporting back error: '"+errorMsg+"'", e);
	}//try
};


ElasticSearchQuery.prototype.kill = function(data){
	this.callbackObject=undefined;
	if (ElasticSearchQuery.DEBUG) Log.note("request killed, callback set to undefined");
	if (this.request != undefined){
		try{
			this.request.abort();
		}catch(e){
			//AT LEAST WE TRIED
		}//try
		this.request = undefined;
	}//endif
};





MultiElasticSearchQuery = function(reportBackObj, chartRequests){
	this.callbackObject = reportBackObj;
	this.chartRequests = chartRequests;

	this.ElasticSearchQueryObjs = [];
	this.results = [];

};

MultiElasticSearchQuery.prototype.Run = function(param){

	for(var i=0;i<this.chartRequests.length;i++){
		var self=this;
		(function(i){
			self.ElasticSearchQueryObjs[i]=ElasticSearchQuery.Run({
				"index":i,
				"query":self.chartRequests[i].esQuery,
				"success":function(data){
	Log.note("Success with index="+i);
					self.results[i] = data;
					if (self.isComplete()){
						self.callbackObject.success(self.results);
					}//endif
				},
				"error":function(errorMsg, errorData, errorThrown){
					self.kill();
					Log.error(errorMsg, errorThrown);
				}
			});
		})(i);
	}
};

MultiElasticSearchQuery.prototype.isComplete = function(){
	if (this.results.length != this.chartRequests.length) return false;

	for(var i = 0; i < this.results.length; i++){
		if (this.results[i] == undefined) return false;
	}
	return true;
};


MultiElasticSearchQuery.prototype.kill = function(){
	for(var i = 0; i < this.ElasticSearchQueryObjs.length; i++){
		if (this.ElasticSearchQueryObjs[i] != undefined){
			this.ElasticSearchQueryObjs[i].kill();
		}
	}

	ElasticSearchQueryObjs = [];

	return true;
};


////////////////////////////////////////////////////////////////////////////////
//OLD VERSION IS BACKWARD WRT CONTROLL FLOW
////////////////////////////////////////////////////////////////////////////////
var OldElasticSearchQuery = function(reportBackObj, id, esQuery){
	var output=new ElasticSearchQuery({
		"query":esQuery,
		"success":reportBackObj.success,
		"error":reportBackObj.error
	});
	output.callbackObject=reportBackObj;
	return output;
};

ElasticSearchQuery.OldRun = function(reportBackObj, id, esQuery){
	var q=OldElasticSearchQuery(reportBackObj, id, esQuery);
	q.Run();
	return q;
};//method


