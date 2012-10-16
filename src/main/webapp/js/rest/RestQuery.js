RestQuery = function(reportBackObj, id, esQuery){
	this.id = id;
	this.reportBackObj = reportBackObj;
	this.query = esQuery;

//	if (esQuery.query.filtered !== undefined){
//		D.println("Not expected");
//	}//endif

	this.request = null;
};


RestQuery.Run = function(reportBackObj, id, esQuery){
	new RestQuery(reportBackObj, id, esQuery).Run();
};//method


RestQuery.prototype.Run = function(){
	var localObject = this;

//	console.info(CNV.Object2JSON(this.query));


	this.request = $.ajax({
		url: window.ElasticSearchRestURL,
		type: "POST",
		data: JSON.stringify(this.query),
		dataType: "json",

		success: function(data){
			localObject.success(data);
		},

		error: function (errorData, errorMsg, errorThrown){
			try{
				localObject.error(errorData, errorMsg, errorThrown);
			}catch(e){
				D.error(errorMsg);
			}//try
		}
	});
};

RestQuery.prototype.success = function(data){
	try{
		this.reportBackObj.success(this, data);
	}catch(e){
		D.error("RestQuery - Can not report back success!!");
	}//try
};


RestQuery.prototype.error = function(errorData, errorMsg, errorThrown){
	try{
		this.reportBackObj.error(this, errorData, errorMsg, errorThrown);
	}catch(e){
		D.error(errorMsg);
	}//try
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
		this.reportBackObj.success(this, this.results);
	}
};

MultiRestQuery.prototype.error = function(errorData, errorMsg, errorThrown){
	console.error("RestQuery.error: " + errorMsg);
	this.Kill();

	if (this.reportBackObj != undefined)
		this.reportBackObj.error(this, errorData, errorMsg, errorThrown);
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


