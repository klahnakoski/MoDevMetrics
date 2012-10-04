RangeIterator = function(reportBackObj, queries)
{
	this.reportBackObj = reportBackObj;
	this.queries = queries;
	this.request = null;
	this.currentDate = null;

	this.NextQuery();
}

RangeIterator.prototype.NextQuery = function()
{
	var dataSet = this.reportBackObj.dataSet;

	if( dataSet.currentIndex <= dataSet.maxIndex) {

		var queries = this.InjectIndex();

		this.request = new MultiRestQuery( this, dataSet.currentIndex, queries);
		this.request.Run();
	}
}

RangeIterator.prototype.InjectIndex = function()
{
	var queries = Util.jsonCopy(this.queries);
	
	var iterateField = this.reportBackObj.iterateField;

	for(var i=0; i<queries.length; i++)
		insertIndexIntoQuery( queries[i].query, this.reportBackObj.iterateField, this.reportBackObj.dataSet.currentIndex );

	return queries;
};

RangeIterator.prototype.Success = function( requestObj, data ) {
	
	this.reportBackObj.Success( this, data );
	this.reportBackObj.dataSet.currentIndex += 1;
	this.NextQuery();
};

RangeIterator.prototype.Error = function( requestObj, errorData, errorMsg, errorThrown ) {
	this.reportBackObj.Error( requestObj, errorData, errorMsg, errorThrown );
};

RangeIterator.prototype.Kill = function()
{
	if( this.request != null )
	{
		this.request.Kill();
		this.request = null;
	}
}