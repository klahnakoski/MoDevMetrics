
importScript("charts/Status.js");
importScript("CNV.js");
importScript("aDate.js");
importScript("util.js");
importScript("Debug.js");
importScript("MVEL.js");
importScript("CUBE.js");








var ESQuery = function(query){
	this.query = query;
	this.compile();
};


ESQuery.DEBUG=false;

////////////////////////////////////////////////////////////////////////////////
// THESE ARE THE AVAILABLE ES INDEXES/TYPES
////////////////////////////////////////////////////////////////////////////////
ESQuery.INDEXES={
	"bugs":{"path":"/bugs"},
	"reviews":{"path":"/reviews/review"},
//	"reviews":{"path":"/reviews121206_150602/review"},
	"bug_summary":{"path":"/bug_summary/bug_summary"},
	"bug_tags":{"path":"/bug_tags/bug_tags"},
	"org_chart":{"path":"/org_chart/person"},
	"temp":{"path":""}
};


ESQuery.run=function(query){
	var esq=new ESQuery(query);
	return esq.run();	//RETURN A GENERATOR
};


ESQuery.prototype.run = function(){
	if (this.query.from=="org_chart")
		D.println("hi");
	if (!this.query.url) this.query.url=window.ElasticSearch.baseURL+ESQuery.INDEXES[this.query.from.split(".")[0]].path;
	this.query.url+="/_search";
	//var URL=window.ElasticSearch.baseURL+ESQuery.INDEXES[this.query.from.split(".")[0]].path+"/_search";
	var postResult;
	try{
		postResult=yield (Rest.post({
			url: this.query.url,
			data: JSON.stringify(this.esQuery),
			dataType: "json",
			headers:{
				"Accept-Encoding": "gzip,deflate"
//				"http.compress":"true"
			}
		}));

		if (postResult._shards.failed>0){
			status.message("ES Failure! Retrying...");
			D.warning("Must resend query...");
			yield aThread.sleep(1000);
			yield this.run();
		}//endif
	}catch(e){
		D.error("Error with ESQuery", e);
	}//try

	status.message("Process ES Terms");

	if (this.esMode == "terms"){
		this.termsResults(postResult);
	} else if (this.esMode == "setop"){
		this.mvelResults(postResult);
	} else if (this.esMode == "terms_stats"){
		this.terms_statsResults(postResult);
	} else{//statistical
		this.statisticalResults(postResult);
	}//endif

	yield this.query;
};//method


ESQuery.prototype.kill = function(){
	D.warning("do not need to call this anymore");
//
//	if (this.esRequest!==undefined){
//		try{
//			this.esRequest.abort();
//		}catch(e){
//
//		}//try
//		this.esRequest=undefined;
//	}//endif
//	this.callack=undefined;
};


//ACCEPT MULTIPLE ESQuery OBJECTS AND MERGE THE FACETS SO ONLY ONE CALL IS MADE TO ES
ESQuery.merge=function(){
	for(var i=0;i<arguments.length;i++){


	}//for





};//method






ESQuery.prototype.compile = function(){

	if (this.query.essize===undefined) this.query.essize=200000;
	if (ESQuery.DEBUG) this.query.essize=100;


	if (this.query.edges === undefined) this.query.edges=[];
	this.edges = this.query.edges.copy();
	this.select = CUBE.select2Array(this.query.select);
	
	//NO EDGES IMPLIES NO AGGREGATION AND NO GROUPING:  SIMPLE SET OPERATION
	if (this.edges.length==0){
		if (this.select[0].operation===undefined){
			this.esMode="setop";
			return this.compileSetOp();
		}else{
			var value=this.select[0].value;
			for(var k=this.select.length;k--;){
				if (this.select[k].value!=value) D.error("ES Query with mutiple select columns must all have the same value");
			}//for
		}//endif
	}else{
		//PICK FIRST AND ONLY SELECT
		if (this.select.length>1){
			D.error("Can not have an array of select columns, only one allowed");
		}else if (this.select.length==0){
			this.select=undefined;
		}else{
			this.select = this.select[0];
		}//endif
	}//endif
	if (this.query.where)
		D.error("ESQuery does not support the where clause, use esfilter instead");

	
	this.columns = CUBE.compile(this.query, []);
	this.edges = this.query.edges.copy();

	if (this.select===undefined || this.select.operation=="count"){
		this.esMode="terms";
		this.esQuery = this.buildESTermsQuery();
	}else{
		//A SPECIAL EDGE IS ONE THAT HAS AN UNDEFINED NUMBER OF PARTITIONS AT QUERY TIME
		//FIND THE specialEdge, IF ONE
		this.esMode = "terms_stats";
		this.specialEdge = null;
		for(var f = 0; f < this.edges.length; f++){
			if ((["set", "duration", "time"].contains(this.edges[f].domain.type))){
				for(var p = this.edges[f].domain.partitions.length; p--;){
					this.edges[f].domain.partitions[p].dataIndex = p;
				}//for
			} else{
				if (this.specialEdge != null) D.error("There is more than one open-ended edge: this can not be handled");
				this.specialEdge = this.edges.splice(f, 1)[0];
				f--;
			}//endif
		}//for
		if (this.specialEdge == null){
			this.esMode = "statistical";
		}//endif

		this.esQuery = this.buildESQuery();

		var esFacets;
		if (this.query.edges.length==0){
			//ZERO DIMENSIONAL QUERY
			var select=CUBE.select2Array(this.query.select)[0];
			var mvel;
			if (select.value.startsWith(this.query.from+".") && ESQuery.isKeyword(select.value)){
				//FOR SPEED, WHEN SELECT IS A SIMPLE VARIABLE
				mvel='doc["'+select.value.rightBut(this.query.from.length+1)+'"].value';
			} else if (select.value.indexOf('doc["')>=0){
				//WE ASSUME THE PROGRAMMER IS PASSING MVEL DIRECTLY, NO NEED TO CONVERT
				mvel=MVEL.addFunctions(select.value);
			}else{
				//FOR ROBUSTNESS, WHEN SELECT IS AN EXPRESSION
				mvel=MVEL.addFunctions(
					"var cool_func = function("+this.query.from+"){\n"+
					""+select.value+";\n"+
					"};\n"+
					"cool_func(_source)\n"
				);
			}//endif



			esFacets=[];
			var q = {
				"name":"0",
				"value" : {
					"statistical":{
						"script":mvel
					}
				}
			};
			esFacets.push(q);
		}else{
			esFacets = this.buildFacetQueries();
		}//endif

		for(var i = 0; i < esFacets.length; i++){
			this.esQuery.facets[esFacets[i].name] = esFacets[i].value;
		}//for
	}//endif

};


// RETURN LIST OF ALL EDGE QUERIES
ESQuery.prototype.buildFacetQueries = function(){
	var output = [];

	this.esFacets = this.getAllEdges(0);
	for(var i = 0; i < this.esFacets.length; i++){
		var condition = [];
		var name = "";
		for(var f = 0; f < this.edges.length; f++){
			if (name != "") name += ",";
			name += this.esFacets[i][f].dataIndex;
			condition.push(ESQuery.buildCondition(this.edges[f], this.esFacets[i][f]));
		}//for
		var q = {"name":name};

		if (this.esMode == "terms_stats"){
			q.value = {
				"terms_stats":{
					"key_field":this.specialEdge.value,
					"value_field":ESQuery.isKeyword(this.select.value)?this.select.value:undefined,
					"value_script":ESQuery.isKeyword(this.select.value)?undefined:this.select.value,
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
					"and":condition
				}
			};
		}//endif

		if (condition.length==0) q.value.facet_filter=undefined;

		output.push(q);
	}//for
	return output;
};//method



//RETURN ALL PARTITION COMBINATIONS:  A LIST OF ORDERED TUPLES
ESQuery.prototype.getAllEdges = function(edgeDepth){
	if (edgeDepth == this.edges.length) return [
		[]
	];
	var edge = this.edges[edgeDepth];

	var output = [];
	var partitions = edge.domain.partitions;
	for(var i = 0; i < partitions.length; i++){
		var deeper = this.getAllEdges(edgeDepth + 1);
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
ESQuery.buildCondition = function(edge, partition){
	//RETURN AN ES FILTER OBJECT
	var output = {};
	if (ESQuery.isKeyword(edge.value)){
		//USE FAST ES SYNTAX
		if (edge.domain.type == "time"){
			output.range = {};
			output.range[edge.value] = {"gte":partition.min.getMilli(), "lt":+partition.max.getMilli()};
		} else if (edge.domain.type == "duration"){
			output.range = {};
			output.range[edge.value] = {"gte":partition.min.milli, "lt":+partition.max.milli};
		} else if (edge.domain.type == "set"){
			output.term = {};
			output.term[edge.value] = partition.value;
		} else{
			D.error("Edge \"" + edge.name + "\" is not supported");
		}//endif
	} else{
		//USE MVEL CODE
		if (edge.domain.type == "time"){
			output.script = {script:edge.value + ">=" + partition.min.getMilli() + " && " + edge.value + "<" + partition.max.getMilli()};
		} else if (edge.domain.type == "duration"){
			output.script = {script:edge.value + ">=" + partition.min.milli + " && " + edge.value + "<" + partition.max.milli};
		} else if (edge.domain.type == "set"){
			output.script = {script:edge.value + "==" + MVEL.Value2Code(partition.value)};
		} else{
			D.error("Edge \"" + edge.name + "\" is not supported");
		}//endif
	}//endif
	return output;
};

ESQuery.prototype.buildESQuery = function(){
	var where;
	if (this.query.where===undefined) 		where={"script":{"script":"true"}};
	if (typeof(this.query.where)!="string")	where={"script":{"script":"true"}}; //NON STRING WHERE IS ASSUMED TO BE PSUDO-esFILTER (FOR CONVERSION TO MVEL)
	if (typeof(this.query.where)=="string")	where={"script":{"script":this.query.where}};

	var output = {
		"query":{
			"filtered":{
				"query": {
					"match_all" : {}
				},
				"filter" : {
					"and":[
						where
					]
				}
			}
		},
		"from" : 0,
		"size" : ESQuery.DEBUG ? 100 : 0,
		"sort" : [],
		"facets":{
		}
	};
	if (this.query.esfilter !== undefined) output.query.filtered.filter.and.push(this.query.esfilter);
	return output;
};//method


ESQuery.prototype.buildESTermsQuery=function(){
	var output=this.buildESQuery();
	output.facets["0"]={
		"terms":{
			"script_field":this.compileEdges2Term(),
			"size": 100000
		}
	};
	return output;
};


//GIVE MVEL CODE THAT REDUCES A UNIQUE TUPLE OF PARTITIONS DOWN TO A UNIQUE TERM
//GIVE JAVASCRIPT THAT WILL CONVERT THE TERM BACK INTO THE TUPLE
ESQuery.prototype.compileEdges2Term=function(){
	var edges=this.edges;

	var mvel=undefined;
	var fromTerm2Part=[];
	for(var i=0;i<edges.length;i++){
		if (mvel===undefined) mvel="''+"; else mvel+="+'|'+";
		var t;
		if (edges[i].domain.type=="time" || edges[i].domain.type=="duration"){
			t=ESQuery.compileTime2Term(edges[i]);
		}else{
			t=ESQuery.compileString2Term(edges[i]);
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

	return MVEL.addFunctions(mvel);
};


ESQuery.compileString2Term=function(edge){
	var value=edge.value;
	if (ESQuery.isKeyword(value)) value="doc[\""+value+"\"].value";

	return {
		"toTerm":'Value2Pipe('+value+')',
		"fromTerm":function(value){
			return edge.domain.getPartByKey(CNV.Pipe2Value(value));
		}
	};
};//method


//RETURN MVEL CODE THAT MAPS TIME AND DURATION DOMAINS DOWN TO AN INTEGER AND
//AND THE JAVASCRIPT THAT WILL TURN THAT INTEGER BACK INTO A PARTITION (INCLUDING NULLS)
ESQuery.compileTime2Term=function(edge){
	if (edge.domain.type!="time" && edge.domain.type!="duration") D.error("can only translate time and duration domains");

	//IS THERE A LIMIT ON THE DOMAIN?
	var numPartitions=edge.domain.partitions.length;
	var value=edge.value;
	if (ESQuery.isKeyword(value)) value="doc[\""+value+"\"].value";

	var ref, nullTest, partition2int, int2Partition;
	if (edge.domain.max===undefined){
		if (edge.domain.min===undefined){
			ref=Date.now().floor(edge.domain.interval);
			ref=edge.domain.type=="time"?ref.getMilli():ref.milli;
			partition2int="Math.floor(("+value+"-"+ref+")/"+edge.domain.interval.milli+")";
			nullTest="false";
		}else{
			ref=edge.domain.min;
			ref=edge.domain.type=="time"?ref.getMilli():ref.milli;
			partition2int="Math.floor(("+value+"-"+ref+")/"+edge.domain.interval.milli+")";
			nullTest=""+value+"<"+ref;
		}//endif
	}else if (edge.domain.min===undefined){
		ref=edge.domain.max;
		ref=edge.domain.type=="time"?ref.getMilli():ref.milli;
		partition2int="Math.floor(("+value+"-"+ref+")/"+edge.domain.interval.milli+")";
		nullTest=""+value+">="+ref;
	}else{
		var top=edge.domain.max; top=edge.domain.type=="time"?top.getMilli():top.milli;
		    ref=edge.domain.min;ref=edge.domain.type=="time"?ref.getMilli():ref.milli;
		partition2int="Math.floor(("+value+"-"+ref+")/"+edge.domain.interval.milli+")";
		nullTest="("+value+"<"+ref+") || ("+value+">="+top+")";
	}//endif

	partition2int="(("+nullTest+") ? "+numPartitions+" : "+partition2int+")";
	if (edge.domain.type=="time"){
		var reference=new Date(ref);
		int2Partition=function(value){
			if (Math.round(value)==numPartitions) return edge.domain.NULL;
			return edge.domain.getPartByKey(reference.add(edge.domain.interval.multiply(value)));
		};
	}else{
		var offset=Duration.newInstance(ref);
		int2Partition=function(value){
			if (Math.round(value)==numPartitions) return edge.domain.NULL;
			return edge.domain.getPartByKey(offset.add(edge.domain.interval.multiply(value)));
		};
	}//endif

	return {"toTerm":partition2int, "fromTerm":int2Partition};
};




ESQuery.prototype.termsResults=function(data){
	var terms=data.facets["0"].terms;

	//GETTING ALL PARTS WILL EXPAND THE EDGES' DOMAINS
	for(var i=0;i<terms.length;i++)
		this.term2Parts(terms[i].term);

	//NUMBER ALL EDGES FOR CUBE INDEXING
	for(var f=0;f<this.edges.length;f++){
		var parts=this.edges[f].domain.partitions;
		var p=0;
		for(;p<parts.length;p++){
			parts[p].dataIndex=p;
		}//for
		this.edges[f].domain.NULL.dataIndex=p;
	}//for



	//MAKE CUBE
	var select=CUBE.select2Array(this.query.select)[0];
	if (select){
		var cube = CUBE.cube.newInstance(this.query.edges, 0, select);

		//FILL CUBE
		II: for(var i=0;i<terms.length;i++){
			var d = cube;
			var parts=this.term2Parts(terms[i].term);
			var t = 0;
			for(; t < parts.length-1; t++){
				if (parts[t].dataIndex==d.length) continue II;  //IGNORE NULLS
				d = d[parts[t].dataIndex];
				if (d===undefined) continue II;		//WHEN NULLS ARE NOT ALLOWED d===undefined
			}//for
			if (d[parts[t].dataIndex]===undefined)
				continue;			//WHEN NULLS ARE NOT ALLOWED d===undefined
			d[parts[t].dataIndex] = terms[i].count;
		}//for

		this.query.cube=cube;
	}else{
		if (this.edges.length>1)
			D.error("Do not know how to deal with more then one edge, and no select");
		//NO SELECT MEANS USE THE EDGES
		//A DUMMY SELECT FOR FILLING DEFAULT CUBE
		select=this.query.edges[0];
		select.defaultValue=function(){return 0;};
		
		var cube = CUBE.cube.newInstance(this.query.edges, 0, select);

		//FILL CUBE
		II: for(var i=0;i<terms.length;i++){
			var d = cube;
			var parts=this.term2Parts(terms[i].term);
			var t = 0;
			for(; t < parts.length-1; t++){
				if (parts[t].dataIndex==d.length) continue II;  //IGNORE NULLS
				d = d[parts[t].dataIndex];
			}//for
			d[parts[t].dataIndex] = CNV.Pipe2Value(terms[i].term);
		}//for

		this.query.cube=cube;
	}//endif

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
	var cube;

	if (this.edges.length==0){ //ZERO DIMENSIONS
		if (this.select.length==0){
			cube = data.facets["0"][ESQuery.agg2es[this.select[i].operation]];
		}else{
			cube={};
			for(var i=this.select.length;i--;){
				cube[this.select[i].name]= data.facets["0"][ESQuery.agg2es[this.select[i].operation]];
			}//for
		}//endif
		this.query.cube = cube;
		return;
	}//endif

	//MAKE CUBE
	cube = CUBE.cube.newInstance(this.query.edges, 0, this.query.select);

	//FILL CUBE
	var keys = Object.keys(data.facets);
	for(var k = 0; k < keys.length; k++){
		var edgeName = keys[k];
		var coord = edgeName.split(",");
		var d = cube;
		for(var f = 0; f < this.query.edges.length - 1; f++){
			d = d[parseInt(coord[f])];
		}//for
		var value = data.edges[edgeName][ESQuery.agg2es[this.select.operation]];
		d[parseInt(coord[f])] = value;
	}//for

	this.query.cube = cube;

};//method



//PROCESS THE RESULTS FROM THE ES TERMS_STATS FACETS
ESQuery.prototype.terms_statsResults = function(data){
//FIND ALL TERMS FOUND BY THE SPECIAL EDGE
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
	partitions.sort(this.specialEdge.domain.compare);
	for(var p = 0; p < partitions.length; p++) partitions[p].dataIndex = p;

	this.specialEdge.domain.map = map;
	this.specialEdge.domain.partitions = partitions;


	//MAKE CUBE
	var cube = CUBE.cube.newInstance(this.query.edges, 0, this.query.select);

	//FILL CUBE
	for(var k = 0; k < keys.length; k++){
		var edgeName = keys[k];
		var coord = edgeName.split(",");
		var terms = data.facets[edgeName].terms;
		for(var t = 0; t < terms.length; t++){
			var d = cube;
			var f = 0;
			var c = 0;
			for(; f < this.query.edges.length - 1; f++){
				if (this.query.edges[f] == this.specialEdge){
					d = d[this.specialEdge.domain.map[terms[t].term].dataIndex];
				} else{
					d = d[parseInt(coord[c])];
					c++;
				}//endif
			}//for
			var value = terms[t][ESQuery.agg2es[this.select.operation]];
			if (this.query.edges[f] == this.specialEdge){
				d[this.specialEdge.domain.map[terms[t].term].dataIndex] = value;
			} else{
				d[parseInt(coord[c])] = value;
			}//endif
		}//for
	}//for

	this.query.cube = cube;

};//method



ESQuery.prototype.compileSetOp=function(){
	this.esQuery=this.buildESQuery();

	this.esQuery.facets.mvel={
		"terms":{
			"script_field": new MVEL().code(this.query),
			"size": 100000
		}
	};
};


ESQuery.prototype.mvelResults=function(data){
 	this.query.list =  MVEL.esFacet2List(data.facets.mvel, this.select);
};//method
