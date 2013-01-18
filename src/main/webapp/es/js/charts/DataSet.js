/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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