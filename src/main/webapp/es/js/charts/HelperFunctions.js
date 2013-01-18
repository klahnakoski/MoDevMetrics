/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */




function convertDateToString(date){
	var dateString = date.getUTCFullYear();

	dateString += "-";
	dateString += addLeadingZero(date.getUTCMonth() + 1);
	dateString += "-";
	dateString += addLeadingZero(date.getUTCDate());
	dateString += "T";
	dateString += addLeadingZero(date.getUTCHours());
	dateString += ":";
	dateString += addLeadingZero(date.getUTCMinutes());
	dateString += ":";
	dateString += addLeadingZero(date.getUTCSeconds());
	dateString += ".000Z";

	return dateString;
}
;

function insureMustAndMustNot(queryObj){
	if (!("query" in queryObj.query))
		queryObj.query = {};

	if (!("filtered" in queryObj.query))
		queryObj.query.filtered = {};

	if (!("query" in queryObj.query.filtered))
		queryObj.query.filtered.query = {};

	if (!("bool" in queryObj.query.filtered.query))
		queryObj.query.filtered.query.bool = {};

	if (!("must" in queryObj.query.filtered.query.bool))
		queryObj.query.filtered.query.bool.must = [];

	if (!("must_not" in queryObj.query.filtered.query.bool))
		queryObj.query.filtered.query.bool.must_not = [];
}

function insureShould(queryObj){
	if (!("query" in queryObj))
		queryObj.query = {};

	if (!("filtered" in queryObj.query))
		queryObj.query.filtered = {};

	if (!("query" in queryObj.query.filtered))
		queryObj.query.filtered.query = {};

	if (!("bool" in queryObj.query.filtered.query))
		queryObj.query.filtered.query.bool = {};

	if (!("should" in queryObj.query.filtered.query.bool))
		queryObj.query.filtered.query.bool.should = [];

	if (!("minimum_number_should_match" in queryObj.query.filtered.query.bool))
		queryObj.query.filtered.query.bool.minimum_number_should_match = 1;

}

function insertIndexIntoQuery(queryObj, iterateField, index){
	insureMustAndMustNot(queryObj);

	var term = {};
	term['term'] = {}
	term['term'][iterateField] = index;

	queryObj.query.filtered.query.bool.must.push(term);
}
;

function convertStringToDate(dateString){
	var date = new Date();

	date.setUTCFullYear(dateString.slice(0, 4));
	date.setUTCMonth(dateString.slice(5, 7) - 1);
	date.setUTCDate(dateString.slice(8, 10));
	date.setUTCHours(dateString.slice(11, 13));
	date.setUTCMinutes(dateString.slice(14, 16));
	date.setUTCSeconds(dateString.slice(17, 19));
	return date;
}
;

function addLeadingZero(number){
	var numberString = "" + number;
	if (number < 10)
		numberString = "0" + number;

	return numberString;
}
;

function getNumberOfDays(startDate, endDate){
	var difference = endDate - startDate;
	return Math.floor(difference / (1000 * 60 * 60 * 24));
}
;


function include(arr, obj){
	for(var i = 0; i < arr.length; i++){
		if (arr[i] == obj) return true;
	}
}

var isEven = function(someNumber){
	return (someNumber % 2 == 0) ? true : false;
};
