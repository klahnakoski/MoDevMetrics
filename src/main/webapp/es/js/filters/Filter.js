var ES = {};

ES.makeFilter = function(field, values){
	if (values.length == 0) return ES.TrueFilter;

	var output = {};
	output["terms"] = {};
	output["terms"][field] = values;

	return output;
};//method


ES.TrueFilter = {"script":{"script":"true"}};


ES.InjectFilters = function(chartRequests){
	if (!(chartRequests instanceof Array)) D.error("Expecting an array of chartRequests");
	for(var i = 0; i < chartRequests.length; i++){
		ES.InjectFilter(chartRequests[i]);
	}//for
};

ES.InjectFilter = function(chartRequest){
	if (chartRequest.esQuery === undefined)
		D.error("Expecting chart requests to have a \"esQuery\", not \"query\"");

	if (chartRequest.esQuery.query.filtered === undefined){
		var filtered = {};
		filtered.filtered = {};
		filtered.filtered.query = chartRequest.esQuery.query;
		filtered.filtered.filter = chartRequest.esQuery.filter;

		chartRequest.esQuery.query = filtered;
		chartRequest.esQuery.filter = undefined;
	}//endif


	var and = chartRequest.esQuery.query.filtered.filter.and;

	and.push(ProgramFilter.makeFilter());
	and.push(ProductUI.makeFilter());
	and.push(ComponentUI.makeFilter());

	InjectCustomFilters(chartRequest);
};



