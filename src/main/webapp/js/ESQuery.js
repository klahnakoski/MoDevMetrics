var ESQuery = function(query){
	this.query = query;
	this.compile();
};

ESQuery.prototype.run = function(successCallback){
	this.callback = successCallback;

	RestQuery.Run(
		this,
		0,
		this.esQuery
	);
};//method


ESQuery.prototype.success = function(requestObj, data){
	status.message("Extract Cube");

	if (this.esMode == "terms_stats"){
		this.terms_statsResults(data);
	} else{//statistical
		this.statisticalResults(data);
	}//endif


	this.callback(this.query);
};


ESQuery.prototype.error = function(requestObj, errorData, errorMsg, errorThrown){
	D.error(errorMsg)
};


ESQuery.prototype.compile = function(){
	//ENSURE THERE IS ONLY ONE SELECT
	this.resultColumns = SQL.compile(this.query, []);


	this.select = SQL.select2Array(this.query.select)[0];

	//A SPECIAL FACET IS ONE THAT HAS AN UNDEFINED NUMBER OF PARTITIONS AT QUERY TIME
	//FIND THE specialFacet, IF ONE
	this.facets = this.query.facets.copy();
	this.esMode = "terms_stats";
	this.specialFacet = null;
	for(var f = 0; f < this.facets.length; f++){
		if ((["set", "duration", "time"].contains(this.facets[f].domain.type))){
			for(var p = this.facets[f].domain.partitions.length; p--;){
				this.facets[f].domain.partitions[p].dataIndex = p;
			}//for
		} else{
			if (this.specialFacet != null) D.error("There is more than one open-ended facet: this can not be handled");
			this.specialFacet = this.facets.splice(f, 1)[0];
			f--;
		}//endif
	}//for
	if (this.specialFacet == null){
		this.esMode = "statistical";
	}//endif

	this.esQuery = this.buildESQuery();
	var esFacets = this.buildFacetQueries();
	for(var i = 0; i < esFacets.length; i++){
		this.esQuery.facets[esFacets[i].name] = esFacets[i].value;
	}//for

};


// RETURN LIST OF ALL FACET QUERIES
ESQuery.prototype.buildFacetQueries = function(){
	var output = [];

	this.esFacets = this.getAllFacets(0);
	for(var i = 0; i < this.esFacets.length; i++){
		var condition = [];
		var name = "";
		for(var f = 0; f < this.facets.length; f++){
			if (name != "") name += ",";
			name += this.esFacets[i][f].dataIndex;
			condition.push(ESQuery.buildCondition(this.facets[f], this.esFacets[i][f]));
		}//for
		var q = {"name":name};

		if (this.esMode == "terms_stats"){
			q.value = {
				"terms_stats":{
					"key_field":this.specialFacet.value,
					"value_script":this.select.value,
					"size":0
				},
				"facet_filter":{
					"and":condition
				}
			};
		} else{//statistical
			q.value = {
				"statistical":{
					"script":this.select.value
				},
				"facet_filter":{
					"script":{"script":condition}
				}
			};
		}//endif

		output.push(q);
	}//for
	return output;
};//method



//RETURN ALL PARTITION COMBINATIONS:  A LIST OF ORDERED TUPLES
ESQuery.prototype.getAllFacets = function(facetDepth){
	if (facetDepth == this.facets.length) return [
		[]
	];
	var facet = this.facets[facetDepth];

	var output = [];
	var partitions = facet.domain.partitions;
	for(var i = 0; i < partitions.length; i++){
		var deeper = this.getAllFacets(facetDepth + 1);
		for(var o = 0; o < deeper.length; o++){
			deeper[o].unshift(partitions[i]);
			output.push(deeper[o]);
		}//for
	}//for
	return output;
};//method


ESQuery.isKeyword = function(value){
	for(var c = 0; c < value.length; c++){
		var cc = value.charAt(c);
		if ("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_.".indexOf(cc) == -1) return false;
	}//for
	return true;
};//method


//RETURN AN ES FILTER OBJECT
ESQuery.buildCondition = function(facet, partition){
	//RETURN AN ES FILTER OBJECT
	var output = {};
	if (ESQuery.isKeyword(facet.value)){
		//USE FAST ES SYNTAX
		if (facet.domain.type == "time"){
			output.range = {};
			output.range[facet.value] = {"gte":partition.min.getMilli(), "lt":+partition.max.getMilli()};
		} else if (facet.domain.type == "duration"){
			output.range = {};
			output.range[facet.value] = {"gte":partition.min.milli, "lt":+partition.max.milli};
		} else if (facet.domain.type == "set"){
			output.term = {};
			output.term[facet.value] = partition.value;
		} else{
			D.error("Facet \"" + facet.name + "\" is not supported");
		}//endif
	} else{
		//USE MVEL CODE
		if (facet.domain.type == "time"){
			output.script = {script:facet.value + ">=" + partition.min.getMilli() + " && " + facet.value + "<" + partition.max.getMilli()};
		} else if (facet.domain.type == "duration"){
			output.script = {script:facet.value + ">=" + partition.min.milli + " && " + facet.value + "<" + partition.max.milli};
		} else if (facet.domain.type == "set"){
			output.script = {script:facet.value + "==" + MVEL.Value2Code(partition.value)};
		} else{
			D.error("Facet \"" + facet.name + "\" is not supported");
		}//endif
	}//endif
	return output;
};


ESQuery.prototype.buildESQuery = function(){
	var output = {
		"query":{
			"filtered":{
				"query": {
					"match_all" : {}
				},
				"filter" : {
					"and":[
						{"script":{"script":this.query.where}}
					]
				}
			}
		},
		"from" : 0,
		"size" : 0,
		"sort" : [],
		"facets":{
		}
	};
	if (this.query.esfilter !== undefined) output.query.filtered.filter.and.push(this.query.esfilter);
	return output;
};//method




//MAP THE SELECT OPERATION NAME TO ES FACET AGGREGATE NAME
ESQuery.agg2es = {
	"sum":"total",
	"count":"count",
	"maximum":"max",
	"minimum":"min",
	"average":"mean"
};

//PROCESS RESULTS FROM THE ES STATISTICAL FACETS
ESQuery.prototype.statisticalResults = function(data){
//MAKE CUBE
	this.cube = SQL.cube.newInstance(this.query.facets, 0, this.query.select);

	//FILL CUBE
	var keys = Object.keys(data.facets);
	for(var k = 0; k < keys.length; k++){
		var facetName = keys[k];
		var coord = facetName.split(",");
		var d = this.cube;
		for(var f = 0; f < this.query.facets.length - 1; f++){
			d = d[parseInt(coord[f])];
		}//for
		var value = data.facets[facetName][ESQuery.agg2es[this.select.operation]];
		d[parseInt(coord[f])] = value;
	}//for
};//method



//PROCESS THE RESULTS FROM THE ES TERMS_STATS FACETS
ESQuery.prototype.terms_statsResults = function(data){
//FIND ALL TERMS FOUND BY THE SPECIAL FACET
	var partitions = [];
	var map = {};
	var keys = Object.keys(data.facets);
	for(var k = 0; k < keys.length; k++){
		var terms = data.facets[keys[k]].terms;
		for(var t = 0; t < terms.length; t++){
			var term = terms[t].term;
			if (map[term] === undefined){
				var part = {"value":term};
				partitions.push(part);
				map[term] = part;
			}//endif
		}//for
	}//for
	partitions.sort(this.specialFacet.domain.compare);
	for(var p = 0; p < partitions.length; p++) partitions[p].dataIndex = p;

	this.specialFacet.domain.map = map;
	this.specialFacet.domain.partitions = partitions;


	//MAKE CUBE
	var cube = SQL.cube.newInstance(this.query.facets, 0, this.query.select);

	//FILL CUBE
	for(var k = 0; k < keys.length; k++){
		var facetName = keys[k];
		var coord = facetName.split(",");
		var terms = data.facets[facetName].terms;
		for(var t = 0; t < terms.length; t++){
			var d = cube;
			var f = 0;
			var c = 0;
			for(; f < this.query.facets.length - 1; f++){
				if (this.query.facets[f] == this.specialFacet){
					d = d[this.specialFacet.domain.map[terms[t].term].dataIndex];
				} else{
					d = d[parseInt(coord[c])];
					c++;
				}//endif
			}//for
			var value = terms[t][ESQuery.agg2es[this.select.operation]];
			if (this.query.facets[f] == this.specialFacet){
				d[this.specialFacet.domain.map[terms[t].term]] = value;
			} else{
				d[parseInt(coord[c])] = value;
			}//endif
		}//for
	}//for

	this.query.data = cube;

};//method



