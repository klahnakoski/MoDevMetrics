importScript("RestConfig.js");



RestQuery = function(reportBackObj, id, esQuery){
	if (reportBackObj===undefined) D.error("expecting an object to reprt back response");
	this.id = id;
	this.callbackObject = reportBackObj;
	this.query = esQuery;
	this.request = null;
};


RestQuery.Run = function(reportBackObj, id, esQuery){
	var q=new RestQuery(reportBackObj, id, esQuery);
	q.Run();
	return q;
};//method

//JUST LIKE RUN, BUT INSTEAD OF SENDING QUERY, EXECUTE success() USING data
//JUST COMMENT-OUT A COUPLE OF LINES TO SWITCH BETWEEN LOCAL AND NETORK TESTING
RestQuery.Use = function(data, reportBackObj, id, esQuery){
	reportBackObj.success(this, data);
};//method

RestQuery.prototype.Run = function(){
	var localObject = this;

//	D.println(CNV.Object2JSON(this.query));


	this.request = $.ajax({
		url: window.ElasticSearchRestURL,
		type: "POST",
		data: JSON.stringify(this.query),
		dataType: "json",

		success: function(data){localObject.success(data);},
		error: function(errorData, errorMsg, errorThrown){localObject.error(errorData, errorMsg, errorThrown);}
	});
};

RestQuery.prototype.success = function(data){
	if (data==null) D.error("Maybe you are not connected to Mozilla-MPT?");
	if (this.callbackObject===undefined) return;
	if (this.callbackObject.success===undefined) D.error("RestQuery - Can not report back success!!");
	try{
		this.callbackObject.success(this, data);
	}catch(e){
		D.warning("Problem calling success()", e);
	}//try
};


RestQuery.prototype.error = function(errorData, errorMsg, errorThrown){
	if (this.callbackObject===undefined) return;
	if (this.callbackObject.error===undefined) D.error(errorMsg);
	
	try{
		this.callbackObject.error(this, errorData, errorMsg, errorThrown);
	}catch(e){
		D.warning("Problem with reporting back error: '"+errorMsg+"'", e);
	}//try
};


RestQuery.prototype.kill = function(data){
	this.callbackObject=undefined;
	if (this.request != undefined){
		this.request.abort();
		this.request = undefined;
	}//endif
};





MultiRestQuery = function(reportBackObj, id, chartRequests){
	this.callbackObject = reportBackObj;
	this.id = id;
	this.chartRequests = chartRequests;

	this.restQueryObjs = [];
	this.results = [];

};

MultiRestQuery.prototype.Run = function(){
	for(var i=0;i<this.chartRequests.length;i++){
		var restQuery = new RestQuery(this, i, this.chartRequests[i].esQuery);
		this.restQueryObjs[i] = restQuery;
		restQuery.Run();
	}
};

MultiRestQuery.prototype.IsComplete = function(){
	if (this.results.length != this.chartRequests.length){
		return false;
	}

	for(var i = 0; i < this.results.length; i++){
		if (this.results[i] == undefined)
			return false;
	}

	return true;
};

MultiRestQuery.prototype.success = function(restQueryObj, data){
	this.results[ restQueryObj.id ] = data;

	if (this.IsComplete()){
		this.callbackObject.success(this, this.results);
	}
};

MultiRestQuery.prototype.error = function(errorData, errorMsg, errorThrown){
	console.error("RestQuery.error: " + errorMsg);
	this.kill();

	if (this.callbackObject != undefined)
		this.callbackObject.error(this, errorData, errorMsg, errorThrown);
};

MultiRestQuery.prototype.kill = function(){
	for(var i = 0; i < this.restQueryObjs.length; i++){
		if (this.restQueryObjs[i] != undefined){
			this.restQueryObjs[i].kill();
		}
	}

	restQueryObjs = [];

	return true;
};


