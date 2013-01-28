/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var ES = {};

ES.makeFilter = function(field, values){
	if (values.length == 0) return ES.TrueFilter;

	var output = {};
	output["terms"] = {};
	output["terms"][field] = values;

	return output;
};//method



ES.TrueFilter = {"script":{"script":"true"}};




