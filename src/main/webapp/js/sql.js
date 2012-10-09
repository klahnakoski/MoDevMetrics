




var SQL=function(){};




SQL.prototype.calc=function(query){

	//NO FACETS IMPLIES NO AGGREGATION AND NO GROUPING:  SIMPLE SET OPERATION
	if (query.facets===undefined || query.facets.length==0){
		return this.setOP(query);
	}//endif

	var sourceColumns=SQL.getColumns(query.from);
	var resultColumns={};


	//COMPILE COLUMN CALCULATION CODE
	var facets=query["facets"];
	for(var g in facets){
		resultColumns[facets[g].name]=facets[g];
		SQL.column.compile(sourceColumns, facets[g]);
		SQL.domain.compile(sourceColumns, facets[g]);
		facets[g].outOfDomainCount=0;
	}//for
	var select=query["select"];
	for(var s in select){
		resultColumns[select[s].name]=select[s];
		SQL.column.compile(sourceColumns, select[s], facets);
		SQL.aggregate.compile(select[s]);
	}//for
	var where=SQL.where.compile(query.where, sourceColumns, facets);
	

	var indexedOutput={};
	for(var i in query.from){
		var row=query.from[i];

		//CALCULATE THE GROUP COLUMNS TO PLACE RESULT
		var allElements=[{}];
		for(var f in facets){
			var facet=facets[f];
			var v=facet.calc(row, null);

			for(var t in allElements){
				var result=allElements[t];

				if (facet.domain.getPartition!==undefined){
					//STANDARD 1-1 MATCH VALUE TO DOMAIN
					var p=facet.domain.getPartition(v);
					if (p===undefined){
						D.error("getPartition() must return a partition, or null");
					}//endif
					if (p==null){
						facet.outOfDomainCount++;
						p=facet.domain.NULL;
					}//endif
					result[facet.name]=p;
				}else{
					//MULTIPLE MATCHES EXIST
					var partitions=facet.domain.getPartitions(row);
					var isFirst=true;
					if (partitions.length==0){
						facet.outOfDomainCount++;
						result[facet.name]=facet.domain.NULL;
					}else{
						for (p in partitions){
							var part=partitions[p];
							if (!isFirst){
								result=Util.copy(result, {});
								allElements.push(result);
							}//endif
							isFirst=false;
							result[facet.name]=part;
						}//for
					}//endif
				}//endif
			}//for
		}//for


		if (select.length==0){
			for(var t in allElements){
				if (where(row, allElements[t])) SQL.addResultToOutput(allElements[t], indexedOutput, select, facets);
			}//for
		}else{
			for (s in select){
				var ss=select[s];
				for(var t in allElements){
					//FIND CACNONICAL RESULT
					result=SQL.addResultToOutput(allElements[t], indexedOutput, select, facets);
					if (where(row, allElements[t])){
						//CALCULATE VALUE
						var v=ss.calc(row, result);

						//ADD TO THE AGGREGATE VALUE
						result[ss.name]=ss.add(result[ss.name], v);
					}//endif

				}//for
			}//for
		}//endif
	}//for

	for(var g in facets){
		if (facets[g].outOfDomainCount>0) D.warning(facets[g].name+" has "+facets[g].outOfDomainCount+" records outside it's domain");
	}//for



	var output=[];
	SQL.outputToList(output, indexedOutput, facets, 0, query.order);


	//ORDER THE OUTPUT
	if (query.order===undefined){
		query.order=[];
		for(var f in facets) query.order.push(facets[f].name);
	}//endif
	output=SQL.order(output, query.order, resultColumns);
	
	//TURN AGGREGATE OBJECTS TO SINGLE NUMBER
	for (var c in select){
		var s=select[c];
		if (s.end===undefined) continue;

		for(var i in output){
			var o=output[i];
			o[s.name]=s.end(o[s.name]);
		}//for
	}//for

	for (c in facets){
		var f=facets[c];
		var fname=f.name;
		var fend=f.domain.end;
		if (fend===undefined) continue;

		for(var i in output){
			var o=output[i];
			o[fname]=fend(o[fname]);
		}//for
	}//for




	return output;
};//method

SQL.prototype.calc2Array=function(sql){
	if (sql.select.length>1) D.error("Expecting only one select column");
	var list=new SQL().calc(sql);		//ASSUME ONLY ONE SELECT STATEMENT

	var columnName=sql.select[0].name;
	var output=[];
	for(var i in list){
		output.push(list[i][columnName]);
	}//for
	return output;
};//method



////////////////////////////////////////////////////////////////////////////////
//  SIMPLE TRANSFORMATION ON A LIST OF OBJECTS
////////////////////////////////////////////////////////////////////////////////
SQL.prototype.setOP=function(query){
	var sourceColumns=SQL.getColumns(query.from);
	var resultColumns={};

	var select=query["select"];
	for(var s in select){
		resultColumns[select[s].name]=select[s];
		SQL.column.compile(sourceColumns, select[s], null);
	}//for
	var where=SQL.where.compile(query.where, sourceColumns, []);

	var output=[];
	for(var t in query.from){
		var result={};
		for (var s in select){
			var ss=select[s];
			if (where(query.from[t], {})){
				result[ss.name]=ss.calc(query.from[t], null);
			}//endif
		}//for
		output.push(result);
	}//for
	

	//ORDER THE OUTPUT
	if (query.order===undefined) query.order=[];
	output=SQL.order(output, query.order, resultColumns);

	return output;

};//method








// CONVERT THE indexed OBJECT TO A FLAT LIST FOR output
SQL.outputToList=function(output, indexed, facets, depth, order){
	if (depth==facets.length){
		output.push(indexed);
	}else{
		var keys=Object.keys(indexed);
		for(var k in keys){
			SQL.outputToList(output, indexed[keys[k]], facets, depth+1)
		}//for
	}//endif
};//method

////ADD THE MISSING DOMAIN VALUES
//SQL.nullToList=function(output, facets, depth){
//	if ()
//
//
//};//method


SQL.addResultToOutput=function(result, output, select, facets){

	//FIND RESULT IN output
	//output IS A TREE INDEXED BY THE PARTITION CANONICAL VALUES
	var depth=output;
	for (var i=0;i<facets.length-1;i++){
		var v=facets[i].domain.getKey(result[facets[i].name]);
		if (depth[v]===undefined) depth[v]={};
		depth=depth[v];
	}//for

	if (v=result[facets[i].name]==null){
		D.println("what?");
	}//endif
	v=facets[i].domain.getKey(result[facets[i].name]);
	if (depth[v]!==undefined) return depth[v];

	//ADD SELECT DEFAULTS
	for (s in select){
		result[select[s].name]=select[s].defaultValue();
	}//for

	//ADD NEW GROUP TO output
	depth[v]=result;

	return result;
};//method


// PULL COLUMN DEFINITIONS FROM LIST OF OBJECTS
SQL.getColumns=function(data) {
    var output=[];
    for (i in data) {
        var keys = Object.keys(data[i]);
        kk: for (k in keys) {
            for (c in output) {
                if (output[c].name == keys[k]) continue kk;
            }//for
            output.push({"name":keys[k]});
        }//for
    }//for
    return output;
};//method



// COLUMN COMPILE


SQL.column={};

SQL.column.compile=function(sourceColumns, resultColumn, facets){

	if (resultColumn.value===undefined){
		resultColumn.calc=Util.returnNull;
		return;
	}//endif

	resultColumn.sortOrder=1;
	if (resultColumn.sort=="descending") resultColumn.sortOrder=-1;



	//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
	//AS VAR DEFS, AND USING THE GROUPBY result 
	var f="resultColumn.calc=function(__source, __result){\n";
	for(var s in sourceColumns){
		var columnName=sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(columnName)!=-1){
			f+="var "+columnName+"=__source."+columnName+";\n";
		}//endif
	}//for
	if (facets!==undefined) for(var i in facets){
		var columnName=facets[i].name;
		var domainName=facets[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(domainName+".")!=-1){
			f+="var "+domainName+"=__result."+columnName+";\n";
		}//endif
	}//for

	f+=
		"try{ "+
		"	return ("+resultColumn.value+"); "+
		"}catch(e){ "+
		"	D.warning(\"Problem with definition of \\\""+resultColumn.name+"\\\" {"+resultColumn.value+"}\", e); "+
		"}}";
	eval(f);

};//method

//MAKE THE WHERE TEST METHOD
SQL.where={};
SQL.where.compile=function(whereClause, sourceColumns, facets){
	var whereMethod=null;


	if (whereClause===undefined){
		eval("whereMethod=function(a, b){return true;}");
		return whereMethod;
	}//endif

	var f="whereMethod=function(__source, __result){\n";
	for(var s in sourceColumns){
		var columnName=sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(columnName)!=-1){
			f+="var "+columnName+"=__source."+columnName+";\n";
		}//endif
	}//for
	if (facets!==undefined) for(var i in facets){
		var columnName=facets[i].name;
		var domainName=facets[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(domainName+".")!=-1){
			f+="var "+domainName+"=__result."+columnName+";\n";
		}//endif
	}//for

	f+=
		"try{ "+
		"	return ("+whereClause+"); "+
		"}catch(e){ "+
		"	D.warning(\"Problem with definition of the where clause {"+whereClause+"}\", e); "+
		"}}";
	eval(f);

	return whereMethod;

};//method


////////////////////////////////////////////////////////////////////////////////
// AGGREGATION
////////////////////////////////////////////////////////////////////////////////



SQL.aggregate={};
SQL.aggregate.compile=function(select){
	if (select.operation===undefined) select.operation="none";

	if (SQL.aggregate[select.operation]===undefined){
		D.error("Do not know aggregate operation '"+select.operation+"'");
	}//endif

	return SQL.aggregate[select.operation](select);
};//method


//SQL.aggregate.filter=function(column){
//	column.defaultValue = function(){
//		return null;
//	};//method
//
//
//
//
//	column.add=function(total, v){
//		if (v===undefined || v==null) return total;
//		if (total==null) return v;
//
//		if () total=v;
//		return total;
//	};//method
//
//	column.end=function(total){
//		if (total==null) return null;
//		return column.calc(total);
//	};//method
//};



SQL.aggregate.join=function(column){
	if (column.separator===undefined) column.separator='';

	column.defaultValue = function(){
		return null;
	};//method

	column.add=function(total, v){
		if (v===undefined || v==null) return total;
		if (total==null) return v;
		return total+this.separator+v;
	};//method

	column.domain=SQL.domain.value;
};

SQL.aggregate.average=function(select){
	select.defaultValue = function(){
		return {total:0.0, count:0.0};
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;

		total.total+=v;
		total.count++;

		return total;
	};//method

	select.end=function(total){
		if (total.count==0) return null;
		return total.total/total.count;
	};//method

	select.domain=SQL.domain.value;
};

SQL.aggregate.none=function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		if (total==null) return v;
		D.error("Not expecting to aggregate, only one non-null value allowed per set");
		return null;
	};//method

	select.domain=SQL.domain.value;
};


SQL.aggregate.sum=function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		return total+v;
	};//method

	select.domain=SQL.domain.value;
};

SQL.aggregate.count=function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		return total+1;
	};//method

	select.domain=SQL.domain.value;
};

SQL.aggregate.maximum=function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		if (total==null || v>total) return v;
		return total;
	};//method

	select.domain=SQL.domain.value;
};

SQL.aggregate.minimum=function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		if (total==null || v<total) return v;
		return total;
	};//method

	select.domain=SQL.domain.value;
};


////////////////////////////////////////////////////////////////////////////////
// DOMAIN
////////////////////////////////////////////////////////////////////////////////
SQL.domain={};

SQL.domain.compile = function(sourceColumns, column){
	if (column.domain === undefined){
		SQL.domain["default"](column, sourceColumns);
	}else if (SQL.domain[column.domain.type]===undefined){
		D.error("Do not know how to compile a domain of type '" + column.domain.type + "'");
	}else{
		SQL.domain[column.domain.type](column, sourceColumns);
	}//endif
};//method



SQL.domain.value={

	compare:function(a, b){
			if (a==null){
			if (b==null) return 0;
			return -1;
		}else if (a==null){
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
	},

	end:function(partition){
		return partition;
	}
};






//
// DEFAULT DOMAIN FOR GENERAL SETS OF PRIMITIVES
//
SQL.domain["default"]=function(column, sourceColumns){
	var d={};
	column.domain=d;


//	column.domain.equal=function(a, b){
//		return a == b;
//	};//method

	d.compare=function(a, b){
		return SQL.domain.value.compare(a.value, b.value);
	};//method

	d.NULL={"value":null};

	d.list=[];

	d.getPartition=function(value){
		for(var i in this.list){
			var partition=this.list[i];
			if (partition.value==value) return partition;
		}//for
		
		//ADD ANOTHER PARTITION TO COVER
		var output={};
		output.value=value;
		output.name=value;

		this.list.push(output);
		return output;
	};//method

	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey=function(partition){
		return partition.value;
	};//method

	d.end=function(partition){
		return partition.value;
	};
};




SQL.domain.time=function(column, sourceColumns){

	var d=column.domain;
	if (d.name===undefined) d.name=d.type;
	d.NULL={"value":null};


	//DEFAULT TO "<" and ">=" LIMITS
	if (d.max!=null){
		d["<"]=d.max.add(1, d.interval);
		d.max=undefined;
	}//endif
	if (d.min!=null){
		d[">="]=d.min;
		d.min=undefined;
	}//endif
	if (d["<="]!=null){
		d["<"]=d.max.add(1, d.interval);
		d["<="]=undefined;
	}//endif
	if (d[">"]!=null){
		d[">="]=d[">"].add(1, d.interval);
		d[">"]=undefined;
	}//endif

//	d.equal=function(a, b){
//		if (a==null || b==null)	return a == b;
//		return (a.floor(this.interval)-b.floor(this.interval))==0;
//	};//method

	d.compare=function(a, b){
		return SQL.domain.value.compare(a.value, b.value);
	};//method

	//PROVIDE FORMATTING FUNCTION
	if (d.format===undefined){
		d.format=function(value){
			return value.toString();
		};//method
	}else{
		var formatValue=d.format;
		d.format=function(value){
			return value.format(formatValue);
		};//method
	}//endif


	if (column.test===undefined){
		d.getPartition=function(value){
			if (value==null) return null;
			if (value < this["<="] || this["<"] <= value){
				return null;
			}//endif
			return d.map[value.floor(this.interval)];
		};//method

		if (d.list===undefined){
			d.map={};
			for(var v=d[">="];v<d["<"];v=v.add(1, d.interval)){
				d.map[v]={
					"value":v,
					"min":v,
					"max":v.add(1, d.interval),
					"name":d.format(v)
				};
			}//for
		}else{
			d.map={};
			for(var v in list){
				d.map[list[v].value]=list[v];  //ASSMUE THE DOMAIN HAS THE value ATTRBUTE
			}//for
		}//endif
	}else{
		d.getPartition=undefined;  //DO NOT USE WHEN MULTIVALUED

		var f=
		"d.getPartitions=function(__source){\n"+
			"if (__source==null) return [];\n";

			for(var s in sourceColumns){
				var v=sourceColumns[s].name;
				//ONLY DEFINE VARS THAT ARE USED
				if (column.test.indexOf(v)!=-1){
					f+="var "+v+"=__source."+v+";\n";
				}//endif
			}//for

			f+=
			"var output=[];\n"+
			"for(var i in this.list){\n" +
				"var "+d.name+"=this.list[i];\n"+
				"if ("+column.test+") output.push("+d.name+");\n "+
			"}\n "+
			"return output;\n "+
		"}";
		eval(f);
	}//endif

	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey=function(partition){
		return partition.value;
	};//method

	d.end=function(partition){
		return partition.value;
	};


};//method;

////////////////////////////////////////////////////////////////////////////////
// duration IS A PARTITION OF TIME DURATION
////////////////////////////////////////////////////////////////////////////////
SQL.domain.duration=function(column, sourceColumns){

	var d=column.domain;
	if (d.name===undefined) d.name=d.type;
	d.NULL={"value":null};
	d.interval=Duration.newInstance(d.interval);


	//DEFAULT TO "<" and ">=" LIMITS
	if (d.max!==undefined){
		d["<"]=Duration.newInstance(d.max).add(d.interval);
		d.max=undefined;
	}//endif
	if (d.min!==undefined){
		d[">="]=Duration.newInstance(d.min);
		d.min=undefined;
	}//endif
	if (d["<="]!==undefined){
		d["<"]=Duration.newInstance(d.max).add(d.interval);
		d["<="]=undefined;
	}//endif
	if (d[">"]!==undefined){
		d[">="]=Duration.newInstance(d[">"]).add(d.interval);
		d[">"]=undefined;
	}//endif
	d["<"]=Duration.newInstance(d["<"]);
	d[">="]=Duration.newInstance(d[">="]);

	
	d.compare=function(a, b){
		if (a.value==null){
			if (b.value==null) return 0;
			return -1;
		}else if (a.value==null){
			return 1;
		}//endif
		
		return ((a.value.milli < b.value.milli) ? -1 : ((a.value.milli > b.value.milli) ? +1 : 0));
	};//method

	//PROVIDE FORMATTING FUNCTION
	if (d.format===undefined){
		d.format=function(value){
			return value.toString();
		};//method
	}//endif


	if (column.test===undefined){
		d.getPartition=function(value){
			if (value==null) return null;
			var floor=value.floor(this.interval);

			if (this[">="]===undefined){//NO MINIMUM REQUESTED
				if (this.min===undefined && this.max===undefined){
					this.min=floor;
					this.max=Util.coalesce(this["<"], floor.add(this.interval));
					SQL.domain.duration.addRange(this.map, this.min, this.max, this);
				}else if (value.milli<this.min.milli){
//					var newmin=floor;
					SQL.domain.duration.addRange(this.map, floor, this.min, this);
					this.min=floor;
				}//endif
			}else if (this[">="]==null){
				D.error("Should not happen");
			}else if (value.milli < this[">="].milli){
				return null;
			}//endif

			if (this["<"]===undefined){//NO MAXIMUM REQUESTED
				if (this.min===undefined && this.max===undefined){
					this.min=Util.coalesce(this[">="], floor);
					this.max=floor.add(this.interval);
					SQL.domain.duration.addRange(this.map, this.min, this.max, this);
				}else if (value.milli>=this.max.milli){
					var newmax=floor.add(this.interval);
					SQL.domain.duration.addRange(this.map, this.max, newmax, this);
					this.max=newmax;
				}//endif
			}else if (value.milli>=this["<"].milli){
				column.outOfDomainCount++;
				return null;
			}//endif

			return d.map[floor];
		};//method

		if (d.list===undefined){
			d.map={};
			if (!(d[">="]===undefined) && !(d["<"]===undefined)){
				SQL.domain.duration.addRange(d.map, d[">="], d["<"], d);
			}//endif
		}else{
			d.map={};
			for(var v in d.list){
				d.map[d.list[v].value]=d.list[v];  //ASSMUE THE DOMAIN HAS THE value ATTRBUTE
			}//for
		}//endif
	}else{
		d.error("matching multi to duration domain is not supported");
	}//endif

	//RETURN CANONICAL KEY VALUE FOR INDEXING
	d.getKey=function(partition){
		return partition.value;
	};//method

	d.end=function(partition){
		if (partition.value==null) return null;
		return partition.value;
	};


};//method;

SQL.domain.duration.addRange=function(map, min, max, domain){
	for(var v=min;v.milli<max.milli;v=v.add(domain.interval)){
		map[v]={
			"value":v,
			"min":v,
			"max":v.add(domain.interval),
			"name":domain.format(v)
		};
	}//for
};//method


SQL.domain.set=function(column, sourceColumns){

	var d=column.domain;
	if (d.name===undefined) d.name=d.type;

	if (d.key===undefined) d.key="value";
	d.getKey=function(partition){
		return partition[this.key];
	};//method

	d.NULL={}; d.NULL[d.key]=null;


	d.compare=function(a, b){
		return SQL.domain.value.compare(a[d.key], b[d.key]);
	};//method

	d.format=function(partition){
		return partition[d.key].toString();
	};//method

	d.getPartition=function(value){
		if (value==null) return null;

		var temp=d.map[value];
		if (temp===undefined) return null;
		return temp;
	};//method

	if (d.list===undefined) D.error("Expecting domain "+d.name+" to have a 'list' attribute to define the set of partitions");

	//DEFINE VALUE->PARTITION MAP
	if (column.test===undefined){
		d.map={};
		for(var i in d.list){
			var part=d.list[i];
			if (part[d.key]===undefined) D.error("Expecting object to have '"+d.key+"' attribute:"+CNV.Object2JSON(part));
			if (d.map[part[d.key]]!==undefined && d.test==undefined){
				D.error("Domain '"+d.name+"' was given two partitions that map to the same value (a[\""+d.key+"\"]==b[\""+d.key+"\"]): where a="+CNV.Object2JSON(part)+" and b="+CNV.Object2JSON(d.map[part[d.key]]));
			}//endif
			d.map[part[d.key]]=part;
		}//for
	}else{
		d.getPartition=undefined;
		d.map=undefined;
		var f=
		"d.getPartitions=function(__source){\n"+
			"if (__source==null) return [];\n";

			for(var s in sourceColumns){
				var v=sourceColumns[s].name;
				//ONLY DEFINE VARS THAT ARE USED
				if (column.test.indexOf(v)!=-1){
					f+="var "+v+"=__source."+v+";\n";
				}//endif
			}//for

			f+=
			"var output=[];\n"+
			"for(var i in this.list){\n" +
				"var "+d.name+"=this.list[i];\n"+
				"if ("+column.test+") output.push("+d.name+");\n "+
			"}\n "+
			"return output;\n "+
		"}";
		eval(f);
	}//endif


	d.end=function(partition){
		return partition[d.key];
	};


};//method









////////////////////////////////////////////////////////////////////////////////
// ORDERING
////////////////////////////////////////////////////////////////////////////////



//TAKE data LIST OF OBJECTS AND ENSURE names ARE ORDERED
SQL.order=function(data, ordering, columns){

	var totalSort=function(a, b){
		for(var o in ordering){
			if (columns[ordering[o]].domain===undefined){
				D.warning("what?");
			}

			var diff=columns[ordering[o]].domain.compare(a[ordering[o]], b[ordering[o]]);
			if (diff!=0) return columns[ordering[o]].sortOrder*diff;
		}//for
		return 0;
	};

	data.sort(totalSort);

	return data;
};//method

