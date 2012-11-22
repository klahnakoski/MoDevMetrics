var ES = {};

ES.makeFilter = function(field, values){
	if (values.length == 0) return ES.TrueFilter;

	var output = {};
	output["terms"] = {};
	output["terms"][field] = values;

	return output;
};//method



ES.TrueFilter = {"script":{"script":"true"}};


ES.InjectGUIFilters = function(chartRequests){
	if (!(chartRequests instanceof Array)) D.error("Expecting an array of chartRequests");
	for(var i = 0; i < chartRequests.length; i++){
		ES.InjectGUIFilter(chartRequests[i]);
	}//for
};

ES.InjectGUIFilter = function(chartRequest){
	if (chartRequest.esQuery === undefined)
		D.error("Expecting chart requests to have a \"esQuery\", not \"query\"");

	ElasticSearch.injectFilter(chartRequest.esQuery, ProgramFilter.makeFilter());
	ElasticSearch.injectFilter(chartRequest.esQuery, ProductFilter.makeFilter());
	ElasticSearch.injectFilter(chartRequest.esQuery, ComponentFilter.makeFilter());

	InjectCustomFilters(chartRequest);
};



