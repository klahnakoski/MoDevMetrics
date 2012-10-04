RestQuery = function(reportBackObj, id, esQuery){
	this.id = id;
	this.reportBackObj = reportBackObj;
	this.query = esQuery;

//	if (esQuery.query.filtered !== undefined){
//		D.println("Not expected");
//	}//endif

	this.request = null;
};

RestQuery.prototype.Run = function(){
	var localObject = this;

	//console.info("URL: " + window.ElasticSearchRestURL);

	this.request = $.ajax({
		url: window.ElasticSearchRestURL,
		type: "POST",
//			contentType: "application/json",
		data: JSON.stringify(this.query),
		dataType: "json",
//			traditional: true,
//			processData: false,
//			timeout: 100000,

		success: function(data){
			localObject.Success(data);
		},

		error: function (errorData, errorMsg, errorThrown){
			localObject.Error(errorData, errorMsg, errorThrown);
		}
	});
};

RestQuery.prototype.Success = function(data){
	if (this.reportBackObj != undefined)
		this.reportBackObj.Success(this, data)
	else
		console.warn("RestQuery - Success: report back object is undefined.");
};

RestQuery.prototype.Error = function(errorData, errorMsg, errorThrown){
	if (this.reportBackObj != undefined)
		this.reportBackObj.Error(this, errorData, errorMsg, errorThrown);

	console.error("RestQuery.error: " + errorMsg);
};

RestQuery.prototype.Kill = function(data){
	if (this.request != undefined){
		this.request.abort();
		this.request = null;
		return true;
	}

	return false;
};

MultiRestQuery = function(reportBackObj, id, chartRequests){
	this.reportBackObj = reportBackObj;
	this.id = id;
	this.chartRequests = chartRequests;

	this.restQueryObjs = [];
	this.results = [];

};

MultiRestQuery.prototype.Run = function(){
	for(var i in this.chartRequests){
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

MultiRestQuery.prototype.Success = function(restQueryObj, data){
	this.results[ restQueryObj.id ] = data;

	if (this.IsComplete()){
		this.reportBackObj.Success(this, this.results);
	}
};

MultiRestQuery.prototype.Error = function(errorData, errorMsg, errorThrown){
	console.error("RestQuery.error: " + errorMsg);
	this.Kill();

	if (this.reportBackObj != undefined)
		this.reportBackObj.Error(this, errorData, errorMsg, errorThrown);
};

MultiRestQuery.prototype.Kill = function(){
	for(var i = 0; i < this.restQueryObjs.length; i++){
		if (this.restQueryObjs[i] != undefined){
			this.restQueryObjs[i].Kill();
		}
	}

	restQueryObjs = [];

	return true;
};


