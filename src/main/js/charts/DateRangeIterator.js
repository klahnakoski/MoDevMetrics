DateRangeIterator = function(reportBackObj, startDate, endDate, queries)
{
	this.reportBackObj = reportBackObj;
	this.startDate = startDate;
	this.endDate = endDate;
	this.queries = queries;
	this.request = null;
	this.currentDate = null;
	
	this.NextQuery();
}

DateRangeIterator.prototype.NextQuery = function()
{
	var dataSet = this.reportBackObj.dataSet;

	if( dataSet.currentIndex <= dataSet.maxIndex) {

		this.currentDate = new Date();
		this.currentDate.setTime( this.startDate.getTime() + ( dataSet.currentIndex*1000*60*60*24 ) + 86399000 );	
			
		var queries = this.InjectDate();

		this.request = new MultiRestQuery( this, dataSet.currentIndex, queries);
		this.request.Run();
	}
}

DateRangeIterator.prototype.InjectDate = function()
{
	//console.info("InjuectDate: " + JSON.stringify( this.queries ));

	var queries = clone(this.queries);


	var dateString = "";
	
	for(i=0; i<queries.length; i++)
	{
		if( "dayShift" in queries[i] ) 
			dateString = convertDateToString( this.DayShift(this.currentDate, queries[i].dayShift)  );
		else dateString = convertDateToString( this.currentDate );
		
		//console.info("dateString: " + dateString);
		
		insertDateIntoQuery( queries[i].query, dateString );
	}

	//console.info("InjuectDate: " + JSON.stringify( queries ));
	
	return queries;
}

DateRangeIterator.prototype.DayShift = function(date, shiftAmount) {
	newDate = new Date();
	newDate.setTime(date.getTime() + (shiftAmount * 1000*60*60*24));
	return newDate;
}

DateRangeIterator.prototype.Success = function( requestObj, data ) {
	
	this.reportBackObj.Success( this, data )
	this.reportBackObj.dataSet.currentIndex += 1;
	this.NextQuery();
};

DateRangeIterator.prototype.Error = function( requestObj, errorData, errorMsg, errorThrown ) {
	this.reportBackObj.Error( requestObj, errorData, errorMsg, errorThrown );
};

DateRangeIterator.prototype.Kill = function()
{
	this.request.Kill();
	this.request = null;
}