DataSet = function(){
	this.store = {};
	this.currentIndex = 0;
	this.maxIndex = 10;
};

DataSet.prototype.InsureSeriesAndID = function(series, id){
	if (!(series in this.store))
		this.store[series] = {};

	if (!(id in this.store[series]))
		this.store[series][id] = {};
};

DataSet.prototype.addData = function(series, id, name, value){
	this.InsureSeriesAndID(series, id);
	this.store[series][id][name] = value;
};