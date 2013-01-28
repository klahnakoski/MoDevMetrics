/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


RangeIterator = function(reportBackObj, queries){
	this.callbackObject = reportBackObj;
	this.queries = queries;
	this.request = null;
	this.currentDate = null;

	this.NextQuery();
};

RangeIterator.prototype.NextQuery = function(){
	var dataSet = this.callbackObject.dataSet;

	if (dataSet.currentIndex <= dataSet.maxIndex){
		var queries = this.InjectIndex();
		this.request = new MultiElasticSearchQuery(this, queries);
		this.request.Run();
	}else{
			}//endif

};

RangeIterator.prototype.InjectIndex = function(){
	var queries = Util.jsonCopy(this.queries);

	var iterateField = this.callbackObject.iterateField;

	for(var i = 0; i < queries.length; i++)
		insertIndexIntoQuery(queries[i].query, this.callbackObject.iterateField, this.callbackObject.dataSet.currentIndex);

	return queries;
};

RangeIterator.prototype.success = function(data){

	this.callbackObject.success(data, this.callbackObject.dataSet.currentIndex);
	this.callbackObject.dataSet.currentIndex += 1;
	this.NextQuery();
};

RangeIterator.prototype.error = function(requestObj, errorData, errorMsg, errorThrown){
	this.callbackObject.error(errorMsg, errorData, errorThrown);
};

RangeIterator.prototype.kill = function(){
	if (this.request != null){
		this.request.kill();
		this.request = null;
	}
}