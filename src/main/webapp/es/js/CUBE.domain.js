////////////////////////////////////////////////////////////////////////////////
// DOMAIN
////////////////////////////////////////////////////////////////////////////////
CUBE.domain = {};

CUBE.domain.compile = function(sourceColumns, column){
	if (column.domain === undefined){
		CUBE.domain["default"](column, sourceColumns);
		return;
	}//endif

	if (column.domain.type===undefined && column.domain.partitions!==undefined){
		column.domain.type="set";
		if (column.domain.name==="undefined") D.warning("it is always good to name your domain");
	}//endif

	if (CUBE.domain[column.domain.type] === undefined){
		D.error("Do not know how to compile a domain of type '" + column.domain.type + "'");
	} else{
		CUBE.domain[column.domain.type](column, sourceColumns);
	}//endif
};//method


//COMPARE TWO DOMAINS, RETURN true IF IDENTICAL
CUBE.domain.equals=function(a, b){
	if ((a.type=="default" || a.type=="set") && (b.type=="default" || b.type=="set")){
		D.error("not completed");
	}else if (a.type=="time" && b.type=="time"){
		if (a.interval.milli!=b.interval.milli) return false;
		if (a.min.getMilli()!=b.min.getMilli()) return false;
		if (a.max.getMilli()!=b.max.getMilli()) return false;
		return true;
	}else if (a.type="duration" && b.type=="duration"){
		D.error("not completed");
	}else{
		D.error("do not know what to do here");
	}//endif
};//method



////////////////////////////////////////////////////////////////////////////////
// JUST ALL VALUES, USUALLY PRIMITIVE VALUES
////////////////////////////////////////////////////////////////////////////////
CUBE.domain.value = {

	compare:function(a, b){
		if (a == null){
			if (b == null) return 0;
			return -1;
		} else if (b == null){
			return 1;
		}//endif

		return ((a < b) ? -1 : ((a > b) ? +1 : 0));
	},

	NULL:null,

	getCanonicalPart:function(part){
		return part;
	},

	getPartByKey:function(key){
		return value;
	},

	getKey:function(part){
		return part;
	}

};


//
// DEFAULT DOMAIN FOR GENERAL SETS OF PRIMITIVES
//
CUBE.domain["default"] = function(column, sourceColumns){
	var d = {};

	column.domain = d;

	d.type = "default";

//	column.domain.equal=function(a, b){
//		return a == b;
//	};//method

	d.valCMP=CUBE.domain.value.compare;
	d.compare = function(a, b){
		return d.valCMP(a.value, b.value);
	};//method

	d.NULL = {"value":null};

	d.partitions = [];
	d.map = {};
	d.map[null]=d.NULL;


	d.getCanonicalPart = function(part){
		return d.getPartByKey(part.value);
	};//method


	d.getPartByKey=function(key){
		var canonical = this.map[key];
		if (canonical !== undefined) return canonical;

		//ADD ANOTHER PARTITION TO COVER
		canonical = {};
		canonical.value = key;
		canonical.name = key;

		this.partitions.push(canonical);
//		this.partitions.sort(this.compare);
		this.map[key] = canonical;
		return canonical;
	};


	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey = function(part){
		return part.value;
	};//method

	d.end = function(partition){
		return partition.value;
	};

	CUBE.domain.compileEnd(d);

};


CUBE.domain.time = function(column, sourceColumns){

	var d = column.domain;
	if (d.name === undefined) d.name = d.type;
	d.NULL = {"value":null, "name":"null"};

	d.interval = Duration.newInstance(d.interval);
	d.min = Date.newInstance(d.min);//.floor(d.interval);
	d.max = d.min.add(Date.newInstance(d.max).subtract(d.min, d.interval).floor(d.interval, d.min));

	d.compare = function(a, b){
		return CUBE.domain.value.compare(a.value, b.value);
	};//method

	//PROVIDE FORMATTING FUNCTION
	if (d.format === undefined){
		d.format = function(value){
			if (value.toString===undefined) return CNV.Object2JSON(value);
			return value.toString();
		};//method
	} else{
		var formatValue = d.format;
		d.format = function(value){
			return value.format(formatValue);
		};//method
	}//endif


	if (column.test === undefined){
		d.getCanonicalPart = function(part){
			return this.getPartByKey(part.value);
		};//method

		if (d.partitions === undefined){
			d.partitions = [];
			for(var v = d.min; v < d.max; v = v.add(d.interval)){
				var partition = {
					"value":v,
					"min":v,
					"max":v.add(d.interval),
					"name":d.format(v)
				};
				d.partitions.push(partition);
			}//for
		}//endif
	} else{
		d.getCanonicalPart = undefined;  //DO NOT USE WHEN MULTIVALUED

		var f =
			"d.getMatchingParts=function(__source){\n" +
			"	if (__source==null) return [];\n";

		for(var s = 0; s < sourceColumns.length; s++){
			var v = sourceColumns[s].name;
			//ONLY DEFINE VARS THAT ARE USED
			if (column.test.indexOf(v) != -1){
				f += "var " + v + "=__source." + v + ";\n";
			}//endif
		}//for

		f +=
			"	var output=[];\n" +
			"	for(var i=0;i<this.partitions.length;i++){\n" +
			"		var " + d.name + "=this.partitions[i];\n" +
			"		if (" + column.test + ") output.push(" + d.name + ");\n " +
			"	}\n " +
			"	return output;\n " +
			"}";
		eval(f);
	}//endif

	d.getPartByKey=function(key){
		if (key == null  || key=="null") return this.NULL;
		if (typeof(key)=="string")
			key=new Date(key);
		if (key < this.min || this.max <= key) return this.NULL;
		var i=Math.floor(key.subtract(this.min, this.interval).divideBy(this.interval));

		if (this.partitions[i].min>key || key>=this.partitions[i].max) D.error("programmer error");
		return this.partitions[i];
	};//method


	if (d.partitions === undefined){
		d.map = {};
		d.partitions = [];
		if (!(d.min === undefined) && !(d.max === undefined)){
			CUBE.domain.time.addRange(d.min, d.max, d);
		}//endif
	} else{
		d.map = {};
		for(var v = 0; v < d.partitions.length; v++){
			d.map[d.partitions[v].value] = d.partitions[v];  //ASSMUE THE DOMAIN HAS THE value ATTRBUTE
		}//for
	}//endif



	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey = function(partition){
		return partition.value;
	};//method

	CUBE.domain.compileEnd(d);

};//method;



CUBE.domain.time.addRange = function(min, max, domain){
	for(var v = min; v.getMilli() < max.getMilli(); v = v.add(domain.interval)){
		var partition = {
			"value":v,
			"min":v,
			"max":v.add(domain.interval),
			"name":domain.format(v)
		};
		domain.map[v] = partition;
		domain.partitions.push(partition);
	}//for
};//method








////////////////////////////////////////////////////////////////////////////////
// duration IS A PARTITION OF TIME DURATION
////////////////////////////////////////////////////////////////////////////////
CUBE.domain.duration = function(column, sourceColumns){

	var d = column.domain;
	if (d.name === undefined) d.name = d.type;
	if (d.interval===undefined) D.error("Expecting domain '"+d.name+"' to have an interval defined");
	d.NULL = {"value":null, "name":"null"};
	d.interval = Duration.newInstance(d.interval);
	d.min = Duration.newInstance(d.min).floor(d.interval);
	d.max = Duration.newInstance(d.max).floor(d.interval);


	d.compare = function(a, b){
		if (a.value == null){
			if (b.value == null) return 0;
			return -1;
		} else if (b.value == null){
			return 1;
		}//endif

		return ((a.value.milli < b.value.milli) ? -1 : ((a.value.milli > b.value.milli) ? +1 : 0));
	};//method

	//PROVIDE FORMATTING FUNCTION
	if (d.format === undefined){
		d.format = function(value){
			if (value.toString===undefined) return CNV.Object2JSON(value);
			return value.toString();
		};//method
	}//endif


	if (column.test === undefined){
		d.getPartByKey = function(key){
			if (key == null || key=="null") return this.NULL;
			if (typeof(key)=="string") key=Duration.newInstance(key);
			try{
				var floor = key.floor(this.interval);
			}catch(e){
				D.error();

			}
			if (this.min === undefined){//NO MINIMUM REQUESTED
				if (this.min === undefined && this.max === undefined){
					this.min = floor;
					this.max = Util.coalesce(this.max, floor.add(this.interval));
					CUBE.domain.duration.addRange(this.min, this.max, this);
				} else if (key.milli < this.min.milli){
//					var newmin=floor;
					CUBE.domain.duration.addRange(floor, this.min, this);
					this.min = floor;
				}//endif
			} else if (this.min == null){
				D.error("Should not happen");
			} else if (key.milli < this.min.milli){
				return this.NULL;
			}//endif

			if (this.max === undefined){//NO MAXIMUM REQUESTED
				if (this.min === undefined && this.max === undefined){
					this.min = Util.coalesce(this.min, floor);
					this.max = floor.add(this.interval);
					CUBE.domain.duration.addRange(this.min, this.max, this);
				} else if (key.milli >= this.max.milli){
					var newmax = floor.add(this.interval);
					CUBE.domain.duration.addRange(this.max, newmax, this);
					this.max = newmax;
				}//endif
			} else if (key.milli >= this.max.milli){
				column.outOfDomainCount++;
				return this.NULL;
			}//endif

			return this.map[floor];
		};//method

		if (d.partitions === undefined){
			d.map = {};
			d.partitions = [];
			if (!(d.min === undefined) && !(d.max === undefined)){
				CUBE.domain.duration.addRange(d.min, d.max, d);
			}//endif
		} else{
			d.map = {};
			for(var v = 0; v < d.partitions.length; v++){
				d.map[d.partitions[v].value] = d.partitions[v];  //ASSMUE THE DOMAIN HAS THE value ATTRBUTE
			}//for
		}//endif
	} else{
		d.error("matching multi to duration domain is not supported");
	}//endif


	d.getCanonicalPart=function(part){
		return this.getPartByKey(part.value);
	};//method


	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey = function(partition){
		return partition.value;
	};//method

	CUBE.domain.compileEnd(d);

};//method;


CUBE.domain.duration.addRange = function(min, max, domain){
	for(var v = min; v.milli < max.milli; v = v.add(domain.interval)){
		var partition = {
			"value":v,
			"min":v,
			"max":v.add(domain.interval),
			"name":domain.format(v)
		};
		domain.map[v] = partition;
		domain.partitions.push(partition);
	}//for
};//method



CUBE.domain.set = function(column, sourceColumns){

	var d = column.domain;
	if (d.name === undefined) d.name = d.type;

	d.NULL = {};
	d.NULL.name="null";


	d.compare = function(a, b){
		return CUBE.domain.value.compare(d.getKey(a), d.getKey(b));
	};//method

	d.format = function(part){
		if (part.toString===undefined) return CNV.Object2JSON(part);
		return part.toString();
	};//method
	

	d.getCanonicalPart = function(obj){
		return this.getPartByKey(this.getKey(obj));
	};//method

	d.getPartByKey=function(key){
		var canonical = this.map[key];
		if (canonical === undefined) return this.NULL;
		return canonical;
	};//method




	if (d.partitions === undefined) D.error("Expecting domain " + d.name + " to have a 'partitions' attribute to define the set of partitions that compose the domain");

	//DEFINE VALUE->PARTITION MAP
	if (column.test===undefined){
		if (d.key === undefined) d.key = "value";
		CUBE.domain.set.compileKey(d.key, d);

		d.map = {};

		//ENSURE PARTITIONS HAVE UNIQUE KEYS
		for(var i = 0; i < d.partitions.length; i++){
			var part = d.partitions[i];
			var key=d.getKey(part);
			if (key === undefined) D.error("Expecting object to have '" + d.key + "' attribute:" + CNV.Object2JSON(part));
			if (d.map[key] !== undefined){
				D.error("Domain '" + d.name + "' was given two partitions that map to the same value (a[\"" + d.key + "\"]==b[\"" + d.key + "\"]): where a=" + CNV.Object2JSON(part) + " and b=" + CNV.Object2JSON(d.map[key]));
			}//endif
			d.map[key] = part;
		}//for
	}else{
		if (d.key !== undefined) D.warning("Domain '" + d.name + "' does not require a 'key' attribute when the colum has 'test' attribute");
		d.getKey=function(value){return null;};	 //COLLAPSE EDGE TO ONE VALUE

		////////////////////////////////////////////////////////////////////////
		//FIND A "==" OPERATOR AND USE IT TO DEFINE AN INDEX INTO THE DOMAIN'S VALUES
		//THIS IS HACKY OPTIMIZATION, BUT SEVERELY REQUIRED BECAUSE JOINS WILL
		//SQUARE OR CUBE QUICKLY WITHOUT IT
		////////////////////////////////////////////////////////////////////////
		if (column.test.indexOf("||") >= 0){
			D.warning("Can not optimize test condition with a OR operator: {" + column.test + "}");
			CUBE.domain.set.compileSimpleLookup(column, d, sourceColumns);
			return;
		} else{
			var ands = column.test.split("&&");
			var indexVars = [];		//THE DOMAIN VALUE TO INDEX THE LIST WITH
			var lookupVars = [];		//THE VALUE THAT WILL BE USED TO LOOKUP
			for(var a = 0; a < ands.length; a++){
				if (ands[a].indexOf("==") >= 0){
					var equals = ands[a].split("==");
					var indexVar = null;
					var lookupVar = null;
					for(var i = 0; i < equals.length; i++){
						if (equals[i].trim().indexOf(d.name + ".") == 0){
							indexVar = equals[1].trim().rightBut((d.name + ".").length); //REMOVE DOMAIN PREFIX,  ASSUME REMAINDER IS JUST A COLUMN NAME
						}//endif
						for(var s = 0; s < sourceColumns.length; s++){
							if (equals[i].trim() == sourceColumns[s].name){
								lookupVar = sourceColumns[s].name;
							}//endif
						}//for
					}//for
					if (indexVar != null && lookupVar != null){
						indexVars.push(indexVar);
						lookupVars.push(lookupVar);
					}//endif
				}//endif
			}//for
			if (indexVars.length==0){
				D.warning("test clause is too complicated to optimize: {" + column.test + "}");
				CUBE.domain.set.compileSimpleLookup(column, d, sourceColumns);
				return;
			}//endif

			//INDEX USING indexVar
			d.map = {};
			d.map[null]=d.NULL;
			for(var o = 0; o < d.partitions.length; o++){
				var parent=d.map;
				var iv=0;
				for(;iv<indexVars.length-1;iv++){
					var submap = parent[d.partitions[o][indexVars[iv]]];
					if (submap === undefined){
						submap = {};
						parent[d.partitions[o][indexVars[iv]]] = submap;
					}//endif
					parent=submap;
				}//for
				var sublist = parent[d.partitions[o][indexVars[iv]]];
				if (sublist === undefined){
					sublist = [];
					parent[d.partitions[o][indexVars[iv]]] = sublist;
				}//endif
				sublist.push(d.partitions[o]);
			}//for

			try{
				CUBE.domain.set.compileMappedLookup2(column, d, sourceColumns, lookupVars);
			}catch(e){
				D.error("test parameter is malformed", e);
			}//try
		}//endif
	}//endif


	CUBE.domain.compileEnd(d);
};//method


CUBE.domain.set.compileSimpleLookup = function(column, d, sourceColumns){
	d.map = undefined;
	d.getCanonicalPart = undefined;
	d.getMatchingParts=undefined;
	var f =
		"d.getMatchingParts=function(__source){\n" +
			"if (__source==null) return [];\n";

	for(var s = 0; s < sourceColumns.length; s++){
		var v = sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (column.test.indexOf(v) != -1){
			f += "var " + v + "=__source." + v + ";\n";
		}//endif
	}//for

	f +=
		"var output=[];\n" +
			"for(var i=0;i<this.partitions.length;i++){\n" +
			"var " + d.name + "=this.partitions[i];\n" +
			"if (" + column.test + ") output.push(" + d.name + ");\n " +
			"}\n " +
			"return output;\n " +
			"}";
	eval(f);
};

CUBE.domain.set.compileMappedLookup = function(column, d, sourceColumns, lookupVar){
	d.getCanonicalPart = undefined;
	d.getMatchingParts=undefined;
	var f =
		"d.getMatchingParts=function(__source){\n" +
			"if (__source==null) return [];\n";

	for(var s = 0; s < sourceColumns.length; s++){
		var v = sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (column.test.indexOf(v) != -1){
			f += "var " + v + "=__source." + v + ";\n";
		}//endif
	}//for

	f +=
		"var output=[];\n" +
		"var sublist=this.map[" + lookupVar + "];\n" +
		"if (sublist===undefined) return output;\n"+
		"for(var i=sublist.length;i--;){\n" +
			"var " + d.name + "=sublist[i];\n" +
			"if (" + column.test + ") output.push(" + d.name + ");\n " +
		"}\n " +
		"return output;\n " +
		"}";
	eval(f);
};

CUBE.domain.set.compileMappedLookup2 = function(column, d, sourceColumns, lookupVars){
	d.getCanonicalPart = undefined;
	d.getMatchingParts=undefined;
	var f =
		"d.getMatchingParts=function(__source){\n" +
			"if (__source==null) return [];\n";

	for(var s = 0; s < sourceColumns.length; s++){
		var v = sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (column.test.indexOf(v) != -1){
			f += "var " + v + "=__source." + v + ";\n";
		}//endif
	}//for

	f += "var output=[];\n";
	f += "var sublist=this.map;";
	for(var subs = 0; subs < lookupVars.length; subs++){
		f +=
			"sublist=sublist[" + lookupVars[subs] + "];\n" +
			"if (sublist===undefined) return output;\n"
	}//for

	f +=
		"for(var i=sublist.length;i--;){\n" +
			"var " + d.name + "=sublist[i];\n" +
			"if (" + column.test + ")\noutput.push(" + d.name + ");\n " +
		"}\n " +
		"return output;\n " +
		"}";
	eval(f);
};



CUBE.domain.set.compileKey=function(key, domain){
	//HOW TO GET THE ATTRIBUTES OF DOMAIN LOCAL, IN GENERAL?
	//SEE FIRST PARTITION WILL INDICATE THE AVAILABLE FIELDS

	if (key instanceof Array){
		domain.getKey=function(partition){
			//COMPILE WITH PARTITION AS PROTOTYPE
			var newGetKeyFunction;
			var f =
				"newGetKeyFunction=function(__part){\n"+
				"	if (__part==this.NULL) return null;\n";
					for(var att in partition){
						for(var i=key.length;i--;){
							if (key[i].indexOf(att) >= 0){
								f += "var " + att + "=__part." + att + ";\n";
								break;
							}//endif
						}//for
					}//for
					var output=key.join('+"|"+');
			f+=	"	return "+output+"\n"+
				"}";
			eval(f);
			this.getKey=newGetKeyFunction;
			return this.getKey(partition);
		};//method
	}else{
		domain.getKey=function(partition){
			//COMPILE WITH PARTITION AS PROTOTYPE
			var newGetKeyFunction;
			var f =
				"newGetKeyFunction=function(__part){\n"+
				"	if (__part==this.NULL) return null;\n";
					for(var att in partition){
						if (key.indexOf(att) >= 0) f += "var " + att + "=__part." + att + ";\n";
					}//for
			f+=	"	return "+key+"\n"+
				"}";
			eval(f);
			this.getKey=newGetKeyFunction;
			return this.getKey(partition);
		};//method
	}//endif

};//method





////////////////////////////////////////////////////////////////////////////////
// IF THE DOMAIN DEFINES A value, THEN MAKE AN end() FUNCTION WHICH WILL RETURN
// THAT VALUE, INSTEAD OF RETURNING THE DOMAIN OBJECT
////////////////////////////////////////////////////////////////////////////////
CUBE.domain.compileEnd=function(domain){
	if (domain.value!=undefined){
		domain.end=function(part){
			//HOPEFULLY THE FIRST RUN WILL HAVE ENOUGH PARTITIONS TO DETERMINE A TYPE
			var columns=CUBE.getColumns(domain.partitions);
			//RECOMPILE SELF WITH NEW INFO
			domain.end=aCompile.expression(domain.value, [{"columns":columns}]);
			return domain.end(part);
		};//method
	}else if (domain.end===undefined){
		domain.end=function(p){	return p;};

		
	}//endif
};


