var ES = {};

ES.makeFilter = function(field, values){
	if (values.length == 0) return ES.TrueFilter;

	var output = {};
	output["terms"] = {};
	output["terms"][field] = values;

	return output;
};//method



ES.TrueFilter = {"script":{"script":"true"}};




