/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


ElasticSearch=function(esquery){
	this.esquery=esquery;
};


//THE CONTENT FOUNDNAT https://metrics.mozilla.com/bugzilla-analysis IS ACTUALLY
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

//	ElasticSearch.pushURL="http://localhost:9200";
	ElasticSearch.pushURL="http://elasticsearch7.metrics.scl3.mozilla.com:9200";
//
//	ElasticSearch.baseURL="http://localhost:9200";
//	ElasticSearch.queryURL = "http://localhost:9200/bugs/_search";
	ElasticSearch.baseURL="http://elasticsearch8.metrics.scl3.mozilla.com:9200";
	ElasticSearch.queryURL = "http://elasticsearch8.metrics.scl3.mozilla.com:9200/bugs/_search";


}//endif



ElasticSearch.search=function(esquery){
	var output=yield (Rest.post({
		url: window.ElasticSearch.queryURL,
		data: CNV.Object2JSON(esquery),
		dataType: "json"
	}));

	yield (output);
};




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
			D.error("if passing a parameter object, it must have both query and success attributes");
		this.callbackObject = query;
		this.query = query.query;
	}else{
		if (successFunction===undefined)
			D.error("expecting an object to report back response");
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
	if (this.callbackObject.success===undefined) D.error();
	if (ElasticSearchQuery.DEBUG) D.println(CNV.Object2JSON(this.query));

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
		D.action("Not connected?");
		D.warning("Maybe you are not connected to Mozilla-MPT?");
		try{
			this.callbackObject.success(data);
		}catch(e){
			D.warning("Problem calling success()", e);
		}//try
		return;
	}//endif
	if (this.callbackObject===undefined) return;
	if (this.callbackObject.success===undefined) D.error("ElasticSearchQuery - Can not report back success!!");

	if (data._shards.failed>0){
		D.warning("Must resend query...");
		var self=this;
		self.timeout=Util.coalesce(self.timeout, 1000)*2;
		setTimeout(function(){self.Run();}, self.timeout);
//		this.Run();
		return;
	}//endif

	try{
		this.callbackObject.success(data);
	}catch(e){
		D.warning("Problem calling success()", e);
	}//try
};


ElasticSearchQuery.prototype.error = function(errorData, errorMsg, errorThrown){
	if (this.callbackObject===undefined) return;
	if (this.callbackObject.error===undefined) D.error(errorMsg);
	
	try{
		this.callbackObject.error(this, errorData, errorMsg, errorThrown);
	}catch(e){
		D.warning("Problem with reporting back error: '"+errorMsg+"'", e);
	}//try
};


ElasticSearchQuery.prototype.kill = function(data){
	this.callbackObject=undefined;
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
	D.println("Success with index="+i);
					self.results[i] = data;
					if (self.isComplete()){
						self.callbackObject.success(self.results);
					}//endif
				},
				"error":function(errorMsg, errorData, errorThrown){
					self.kill();
					D.error(errorMsg, errorThrown);
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


