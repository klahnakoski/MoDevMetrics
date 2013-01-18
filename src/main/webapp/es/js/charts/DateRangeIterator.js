/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DateRangeIterator = function(param){
	Util.copy(param, this);

	this.request = null;
	this.currentDate = null;

	this.NextQuery();
};

DateRangeIterator.prototype.NextQuery = function(){
	var dataSet = this.callbackObject.dataSet;

	if (dataSet.currentIndex <= dataSet.maxIndex){
		this.currentDate = this.startDate.add(this.interval.multiply(dataSet.currentIndex + 1));
		var queries = this.InjectDate();

		this.request = new MultiElasticSearchQuery(this, queries);
		this.request.Run();
	}else{
		D.action("Done");
	}//endif
};

DateRangeIterator.prototype.InjectDate = function(){
	//D.println("InjuectDate: " + JSON.stringify( this.chartRequest ));

	var chartRequest = Util.jsonCopy(this.queries);


	for(var i = 0; i < chartRequest.length; i++){
		if (chartRequest[i].dayShift === undefined) chartRequest[i].dayShift = 0;

		if (this.useWindow){
			this.insertTimeIntervalIntoQuery(chartRequest[i].esQuery, this.currentDate.add(this.interval.multiply(chartRequest[i].dayShift)));
		}else{
			this.insertTimePointIntoQuery(chartRequest[i].esQuery, this.currentDate.add(this.interval.multiply(chartRequest[i].dayShift)));
		}//endif
	}//for

	//D.println("InjuectDate: " + JSON.stringify( chartRequest ));

	return chartRequest;
};


DateRangeIterator.prototype.insertTimePointIntoQuery = function(esQuery, date){
	esQuery.query.filtered.filter.and.push({ "range" : { "modified_ts" : { "lt" : date.getMilli() } } });
	esQuery.query.filtered.filter.and.push({ "range" : { "expires_on" : { "gte" : date.getMilli()} } });
};

DateRangeIterator.prototype.insertTimeIntervalIntoQuery = function(esQuery, date){
	esQuery.query.filtered.filter.and.push({ "range" : { "modified_ts" : { "gte" : date.getMilli() } } });
	esQuery.query.filtered.filter.and.push({ "range" : { "modified_ts" : { "lt" : date.add(this.interval).getMilli()} } });
};






DateRangeIterator.prototype.success = function(data){

	this.callbackObject.success(data, this.callbackObject.dataSet.currentIndex);
	this.callbackObject.dataSet.currentIndex += 1;
	this.NextQuery();
};

DateRangeIterator.prototype.error = function(errorData, errorMsg, errorThrown){
	this.callbackObject.error(errorMsg, errorData, errorThrown);
};

DateRangeIterator.prototype.kill = function(){
	this.request.kill();
	this.request = null;
};