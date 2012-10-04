DateRangeIterator = function(reportBackObj, startDate, endDate, queries)
{
	this.reportBackObj = reportBackObj;
	this.startDate = startDate;
	this.endDate = endDate;
	this.queries = queries;
	this.request = null;
	this.currentDate = null;
	
	this.NextQuery();
};

DateRangeIterator.prototype.NextQuery = function()
{
	var dataSet = this.reportBackObj.dataSet;

	if( dataSet.currentIndex <= dataSet.maxIndex) {
		this.currentDate = this.startDate.addDay(dataSet.currentIndex+1);
		var queries = this.InjectDate();

		this.request = new MultiRestQuery( this, dataSet.currentIndex, queries);
		this.request.Run();
	}
};

DateRangeIterator.prototype.InjectDate = function()
{
	//console.info("InjuectDate: " + JSON.stringify( this.chartRequest ));

	var chartRequest = Util.jsonCopy(this.queries);


	for(var i=0; i<chartRequest.length; i++){
		if(chartRequest[i].dayShift===undefined) chartRequest[i].dayShift=0;

		ES.insertDateIntoQuery(chartRequest[i].esQuery,  this.currentDate.addDay(chartRequest[i].dayShift));
	}//for

	//console.info("InjuectDate: " + JSON.stringify( chartRequest ));
	
	return chartRequest;
};

DateRangeIterator.prototype.Success = function( requestObj, data ) {
	
	this.reportBackObj.Success( this, data );
	this.reportBackObj.dataSet.currentIndex += 1;
	this.NextQuery();
};

DateRangeIterator.prototype.Error = function( requestObj, errorData, errorMsg, errorThrown ) {
	this.reportBackObj.Error( requestObj, errorData, errorMsg, errorThrown );
};

DateRangeIterator.prototype.Kill = function(){
	this.request.Kill();
	this.request = null;
};