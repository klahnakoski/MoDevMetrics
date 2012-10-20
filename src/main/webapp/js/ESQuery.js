var ESQuery = function(query){
	this.query = query;
	this.compile();
};

ESQuery.prototype.run = function(successCallback){
	this.callback = successCallback;

	this.restQuery=RestQuery.Run(
		this,
		0,
		this.esQuery
	);
};//method


ESQuery.prototype.success = function(requestObj, data){
	if (this.callback===undefined) return;

	status.message("Extract Cube");

	if (this.esMode == "terms"){
		this.termsResults(data);
	} else if (this.esMode == "terms_stats"){
		this.terms_statsResults(data);
	} else{//statistical
		this.statisticalResults(data);
	}//endif


	this.callback(this.query);
};

ESQuery.prototype.error = function(requestObj, errorData, errorMsg, errorThrown){
	D.error(errorMsg)
};

ESQuery.prototype.kill = function(){
	if (this.restQuery!==undefined){
		this.restQuery.kill();
		this.restQuery=undefined;
	}//endif
	this.callack=undefined;
};





ESQuery.prototype.compileSetOp=function(){
	//FIND FILTER ELEMENTS THAT CAN BE USED AT THE BUG LEVEL

	//


};


ESQuery.prototype.compile = function(){

	//NO FACETS IMPLIES NO AGGREGATION AND NO GROUPING:  SIMPLE SET OPERATION
	if (this.query.facets === undefined || this.query.facets.length == 0){
		return this.compileSetOP();
	}//endif



	//ENSURE THERE IS ONLY ONE SELECT
	this.resultColumns = SQL.compile(this.query, []);

	this.select = SQL.select2Array(this.query.select)[0];

	this.facets = this.query.facets.copy();
//DISABLED FOR NOW
	if (!(this.query.select instanceof Array) && this.query.select.operation=="count"){
		this.esMode="terms";
		this.esQuery = this.buildESTermsQuery();
	}else{
		//A SPECIAL FACET IS ONE THAT HAS AN UNDEFINED NUMBER OF PARTITIONS AT QUERY TIME
		//FIND THE specialFacet, IF ONE
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
	}//endif

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
					"size":this.query.essize
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


ESQuery.prototype.buildESTermsQuery=function(){

	if (this.query.where===undefined) this.query.where="true";


	var output={
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
			"0":{
				"terms":{
					"script_field":this.compileFacets2Term(),
					"size": 100000
				}
			}
		}
	};

	output.query.filtered.filter.and.push(this.query.esfilter);

	return output;
};


//GIVE MVEL CODE THAT REDUCES A UNIQUE TUPLE OF PARTITIONS DOWN TO A UNIQUE TERM
//GIVE JAVASCRIPT THAT WILL CONVERT THE TERM BACK INTO THE TUPLE
ESQuery.prototype.compileFacets2Term=function(){
	var facets=this.facets;

	var mvel=undefined;
	var fromTerm2Part=[];
	for(var i=0;i<facets.length;i++){
		if (mvel===undefined) mvel="''+"; else mvel+="+'|'+";
		var t;
		if (facets[i].domain.type=="time" || facets[i].domain.type=="duration"){
			t=ESQuery.compileTime2Term(facets[i]);
		}else{
			t=ESQuery.compileString2Term(facets[i]);
		}//for
		fromTerm2Part.push(t.fromTerm);
		mvel+=t.toTerm;
	}//for

	//REGISTER THE DECODE FUNCTION
	this.term2Parts=function(term){
		var output=[];
		var terms=term.split('|');
		for(var i=0;i<terms.length;i++){
			output.push(fromTerm2Part[i](terms[i]));
		}//for
		return output;
	};


	var library=
		"var replaceAll = function(output, find, replace){\n" +
			"s = output.indexOf(find, 0);\n" +
			"while(s>=0){\n" +
				"output=output.replace(find, replace);\n" +
				"s=s-find.length+replace.length;\n" +
				"s = output.indexOf(find, s);\n" +
			"}\n"+
			"output;\n"+
		"};\n";

	//v="var replaceAll = function(output, find, replace){\ns=0;\nwhile(true){\ns = output.indexOf(find, s);\nif (s < 0) break;\noutput=output.replace(find, replace);\ns=s-find.length+replace.length;\n}\noutput;\n};\nreplaceAll(replaceAll(value, \"\\\\\", \"\\\\\\\\\"), \"|\", \"\\\\p\")+'|'+((((doc[\"modified_ts\"].value-doc[\"created_ts\"].value)<0) || ((doc[\"modified_ts\"].value-doc[\"created_ts\"].value)>=0)) ? 13 : Math.floor(((doc[\"modified_ts\"].value-doc[\"created_ts\"].value)-0)/604800000))";


	return library+mvel;
};


ESQuery.compileString2Term=function(facet){
	var value=facet.value;
	if (ESQuery.isKeyword(value)) value="doc[\""+value+"\"].value";

	return {
		"toTerm":'replaceAll(replaceAll('+value+', "\\\\", "\\\\\\\\"), "|", "\\\\p")',
		"fromTerm":function(value){
			return facet.domain.getPartition(value.replaceAll("\\p", "|").replaceAll("\\\\", "\\"));
		}
	};
};//method


//RETURN MVEL CODE THAT MAPS TIME AND DURATION DOMAINS DOWN TO AN INTEGER AND
//AND THE JAVASCRIPT THAT WILL TURN THAT INTEGER BACK INTO A PARTITION (INCLUDING NULLS)
ESQuery.compileTime2Term=function(facet){
	if (facet.domain.type!="time" && facet.domain.type!="duration") D.error("can only translate time and duration domains");

	//IS THERE A LIMIT ON THE DOMAIN?
	var numPartitions=facet.domain.partitions.length;
	var value=facet.value;
	if (ESQuery.isKeyword(value)) value="doc[\""+value+"\"].value";

	var ref, nullTest, partition2int, int2Partition;
	if (facet.domain["<"]===undefined){
		if (facet.domain[">="]===undefined){
			ref=Date.now().floor(facet.domain.interval);
			ref=facet.domain.type=="time"?ref.getMilli():ref.milli;
			partition2int="Math.floor(("+value+"-"+ref+")/"+facet.domain.interval.milli+")";
			nullTest="false";
		}else{
			ref=facet.domain[">="];
			ref=facet.domain.type=="time"?ref.getMilli():ref.milli;
			partition2int="Math.floor(("+value+"-"+ref+")/"+facet.domain.interval.milli+")";
			nullTest=""+value+"<"+ref;
		}//endif
	}else if (facet.domain[">="]===undefined){
		ref=facet.domain["<"];
		ref=facet.domain.type=="time"?ref.getMilli():ref.milli;
		partition2int="Math.floor(("+value+"-"+ref+")/"+facet.domain.interval.milli+")";
		nullTest=""+value+">="+ref;
	}else{
		var top=facet.domain["<"]; top=facet.domain.type=="time"?top.getMilli():top.milli;
		    ref=facet.domain[">="];ref=facet.domain.type=="time"?ref.getMilli():ref.milli;
		partition2int="Math.floor(("+value+"-"+ref+")/"+facet.domain.interval.milli+")";
		nullTest="("+value+"<"+ref+") || ("+value+">="+top+")";
	}//endif

	partition2int="(("+nullTest+") ? "+numPartitions+" : "+partition2int+")";
	if (facet.domain.type=="time"){
		int2Partition=function(value){
			if (Math.round(value)==numPartitions) return facet.domain.NULL;
			return facet.domain.getPartition(new Date((value*facet.domain.interval.milli)+ref));
		};
	}else{
		int2Partition=function(value){
			if (Math.round(value)==numPartitions) return facet.domain.NULL;
			return facet.domain.getPartition(Duration.newInstance((value*facet.domain.interval.milli)+ref));
		};
	}//endif

	return {"toTerm":partition2int, "fromTerm":int2Partition};
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


ESQuery.prototype.termsResults=function(data){
	var terms=data.facets["0"].terms;

	//GETTING ALL PARTS WILL EXPAND THE FACETS' DOMAINS
	for(var i=0;i<terms.length;i++)
		this.term2Parts(terms[i].term);

	//NUMBER ALL FACETS FOR CUBE INDEXING
	for(var f=0;f<this.facets.length;f++){
		var parts=this.facets[f].domain.partitions;
		var p=0;
		for(;p<parts.length;p++){
			parts[p].dataIndex=p;
		}//for
		this.facets[f].domain.NULL.dataIndex=p;
	}//for

	//MAKE CUBE
	var cube = SQL.cube.newInstance(this.query.facets, 0, this.query.select);

	//FILL CUBE
	for(var i=0;i<terms.length;i++){
		var d = cube;
		var parts=this.term2Parts(terms[i].term);
		var t = 0;
		for(; t < parts.length-1; t++){
			d = d[parts[t].dataIndex];
		}//for
		d[parts[t].dataIndex] = terms[i].count;
	}//for

	this.query.data=cube;
};

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
				var part = {"value":term, "name":term};
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



