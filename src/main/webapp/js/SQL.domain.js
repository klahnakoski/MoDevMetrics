////////////////////////////////////////////////////////////////////////////////
// DOMAIN
////////////////////////////////////////////////////////////////////////////////
SQL.domain = {};

SQL.domain.compile = function(sourceColumns, column){
	if (column.domain === undefined){
		SQL.domain["default"](column, sourceColumns);
	} else if (SQL.domain[column.domain.type] === undefined){
		D.error("Do not know how to compile a domain of type '" + column.domain.type + "'");
	} else{
		SQL.domain[column.domain.type](column, sourceColumns);
	}//endif
};//method


SQL.domain.value = {

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

	getPartition:function(value){
		return value;
	},

	getKey:function(partition){
		return partition;
	}

};


//
// DEFAULT DOMAIN FOR GENERAL SETS OF PRIMITIVES
//
SQL.domain["default"] = function(column, sourceColumns){
	var d = {};

	column.domain = d;

	d.type = "default";

//	column.domain.equal=function(a, b){
//		return a == b;
//	};//method

	d.compare = function(a, b){
		return SQL.domain.value.compare(a.value, b.value);
	};//method

	d.NULL = {"value":null};

	d.partitions = [];
	d.map = {};

	d.getPartition = function(value){
		var partition = this.map[value];
		if (partition !== undefined) return partition;

		//ADD ANOTHER PARTITION TO COVER
		partition = {};
		partition.value = value;
		partition.name = value;

		this.partitions.push(partition);
		this.partitions.sort(this.compare);
		this.map[value] = partition;
		return partition;
	};//method

	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey = function(partition){
		return partition.value;
	};//method

	d.end = function(partition){
		return partition.value;
	};
};


SQL.domain.time = function(column, sourceColumns){

	var d = column.domain;
	if (d.name === undefined) d.name = d.type;
	d.NULL = {"value":null, "name":"null"};

	d.interval = Duration.newInstance(d.interval);


	//DEFAULT TO "<" and ">=" LIMITS
	if (d.max !== undefined){
		d["<"] = Date.newInstance(d.max).add(d.interval);
		d.max = undefined;
	}//endif
	if (d.min !== undefined){
		d[">="] = Date.newInstance(d.min);
		d.min = undefined;
	}//endif
	if (d["<="] !== undefined){
		d["<"] = Date.newInstance(d["<="]).add(d.interval);
		d["<="] = undefined;
	}//endif
	if (d[">"] !== undefined){
		d[">="] = Date.newInstance(d[">"]).add(d.interval);
		d[">"] = undefined;
	}//endif
	d["<"] = Date.newInstance(d["<"]);
	d[">="] = Date.newInstance(d[">="]);

//	d.equal=function(a, b){
//		if (a==null || b==null)	return a == b;
//		return (a.floor(this.interval)-b.floor(this.interval))==0;
//	};//method

	d.compare = function(a, b){
		return SQL.domain.value.compare(a.value, b.value);
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
		d.getPartition = function(value){
			if (value == null) return null;
			if (value < this[">="] || this["<"] <= value) return null;
			for(var i = 0; i < this.partitions.length; i++){
				if (this.partitions[i].max > value) return this.partitions[i];
			}//for
			return null;
		};//method

		if (d.partitions === undefined){
			d.partitions = [];
			for(var v = d[">="]; v < d["<"]; v = v.add(d.interval)){
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
		d.getPartition = undefined;  //DO NOT USE WHEN MULTIVALUED

		var f =
			"d.getPartitions=function(__source){\n" +
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
	}//endif

	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey = function(partition){
		return partition.value;
	};//method

};//method;

////////////////////////////////////////////////////////////////////////////////
// duration IS A PARTITION OF TIME DURATION
////////////////////////////////////////////////////////////////////////////////
SQL.domain.duration = function(column, sourceColumns){

	var d = column.domain;
	if (d.name === undefined) d.name = d.type;
	d.NULL = {"value":null, "name":"null"};
	d.interval = Duration.newInstance(d.interval);


	//DEFAULT TO "<" and ">=" LIMITS
	if (d.max !== undefined){
		d["<"] = Duration.newInstance(d.max).add(d.interval).floor(d.interval);
		d.max = undefined;
	}//endif
	if (d.min !== undefined){
		d[">="] = Duration.newInstance(d.min).floor(d.interval);
		d.min = undefined;
	}//endif
	if (d["<="] !== undefined){
		d["<"] = Duration.newInstance(d["<="]).add(d.interval).floor(d.interval);
		d["<="] = undefined;
	}//endif
	if (d[">"] !== undefined){
		d[">="] = Duration.newInstance(d[">"]).add(d.interval).floor(d.interval);
		d[">"] = undefined;
	}//endif
	d["<"] = Duration.newInstance(d["<"]).floor(d.interval);
	d[">="] = Duration.newInstance(d[">="]).floor(d.interval);


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
		d.getPartition = function(value){
			if (value == null) return null;
			var floor = value.floor(this.interval);

			if (this[">="] === undefined){//NO MINIMUM REQUESTED
				if (this.min === undefined && this.max === undefined){
					this.min = floor;
					this.max = Util.coalesce(this["<"], floor.add(this.interval));
					SQL.domain.duration.addRange(this.min, this.max, this);
				} else if (value.milli < this.min.milli){
//					var newmin=floor;
					SQL.domain.duration.addRange(floor, this.min, this);
					this.min = floor;
				}//endif
			} else if (this[">="] == null){
				D.error("Should not happen");
			} else if (value.milli < this[">="].milli){
				return null;
			}//endif

			if (this["<"] === undefined){//NO MAXIMUM REQUESTED
				if (this.min === undefined && this.max === undefined){
					this.min = Util.coalesce(this[">="], floor);
					this.max = floor.add(this.interval);
					SQL.domain.duration.addRange(this.min, this.max, this);
				} else if (value.milli >= this.max.milli){
					var newmax = floor.add(this.interval);
					SQL.domain.duration.addRange(this.max, newmax, this);
					this.max = newmax;
				}//endif
			} else if (value.milli >= this["<"].milli){
				column.outOfDomainCount++;
				return null;
			}//endif

			return d.map[floor];
		};//method

		if (d.partitions === undefined){
			d.map = {};
			d.partitions = [];
			if (!(d[">="] === undefined) && !(d["<"] === undefined)){
				SQL.domain.duration.addRange(d[">="], d["<"], d);
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

	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey = function(partition){
		return partition.value;
	};//method

};//method;

SQL.domain.duration.addRange = function(min, max, domain){
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


SQL.domain.set = function(column, sourceColumns){

	var d = column.domain;
	if (d.name === undefined) d.name = d.type;

	if (d.key === undefined) d.key = "value";
	if (d.key instanceof Array){
		d.getKey=function(partition){
			////////////////////////////////////////////////////////////////////
			// KEY USING CONCATENATION IS DANGEROUS
			////////////////////////////////////////////////////////////////////
			var key="";
			for(var i=d.key.length;i--;){
				key+=partition[d.key[i]]+"|";
			}//for
		};//method
	}else{
		d.getKey = function(partition){
			return partition[this.key];
		};//method
	}//endif

	d.NULL = {};
	d.NULL[d.key] = null;
	d.NULL.name="null";


	d.compare = function(a, b){
		return SQL.domain.value.compare(a[d.key], b[d.key]);
	};//method

	d.format = function(partition){
		if (partition[d.key].toString===undefined) return CNV.Object2JSON(partition[d.key]);
		return partition[d.key].toString();
	};//method
	

	d.getPartition = function(value){
		if (value == null) return null;

		var temp = this.map[value];
		if (temp === undefined) return null;
		return temp;
	};//method

	if (d.partitions === undefined) D.error("Expecting domain " + d.name + " to have a 'partitions' attribute to define the set of partitions that compose the domain");

	//DEFINE VALUE->PARTITION MAP
	if (column.test === undefined){
		d.map = {};
		for(var i = 0; i < d.partitions.length; i++){
			var part = d.partitions[i];
			if (part[d.key] === undefined) D.error("Expecting object to have '" + d.key + "' attribute:" + CNV.Object2JSON(part));
			if (d.map[part[d.key]] !== undefined && d.test == undefined){
				D.error("Domain '" + d.name + "' was given two partitions that map to the same value (a[\"" + d.key + "\"]==b[\"" + d.key + "\"]): where a=" + CNV.Object2JSON(part) + " and b=" + CNV.Object2JSON(d.map[part[d.key]]));
			}//endif
			d.map[part[d.key]] = part;
		}//for
	} else{
		if (d.key !== undefined) D.warning("Domain '" + d.name + "' does not require a 'key' attribute when the colum has 'test' attribute");
		////////////////////////////////////////////////////////////////////////
		//FIND A "==" OPERATOR AND USE IT TO DEFINE AN INDEX INTO THE DOMAIN'S VALUES
		//THIS IS HACKY OPTIMIZATION, BUT SEVERELY REQUIRED BECAUSE JOINS WILL
		//SQUARE OR CUBE QUICKLY WITHOUT IT
		////////////////////////////////////////////////////////////////////////
		if (column.test.indexOf("||") >= 0){
			D.warning("Can not optimize test condition with a OR operator: {" + column.test + "}");
			SQL.domain.set.compileSimpleLookup(column, d, sourceColumns);
			return;
		} else{
			var ands = column.test.split("&&");
			var indexVar = null;		//THE DOMAIN VALUE TO INDEX THE LIST WITH
			var lookupVar = null;		//THE VALUE THAT WILL BE USED TO LOOKUP
			for(var a = 0; a < ands.length; a++){
				if (ands[a].indexOf("==") >= 0){
					var equals = ands[a].split("==");
					indexVar = null;
					lookupVar = null;
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
					if (indexVar != null && lookupVar != null) break;
				}//endif
			}//for
			if (indexVar == null || lookupVar == null){
				D.warning("test clause is too complicated to optimize: {" + column.test + "}");
				SQL.domain.set.compileSimpleLookup(column, d, sourceColumns);
				return;
			}//endif

			//INDEX USING indexVar
			d.map = {};
			for(var o = 0; o < d.partitions.length; o++){
				var sublist = d.map[d.partitions[o][indexVar]];
				if (sublist === undefined){
					sublist = [];
					d.map[d.partitions[o][indexVar]] = sublist;
				}//endif
				sublist.push(d.partitions[o]);
			}//for

			SQL.domain.set.compileMappedLookup(column, d, sourceColumns, lookupVar);
		}//endif
	}//endif


};//method


SQL.domain.set.compileSimpleLookup = function(column, d, sourceColumns){
	d.getPartition = undefined;
	d.map = undefined;
	var f =
		"d.getPartitions=function(__source){\n" +
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

SQL.domain.set.compileMappedLookup = function(column, d, sourceColumns, lookupVar){
	d.getPartition = undefined;

	var f =
		"d.getPartitions=function(__source){\n" +
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
		"for(var i=0;i<sublist.length;i++){\n" +
			"var " + d.name + "=sublist[i];\n" +
			"if (" + column.test + ") output.push(" + d.name + ");\n " +
		"}\n " +
		"return output;\n " +
		"}";
	eval(f);
};

