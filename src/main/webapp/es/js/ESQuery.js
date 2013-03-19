/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("CNV.js");
importScript("aDate.js");
importScript("aUtil.js");
importScript("aDebug.js");
importScript("MVEL.js");
importScript("CUBE.js");

importScript("rest/ElasticSearch.js");
importScript("rest/Rest.js");







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
	"bugs.changes":{},
	"bugs.attachments":{},
	"bugs.attachments.flags":{},
	"reviews":{"path":"/reviews/review"},
	"bug_summary":{"path":"/bug_summary/bug_summary"},
	"bug_tags":{"path":"/bug_tags/bug_tags"},
	"org_chart":{"path":"/org_chart/person"},
	"temp":{"path":""},
	"telemetry":{"path":"/telemetry/data"}
};


ESQuery.getColumns=function(indexName){
	var index=ESQuery.INDEXES[indexName];
	if (index.columns===undefined) return [];//DEFAULT BEHAVIOUR IS TO WORK WITH NO KNOWN COLUMNS
	return index.columns;
};//method


//RETURN THE COLUMN DEFINITIONS IN THE GIVEN esProperties OBJECT
ESQuery.parseColumns=function(indexName, esProperties){
	var columns = [];
	forAllKey(esProperties, function(name, property){
		if (property.type == "nested"){
			//NESTED TYPE IS A NEW TYPE DEFINITION
			let nestedName=indexName+"."+name;
			if (ESQuery.INDEXES[nestedName]===undefined) ESQuery.INDEXES[nestedName]={};
			ESQuery.INDEXES[nestedName].columns=ESQuery.parseColumns(nestedName, property.properties);
			return;
		}//endif

		if (property.properties !== undefined) {
			//DEFINE PROPERTIES WITH "." IN NAME
			forAllKey(property.properties, function(n, p, i){
				if (["string", "boolean", "integer", "date", "long"].contains(p.type)){
					columns.push({"name":name+"."+n, "type":p.type});
				}else if (p.type===undefined){
					//DO NOTHING
				}else{
					D.error("unknown subtype "+p.type);
				}//endif
			});

			return;
		}//endif

		if (property.dynamic !== undefined) return;
		if (property.type === undefined) return;
		if (property.type == "multi_field") property.type = property.fields[name].type;	//PULL DEFAULT TYPE

		if (["string", "boolean", "integer", "date", "long"].contains(property.type)){
			columns.push({"name":name, "type":property.type});
			if (property.index_name && name!=property.index_name) columns.push({"name":property.index_name, "type":property.type});
		}else{
			D.error("unknown type "+property.type);
		}//endif
	});
	return columns;
};//method


//ENSURE COLUMNS FOR GIVEN INDEX ARE LOADED, AND MVEL COMPILAITON WORKS BETTER
ESQuery.loadColumns=function(query){
	var indexName = query.from.split(".")[0];
	var index = ESQuery.INDEXES[indexName];
	var indexPath=index.path;
	if (indexName=="bugs" && !indexPath.endsWith("/bug_version")) indexPath+="/bug_version";

	if (index.columns === undefined){
		var URL=Util.coalesce(query.url, ElasticSearch.baseURL + indexPath) + "/_mapping";

		var schema = yield(Rest.get({
			"url":URL
		}));

		var properties = schema[indexPath.split("/")[2]].properties;

		index.columns = ESQuery.parseColumns(indexName, properties);
	}//endif
};//method



ESQuery.run=function(query){
	yield (ESQuery.loadColumns(query));
	var esq=new ESQuery(query);
	var output=yield (esq.run());
	if (output===undefined)
		D.error("what happened here?");
	yield output;
};


ESQuery.prototype.run = function(){
	if (!this.query.url) this.query.url = window.ElasticSearch.baseURL + ESQuery.INDEXES[this.query.from.split(".")[0]].path;


	if (!this.query.url.endsWith("/_search")) this.query.url+="/_search";  //WHEN QUERIES GET RECYCLED, THIER url IS SOMETIMES STILL AROUND
	//var URL=window.ElasticSearch.baseURL+ESQuery.INDEXES[this.query.from.split(".")[0]].path+"/_search";
	var postResult;
	if (ESQuery.DEBUG) D.println(CNV.Object2JSON(this.esQuery));
	try{
		postResult=yield (Rest.post({
			url: this.query.url,
			data: CNV.Object2JSON(this.esQuery),
			dataType: "json",
			headers:{
				"Accept-Encoding": "gzip,deflate"//Accept-Encoding: gzip,deflate
//				"http.compress":"true"
			}
		}));

		var self=this;
		forAllKey(postResult.facets, function(facetName, f){
			if (f._type=="statistical") return;
			if (!f.terms) return;
			
			if (!ESQuery.DEBUG && f.terms.length==self.query.essize){
				D.error("Not all data delivered ("+f.terms.length+"/"+f.total+") try smaller range");
			}//endif
		});

		

		if (postResult._shards.failed>0){
			D.action(postResult._shards.failed+"of"+postResult._shards.total+" shards failed.");
			this.nextDelay=Util.coalesce(this.nextDelay, 500)*2;
			yield (aThread.sleep(this.nextDelay));
			D.action("Retrying Query...");
			yield this.run();
		}//endif
	}catch(e){
		D.error("Error with ESQuery", e);
	}//try

//	var a=D.action("Process ES Terms", true);
	if (this.esMode == "terms"){
		this.termsResults(postResult);
	} else if (this.esMode == "setop"){
		this.mvelResults(postResult);
	} else if (this.esMode == "terms_stats"){
		this.terms_statsResults(postResult);
	} else{//statistical
		this.statisticalResults(postResult);
	}//endif
//	D.actionDone(a);


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

	this.columns = CUBE.compile(this.query, ESQuery.INDEXES[this.query.from.split(".")[0]].columns, true);


	this.termsEdges = this.query.edges.copy();
	this.select = CUBE.select2Array(this.query.select);


	if (this.termsEdges.length==0){
		//NO EDGES IMPLIES SIMPLER QUERIES: EITHER A SET OPERATION, OR RETURN SINGLE AGGREGATE
		if (this.select[0].operation==="none"){  //"none" IS GIVEN TO undefined OPERATIONS DURING COMPILE
			this.esMode="setop";
			this.compileSetOp();
			return;
		}else{
			var value=this.select[0].value;
			for(var k=this.select.length;k--;){
				if (this.select[k].value!=value) D.error("ES Query with multiple select columns must all have the same value");
			}//for

			if (this.query.select===undefined || (this.select.length==1 && this.select[0].operation=="count")){
				this.esMode="terms";
				this.esQuery = this.buildESCountQuery(value);
				return;
			}else{
				this.esMode="statistical";
				this.esQuery=this.buildESStatisticalQuery(value);
				return;
			}//endif
		}//endif
	}//endif


	//PICK FIRST AND ONLY SELECT
	if (this.select.length>1){
		D.error("Can not have an array of select columns, only one allowed");
	}else if (this.select.length==0){
		this.select=undefined;
	}//endif

	if (this.query.where)
		D.error("ESQuery does not support the where clause, use esfilter instead");

	//EXPECTING MORE THAN ONE EDGE
	this.termsEdges = this.query.edges.copy();


	//VERY IMPORTANT!! ES CAN ONLY USE TERM PACKING ON terms FACETS, THE OTHERS WILL REQUIRE EVERY PARTITION BEING A FACET
	this.esMode = "terms_stats";
	if (this.query.select===undefined || (this.select.length==1 && this.select[0].operation=="count")){
		this.esMode="terms";
	}//endif
	if (ESQuery.agg2es[this.select[0].operation]===undefined){
		D.error("ES can not aggregate "+this.select[0].name+" because '"+this.select[0].operation+"' is not a recognized operation");
	}//endif

	this.facetEdges=[];	//EDGES THAT WILL REQUIRE A FACET FOR EACH PART

	//A SPECIAL EDGE IS ONE THAT HAS AN UNDEFINED NUMBER OF PARTITIONS AT QUERY TIME
	//FIND THE specialEdge, IF ONE
	this.specialEdge = null;
	for(var f = 0; f < this.termsEdges.length; f++){
		if ((["set", "duration", "time", "linear"].contains(this.termsEdges[f].domain.type))){
			for(var p = this.termsEdges[f].domain.partitions.length; p--;){
				this.termsEdges[f].domain.partitions[p].dataIndex = p;
			}//for

			//FACETS ARE ONLY REQUIRED IF SQL JOIN ON DOMAIN IS REQUIRED (RANGE QUERY)
			//OR IF WE ARE NOT SIMPLY COUNTING
			//OR IF WE JUST WANT TO FORCE IT :)
			if (this.termsEdges[f].range || this.esMode!="terms" || this.termsEdges[f].domain.isFacet){
				this.facetEdges.push(this.termsEdges[f]);
				this.termsEdges.splice(f, 1);
				f--;
			}//endif
		} else if (this.esMode=="terms"){
			//NO SPECIAL EDGES FOR terms FACETS (ALL ARE SPECIAL!!)
		} else{
			if (this.specialEdge != null) D.error("There is more than one open-ended edge: this can not be handled");
			this.specialEdge = this.termsEdges[f];
			this.termsEdges.splice(f, 1);
			f--;
		}//endif
	}//for

	if (this.specialEdge == null && this.esMode=="terms_stats"){
		this.esMode = "statistical";
	}//endif

	this.esQuery = this.buildESQuery();

	var esFacets;
	esFacets = this.buildFacetQueries();

	for(var i = 0; i < esFacets.length; i++){
		this.esQuery.facets[esFacets[i].name] = esFacets[i].value;
	}//for

};


// RETURN LIST OF ALL EDGE QUERIES
ESQuery.prototype.buildFacetQueries = function(){
	var output = [];

	this.esFacets = this.getAllEdges(0);
	for(var i = 0; i < this.esFacets.length; i++){
		var condition = [];
		var name = "";
		if (this.facetEdges.length==0){
			name="default";
		}else{
			for(var f = 0; f < this.facetEdges.length; f++){
				if (name != "") name += ",";
				name += this.esFacets[i][f].dataIndex;
				condition.push(ESQuery.buildCondition(this.facetEdges[f], this.esFacets[i][f], this.query));
			}//for
		}//for
		var q = {"name":name};

		var value=this.compileEdges2Term();

		if (this.esMode=="terms"){
			if (value.type=="field"){
				q.value={
					"terms":{
						"field":value.value,
						"size": this.query.essize
					}
				};
			}else{
				q.value={
					"terms":{
						"script_field":value.value,
						"size": this.query.essize
					}
				};
			}//endif
		}else if (this.esMode == "terms_stats"){
			if (value.type=="field"){
				q.value = {
					"terms_stats":{
						"key_field":value.field,
						"value_field":value.value,
						"size":this.query.essize
					}
				};
			}else{
				q.value = {
					"terms_stats":{
						"key_field":value.field,
						"value_script":value.value,
						"size":this.query.essize
					}
				};

			}
		} else{//statistical
			q.value = {
				"statistical":{
					"script":value.value
				}
			};
		}//endif

		if (condition.length>0) q.value.facet_filter={"and":condition};

		output.push(q);
	}//for
	return output;
};//method



//RETURN ALL PARTITION COMBINATIONS:  A LIST OF ORDERED TUPLES
ESQuery.prototype.getAllEdges = function(edgeDepth){
	if (edgeDepth == this.facetEdges.length) return [
		[]
	];
	var edge = this.facetEdges[edgeDepth];

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





//RETURN AN ES FILTER OBJECT
ESQuery.buildCondition = function(edge, partition, query){
	//RETURN AN ES FILTER OBJECT
	var output = {};

	if (edge.domain.isFacet){
		//MUST USE THIS' esFacet, AND NOT(ALL THOSE ABOVE)
		var condition={"and":[
			partition.esfilter
		]};

		//ES WILL FREAK OUT IF WE SEND {"not":{"and":x}} (OR SOMETHING LIKE THAT)
//		var parts=edge.domain.partitions;
//		for(var i=0;i<parts.length;i++){
//			var p=parts[i];
//			if (p==partition) break;
//			condition.and.push({"not":p.esfilter});
//		}//for

		return ESFilter.simplify(condition);
	} else if (edge.range){
		//THESE REALLY NEED FACETS TO PERFORM THE JOIN-TO-DOMAIN
		//USE MVEL CODE
		if (["time", "duration", "linear"].contains(edge.domain.type)){
			output={"and":[]};

			if (MVEL.isKeyword(edge.range.min)){
				output.and.push({"range":Map.newInstance(edge.range.min,{"lt":MVEL.Value2Code(partition.min)})});
			}else{
				//WHOA!! SUPER SLOW!!
				output.and.push({"script":{"script":MVEL.compile.expression(
					edge.range.min + "<" + MVEL.Value2Code(partition.max)
				, query)}})
			}//endif

			if (MVEL.isKeyword(edge.range.max)){
				output.and.push({"range":Map.newInstance(edge.range.max,{"gte":MVEL.Value2Code(partition.min)})});
			}else{
				//WHOA!! SUPER SLOW!!
				output.and.push({"script":{"script":MVEL.compile.expression(
					MVEL.Value2Code(partition.min) +" <= "+ edge.range.max
				, query)}})
			}//endif

			return output;
		} else {
			D.error("Do not know how to handle range query on non-continuous domain");
		}//endif
	}else if (MVEL.isKeyword(edge.value)){
		//USE FAST ES SYNTAX
		if (["time", "duration", "linear"].contains(edge.domain.type)){
			output.range = {};
			output.range[edge.value] = {"gte":MVEL.Value2Code(partition.min), "lt":MVEL.Value2Code(partition.max)};
		} else if (edge.domain.type == "set"){
			if (partition.value!==undefined){
				if (partition.value!=edge.domain.getKey(partition)) D.error("please ensure the key attribute of the domain matches the value attribute of all partitions, if only because we are now using the former");
				//DEFAULT TO USING THE .value ATTRIBUTE, IF ONLY BECAUSE OF LEGACY REASONS
				output.term = Map.newInstance(edge.value, partition.value);
			}else{
				output.term = Map.newInstance(edge.value, edge.domain.getKey(partition));
			}//endif
		} else if (edge.domain.type=="default"){
			output.term = {};
			output.term[edge.value] = partition.value;
		} else{
			D.error("Edge \"" + edge.name + "\" is not supported");
		}//endif
		return output;
	} else{
		//USE MVEL CODE
		if (["time", "duration", "linear"].contains(edge.domain.type)){
			output.script = {script:edge.value + ">=" + MVEL.Value2Code(partition.min) + " && " + edge.value + "<" + MVEL.Value2Code(partition.max)};
		} else {//if (edge.domain.type == "set"){
			output.script = {script:"( "+edge.value + " ) ==" + MVEL.Value2Code(partition.value)};
		}//endif
		output.script.script=MVEL.compile.addFunctions(output.script.script);
		return output;
	}//endif

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



//RETURN SINGLE COUNT
ESQuery.prototype.buildESCountQuery=function(value){
	var output=this.buildESQuery();

	if (MVEL.isKeyword(value)){
		output.facets["0"]={
			"terms":{
				"field":value,
				"size": 200000
			}
		};
	}else{
		//COMPLICATED value IS PROBABLY A SCRIPT, USE IT
		output.facets["0"]={
			"terms":{
				"script_field":MVEL.compile.expression(value, this.query),
				"size": 200000
			}
		};
	}//endif

	return output;
};


//RETURN A SINGLE SET OF STATISTICAL VALUES, NO GROUPING
ESQuery.prototype.buildESStatisticalQuery=function(value){
	var output = this.buildESQuery();

	if (MVEL.isKeyword(value)){
		output.facets["0"] = {
			"statistical":{
				"field":value
			}
		};
	}else{
		output.facets["0"] = {
			"statistical":{
				"script":MVEL.compile.expression(value, this.query)
			}
		};
	}//endif

	return output;
};//method


//GIVE MVEL CODE THAT REDUCES A UNIQUE TUPLE OF PARTITIONS DOWN TO A UNIQUE TERM
//GIVE JAVASCRIPT THAT WILL CONVERT THE TERM BACK INTO THE TUPLE
//RETURNS TUPLE OBJECT WITH "type" and "value" ATTRIBUTES.  "type" CAN HAVE A VALUE OF "script" OR "field"
ESQuery.prototype.compileEdges2Term=function(){
	var edges=this.termsEdges;

	if (edges.length==0){
		if (this.specialEdge){
			var specialEdge=this.specialEdge;
			this.term2Parts=function(term){
				return [specialEdge.domain.getPartByKey(term)];
			};

			//ONLY USED BY terms_stats, AND VALUE IS IN THE SELECT CLAUSE
			if (!MVEL.isKeyword(specialEdge.value)) D.error("Can not handle complex edge value with "+this.select[0].operation);
			if (MVEL.isKeyword(this.select[0].value)){
				return {"type":"field", "field":specialEdge.value, "value":this.select[0].value};
			}else{
				return {"type":"script", "field":specialEdge.value, "value":MVEL.compile.expression(this.select[0].value, this.query)};
			}//endif
		}else if (this.esMode=="statistical"){
			//REGISTER THE DECODE FUNCTION
			this.term2Parts=function(term){
				return [];
			};
			if (MVEL.isKeyword(this.select[0].value)){
				return {"type":"field", "value":this.select[0].value};
			}else{
				return {"type":"script", "value":MVEL.compile.expression(this.select[0].value, this.query)};
			}//endif
		}else{
			//REGISTER THE DECODE FUNCTION
			this.term2Parts=function(term){
				return [];
			};
			return {"type":"script", "value":"1"};
		}//endif
	}//endif

	//IF THE QUERY IS SIMPLE ENOUGH, THEN DO NOT USE TERM PACKING
	if (edges.length==1 && ["set", "default"].contains(edges[0].domain.type)){
		//THE TERM RETURNED WILL BE A MEMBER OF THE GIVEN SET
		this.term2Parts=function(term){
			return [edges[0].domain.getPartByKey(term)];
		};

		if (edges[0].esscript){
			return {"type":"script", "value":MVEL.compile.addFunctions(edges[0].esscript)};
		}else if (MVEL.isKeyword(edges[0].value)){
			return {"type":"field", "value":edges[0].value};
		}else{
			return {"type":"script", "value":MVEL.compile.expression(edges[0].value, this.query)};
		}//endif
	}//endif

	var mvel=undefined;
	var fromTerm2Part=[];
	for(var i=0;i<edges.length;i++){
		if (mvel===undefined) mvel="''+"; else mvel+="+'|'+";
		var t;
		if (edges[i].domain.type=="time"){
			t=ESQuery.compileTime2Term(edges[i]);
		}else if (edges[i].domain.type=="duration"){
			t=ESQuery.compileDuration2Term(edges[i]);
		}else if (edges[i].domain.type=="linear"){
			t=ESQuery.compileLinear2Term(edges[i]);
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

	return {"type":"script", "value":MVEL.compile.expression(mvel, this.query)};
};


//RETURN MVEL CODE THAT MAPS TIME AND DURATION DOMAINS DOWN TO AN INTEGER AND
//AND THE JAVASCRIPT THAT WILL TURN THAT INTEGER BACK INTO A PARTITION (INCLUDING NULLS)
ESQuery.compileTime2Term=function(edge){
	if (edge.esscript) D.error("edge script not supported yet");

	//IS THERE A LIMIT ON THE DOMAIN?
	var numPartitions=edge.domain.partitions.length;
	var value=edge.value;
	if (MVEL.isKeyword(value)) value="doc[\""+value+"\"].value";


	var nullTest=ESQuery.compileNullTest(edge);
	var ref=Util.coalesce(edge.domain.min, edge.domain.max, new Date(2000,0,1));

	var partition2int;
	if (edge.domain.interval.month>0){
		var offset=ref.subtract(ref.floorMonth(), Duration.DAY).milli;
		if (offset>Duration.DAY.milli*28) offset=ref.subtract(ref.ceilingMonth(), Duration.DAY).milli;
		partition2int="milli2Month("+value+", "+MVEL.Value2Code(offset)+")";
		partition2int="(("+nullTest+") ? 0 : "+partition2int+")";

		int2Partition=function(value){
			if (aMath.round(value)==0) return edge.domain.NULL;

			var d=new Date((""+value).left(4), (""+value).right(2), 1);
			d=d.addMilli(offset);
			return edge.domain.getPartByKey(d);
		};
	}else{
		partition2int="Math.floor(("+value+"-"+MVEL.Value2Code(ref)+")/"+edge.domain.interval.milli+")";
		partition2int="(("+nullTest+") ? "+numPartitions+" : "+partition2int+")";

		int2Partition=function(value){
			if (aMath.round(value)==numPartitions) return edge.domain.NULL;
			return edge.domain.getPartByKey(ref.add(edge.domain.interval.multiply(value)));
		};

	}//endif

	return {"toTerm":partition2int, "fromTerm":int2Partition};
};

//RETURN MVEL CODE THAT MAPS DURATION DOMAINS DOWN TO AN INTEGER AND
//AND THE JAVASCRIPT THAT WILL TURN THAT INTEGER BACK INTO A PARTITION (INCLUDING NULLS)
ESQuery.compileDuration2Term=function(edge){
	if (edge.esscript) D.error("edge script not supported yet");

	//IS THERE A LIMIT ON THE DOMAIN?
	var numPartitions=edge.domain.partitions.length;
	var value=edge.value;
	if (MVEL.isKeyword(value)) value="doc[\""+value+"\"].value";

	var ref=Util.coalesce(edge.domain.min, edge.domain.max, Duration.ZERO);
	var nullTest=ESQuery.compileNullTest(edge);


	var ms=edge.domain.interval.milli;
	if (edge.domain.interval.month>0)
		ms=Duration.YEAR.milli/12*edge.domain.interval.month;

	var partition2int="Math.floor(("+value+"-"+MVEL.Value2Code(ref)+")/"+ms+")";
		partition2int="(("+nullTest+") ? "+numPartitions+" : "+partition2int+")";

	int2Partition=function(value){
		if (aMath.round(value)==numPartitions) return edge.domain.NULL;
		return edge.domain.getPartByKey(ref.add(edge.domain.interval.multiply(value)));
	};

	return {"toTerm":partition2int, "fromTerm":int2Partition};
};

//RETURN MVEL CODE THAT MAPS THE LINEAR DOMAIN DOWN TO AN INTEGER AND
//AND THE JAVASCRIPT THAT WILL TURN THAT INTEGER BACK INTO A PARTITION (INCLUDING NULLS)
ESQuery.compileLinear2Term=function(edge){
	if (edgeesscript) D.error("edge script not supported yet");

	if (edge.domain.type!="linear") D.error("can only translate linear domains");

	var numPartitions=edge.domain.partitions.length;
	var value=edge.value;
	if (MVEL.isKeyword(value)) value="doc[\""+value+"\"].value";

	var ref, nullTest, partition2int, int2Partition;
	if (edge.domain.max===undefined){
		if (edge.domain.min===undefined){
			ref=0;
			partition2int="Math.floor("+value+")/"+MVEL.Value2Code(edge.domain.interval)+")";
			nullTest="false";
		}else{
			ref=MVEL.Value2Code(edge.domain.min);
			partition2int="Math.floor(("+value+"-"+ref+")/"+MVEL.Value2Code(edge.domain.interval)+")";
			nullTest=""+value+"<"+ref;
		}//endif
	}else if (edge.domain.min===undefined){
		ref=MVEL.Value2Code(edge.domain.max);
		partition2int="Math.floor(("+value+"-"+ref+")/"+MVEL.Value2Code(edge.domain.interval)+")";
		nullTest=""+value+">="+ref;
	}else{
		var top=MVEL.Value2Code(edge.domain.max);
		    ref=MVEL.Value2Code(edge.domain.min);
		partition2int="Math.floor(("+value+"-"+ref+")/"+MVEL.Value2Code(edge.domain.interval)+")";
		nullTest="("+value+"<"+ref+") || ("+value+">="+top+")";
	}//endif

	partition2int="(("+nullTest+") ? "+numPartitions+" : "+partition2int+")";
	var offset=CNV.String2Integer(ref);
	int2Partition=function(value){
		if (aMath.round(value)==numPartitions) return edge.domain.NULL;
		return edge.domain.getPartByKey((value * edge.domain.interval) + offset);
	};

	return {"toTerm":partition2int, "fromTerm":int2Partition};
};



ESQuery.compileString2Term=function(edge){
	if (edge.esscript) D.error("edge script not supported yet");

	var value=edge.value;
	if (MVEL.isKeyword(value)) value="getDocValue(\""+value+"\")";

	return {
		"toTerm":'Value2Pipe('+value+')',
		"fromTerm":function(value){
			return edge.domain.getPartByKey(CNV.Pipe2Value(value));
		}
	};
};//method


//EXPECT A ElasticSearch DEFINED EDGE, AND RETURN EXPRESSION TO RETURN EDGE NAMES
ESQuery.compileES2Term=function(edge){
//		"var keywords = concat(_source.keywords);\n"+
//		"var white = _source.status_whiteboard;\n"+
//		"     if (keywords.indexOf(\"sec-critical\")>=0 ) \"critical\"; "+
//		"else if (   white.indexOf(\"[sg:critical]\")   >=0 ) \"critical\"; "+
//		"else if (keywords.indexOf(\"sec-high\")    >=0 ) \"high\"; "+
//		"else if (   white.indexOf(\"[sg:high]\")   >=0 ) \"high\"; "+
//		"else if (keywords.indexOf(\"sec-moderate\")>=0 ) \"moderate\"; "+
//		"else if (   white.indexOf(\"[sg:moderate]\")    >=0 ) \"moderate\"; "+
//		"else if (keywords.indexOf(\"sec-low\")     >=0 ) \"low\"; "+
//		"else if (   white.indexOf(\"[sg:low]\")    >=0 ) \"low\"; "+
//		"else \"other\";",
//		//"else \"other\"; ",  CAN NOT DO THIS (SPACE AT AND OF else RESULTS IN null VALUES RETURNED
//		"allowNulls":false,
//		"domain":{"type":"set", "partitions":["critical", "high", "moderate", "low"]}},



};//method




//RETURN A MVEL EXPRESSIONT THAT WILL EVALUATE TO true FOR OUT-OF-BOUNDS
ESQuery.compileNullTest=function(edge){
	if (!["duration", "time", "linear"].contains(edge.domain.type))
		D.error("can only translate time and duration domains");

	//IS THERE A LIMIT ON THE DOMAIN?
	var value=edge.value;
	if (MVEL.isKeyword(value)) value="doc[\""+value+"\"].value";

	var top, bot, nullTest;
	if (edge.domain.max===undefined){
		if (edge.domain.min===undefined) return false;
		bot=MVEL.Value2Code(edge.domain.min);
		nullTest=""+value+"<"+bot;
	}else if (edge.domain.min===undefined){
		top=MVEL.Value2Code(edge.domain.max);
		nullTest=                         ""+value+">="+top;
	}else{
		top=MVEL.Value2Code(edge.domain.max);
		bot=MVEL.Value2Code(edge.domain.min);
		nullTest="("+value+"<"+bot+") || ("+value+">="+top+")";
	}//endif

	return nullTest;
};


ESQuery.prototype.termsResults=function(data){
	//THE FACET EDGES MUST BE RE-INTERLACED WITH THE PACKED EDGES

	//GETTING ALL PARTS WILL EXPAND THE EDGES' DOMAINS
	//REALLY WE SHOULD ONLY BE INSPECTING THE specialEdge, WHICH IS THE ONLY UNKNOWN DOMAIN
	//BUT HOW TO UNPACK IT FROM THE term FASTER IS UNKNOWN
	var facetNames = Object.keys(data.facets);
	for(var k = 0; k < facetNames.length; k++){
		var terms=data.facets[facetNames[k]].terms;
		for(var i=0;i<terms.length;i++){
			this.term2Parts(terms[i].term);
		}//for
	}//for

	//NUMBER ALL EDGES FOR CUBE INDEXING
	for(var f=0;f<this.query.edges.length;f++){
		this.query.edges[f].index=f;
		var parts=this.query.edges[f].domain.partitions;
		var p=0;
		for(;p<parts.length;p++){
			parts[p].dataIndex=p;
		}//for
		this.query.edges[f].domain.NULL.dataIndex=p;
	}//for



	//MAKE CUBE
	var select=this.query.select;
	if (select===undefined) select=[];
	var cube= CUBE.cube.newInstance(this.query.edges, 0, select);

	
	//FILL CUBE
	//PROBLEM HERE IS THE INTERLACED EDGES
	for(var k = 0; k < facetNames.length; k++){
		var coord = facetNames[k].split(",");
		//MAKE THE INSERT LIST
		var interlaceList=[];
		this.facetEdges.forall(function(f,i){
			interlaceList.push({"index":f.index, "value": f.domain.partitions[coord[i]]});
		});

		var terms=data.facets[facetNames[k]].terms;
		II: for(var i=0;i<terms.length;i++){
			var d = cube;
			var parts=this.term2Parts(terms[i].term);
			for(var j=0;j<interlaceList.length;j++){
				parts.insert(interlaceList[j].index, interlaceList[j].value);
			}//for
			//INTERLACE DONE: NOW parts SHOULD CORRESPOND WITH this.query.edges

			var t = 0;
			var length=(select instanceof Array)?parts.length:parts.length-1;
			for(; t < length; t++){
				if (parts[t].dataIndex==d.length) continue II;  //IGNORE NULLS
				d = d[parts[t].dataIndex];
				if (d===undefined) continue II;		//WHEN NULLS ARE NOT ALLOWED d===undefined
			}//for

			if (select instanceof Array){
				for(var s=0;s<select.length;s++){
					d[select[s].name] = terms[i][ESQuery.agg2es[select[s].operation]];
				}//for
			}else{
				if (d[parts[t].dataIndex]===undefined)
					continue;			//WHEN NULLS ARE NOT ALLOWED d===undefined
				d[parts[t].dataIndex] = terms[i].count;
			}//endif

		}//for
	}//for

	this.query.cube=cube;
};

//MAP THE SELECT OPERATION NAME TO ES FACET AGGREGATE NAME
ESQuery.agg2es = {
	"sum":"total",
	"add":"total",
	"count":"count",
	"maximum":"max",
	"minimum":"min",
	"max":"max",
	"min":"min",
	"average":"mean"
};

//PROCESS RESULTS FROM THE ES STATISTICAL FACETS
ESQuery.prototype.statisticalResults = function(data){
	var cube;

	if (this.query.edges.length==0){ //ZERO DIMENSIONS
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
		var value = data.facets[edgeName][ESQuery.agg2es[this.select[0].operation]];
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
//	partitions[p]=this.specialEdge.domain.NULL;
//	partitions[p].dataIndex = p;

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
			var value = terms[t][ESQuery.agg2es[this.select[0].operation]];
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
	var select=CUBE.select2Array(this.query.select);


	if (select.length==1 && MVEL.isKeyword(select[0].value)){
		this.esQuery.facets.mvel={
			"terms":{
				"field": select[0].value,
				"size": this.query.essize
			}
		};
	}else{
		this.esQuery.facets.mvel={
			"terms":{
				"script_field": new MVEL().code(this.query),
				"size": this.query.essize
			}
		};
	}//endif
};


ESQuery.prototype.mvelResults=function(data){
	var select=CUBE.select2Array(this.query.select);
	if (select.length==1 && MVEL.isKeyword(select[0].value)){
		//SPECIAL CASE FOR SINGLE TERM
		var T = data.facets.mvel.terms;
		var n=select[0].name;

		var output = [];
		for(var i = T.length; i--;) output.push(Map.newInstance(n, T[i].term));
		this.query.list= output;
	}else{
	 	this.query.list =  MVEL.esFacet2List(data.facets.mvel, this.select);
	}//endif

	
	select=this.query.select;
	if (select instanceof Array) return;
	//SELECT AS NO ARRAY (AND NO EDGES) MEANS A SIMPLE ARRAY OF VALUES, NOT AN ARRAY OF OBJECTS
	this.query.list=this.query.list.map(function(v, i){return v[select.name];});
};//method






var ESFilter={};

ESFilter.simplify=function(esfilter){
	return esfilter;

	//THIS DOES NOT WORK BECAUSE "[and] filter does not support [product]"
	//THIS DOES NOT WORK BECAUSE "[and] filter does not support [component]"
	//return ESFilter.removeOr(esfilter);

//THIS TAKES TOO LONG TO TRANSLATE ALL THE LOGIC FOR THOUSANDS OF FACETS
//	var normal=ESFilter.normalize(esfilter);
//	if (normal.or && normal.or.length==1) normal=normal.or[0];
//	var clean=CNV.JSON2Object(CNV.Object2JSON(normal).replaceAll('"isNormal":true,', '').replaceAll(',"isNormal":true', '').replaceAll('"isNormal":true', ''));
//
//	//REMOVE REDUNDANT FACTORS
//	//REMOVE false TERMS
//	return clean;
};

ESFilter.removeOr=function(esfilter){
	if (esfilter.not) return {"not":ESFilter.removeOr(esfilter.not)};

	if (esfilter.and){
		return {"and":esfilter.and.map(function(v, i){
			return ESFilter.removeOr(v);
		})};
	}//endif

	if (esfilter.or){  //CONVERT OR TO NOT.AND.NOT
		return {"not":{"and":esfilter.or.map(function(v, i){
			return {"not":ESFilter.removeOr(v)};
		})}};
	}//endif

	return esfilter;
};//method


//ENSURE NO ES-FORBIDDEN COMBINATIONS APPEAR (WHY?!?!?!?!?!  >:| )
//NORMALIZE BOOLEAN EXPRESSION TO OR.AND.NOT FORM
ESFilter.normalize=function(esfilter){
	if (esfilter.isNormal) return esfilter;

D.println("from: "+CNV.Object2JSON(esfilter));
	var output=esfilter;

	while(output!=null){
		esfilter=output;
		output=null;

		if (esfilter.terms){									//TERMS -> OR.TERM
			var fieldname=Object.keys(esfilter.terms)[0];
			output={};
			output.or=esfilter.terms[fieldname].map(function(t, i){
				return {"and":[{"term":Map.newInstance(fieldname, t)}], "isNormal":true};
			});
		}else if (esfilter.not && esfilter.not.or){				//NOT.OR -> AND.NOT
			output={};
			output.and=esfilter.not.or.map(function(e, i){
				return ESFilter.normalize({"not":e});
			});
		}else if (esfilter.not && esfilter.not.and){			//NOT.AND
			output={};
			output.or=esfilter.not.and.map(function(e, i){
				return ESFilter.normalize({"not":e});
			});
		}else if (esfilter.not && esfilter.not.not){			//NOT.NOT
			output=ESFilter.normalize(esfilter.not.not);
		}else if (esfilter.not){
			if (esfilter.not.isNormal){
				esfilter.isNormal=true;
			}else{
				output={"not":ESFilter.normalize(esfilter.not)};
			}//endif
		}else if (esfilter.and){
			output={"and":[]};

			esfilter.and.forall(function(a, i){
				a=ESFilter.normalize(a);
				if (a.or && a.or.length==1) a=a.or[0];

				if (a.and){										//AND.AND
					output.and.appendArray(a.and);
				}else if (a.script && a.script.script=="true"){
					//DO NOTHING
				}else{
					output.and.push(a);
				}//endif
			});

			var mult=function(and, d){							//AND.OR
				if (and[d].or === undefined){
					if (d==and.length-1)
						return {"or":[{"and":[and[d]], "isNormal":true}]};
					var out=mult(and, d+1);
					for(var o=0;o<out.or.length;o++){
						out.or[o].and.prepend(and[d]);
					}//for
					return out;
				}//endif

				if (d==and.length-1){
					var or=and[d].or;
					for(var i=0;i<or.length;i++){
						if (!or[i].and) or[i]={"and":[or[i]], "isNormal":true};
					}//for
					return {"or":or};
				}//endif

				var child=mult(and, d+1);
				var or=[];
				for(var i=0;i<and[d].or.length;i++){
					for(var c=0;c<child.or.length;c++){
						var temp={"and":[], "isNormal":true};
						if (and[d].or[i].and){
							temp.and.appendArray(and[d].or[i].and);
						}else{
							temp.and.push(and[d].or[i]);
						}//endif
						temp.and.appendArray(child.or[c].and);
						or.push(temp);
					}//for
				}//for
				return {"or":or};
			};
			output=mult(output.and, 0);
			output.isNormal=true;
			esfilter=output;
			break;
		}else if (esfilter.or){
			output={"or":[]};
			esfilter.or.forall(function(o, i){
				var k=ESFilter.normalize(o);
				if (k.or){
					output.or.appendArray(k.or);
				}else{
					output.or.push(k);
				}//endif
			});
			esfilter=output;
			break;
		}//endif
	}//while
D.println("  to: "+CNV.Object2JSON(esfilter));

	esfilter.isNormal=true;
	return esfilter;
};//method

ESFilter.simplify(
	{"and":[
		{"and":[
				{"term":{"product":"core"}},
				{"or":[
						{"prefix":{"component":"javascript"}},
						{"prefix":{"component":"nanojit"}}
					]}
			]},
		{"not":{"and":[
					{
						"isNormal":true,
						"term":{"product":"core"}
					},
					{"or":[
							{
								"isNormal":true,
								"prefix":{"component":"layout"}
							},
							{
								"isNormal":true,
								"prefix":{"component":"printing"}
							},
							{
								"isNormal":true,
								"prefix":{"component":"webrtc"}
							},
							{"terms":{"component":[
										"style system (css)",
										"svg",
										"video/audio",
										"internationalization"
									]}}
						]}
				]}}
	]}
);
