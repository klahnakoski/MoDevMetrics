




var SQL=function(){};


SQL.prototype.calc=function(query){

	var sourceColumns=SQL.getColumns(query.from);
	var resultColumns={};


	//COMPILE COLUMN CALCULATION CODE
	var facets=query["facets"];
	for(g in facets){
		resultColumns[facets[g].name]=facets[g];
		SQL.column.compile(sourceColumns, facets[g]);
		SQL.domain.compile(sourceColumns, facets[g]);
	}//for
	var select=query["select"];
	for(s in select){
		resultColumns[select[s].name]=select[s];
		SQL.column.compile(sourceColumns, select[s]);
		SQL.domain.compile(sourceColumns, select[s]);
		SQL.aggregate.compile(select[s]);
	}//for


	var indexedOutput={};
	for(i in query.from){
		var row=query.from[i];

		//CALCULATE THE GROUP COLUMNS TO PLACE RESULT
		var allElements=[{}];
		for(f in facets){
			var facet=facets[f];
			var v=facet.calc(row);

			for(t in allElements){
				var result=allElements[t];

				if (facet.test===undefined){
					//STANDARD 1-1 MATCH VALUE TO DOMAIN
					result[facet.name]=facet.domain.getPartition(v);
				}else{
					//MULTIPLE MATCHES EXIST
					var partitions=facet.domain.getPartitions(row);
					var isFirst=true;
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
			}//for
		}//for

		for (s in select){
			var ss=select[s];
			var v=ss.calc(row);

			for(t in allElements){
				result=SQL.addResultToOutput(allElements[t], indexedOutput, select, facets);

				//FOR EACH SELECT, ADD TO THE AGGREGATE VALUE
				result[ss.name]=ss.add(result[ss.name], v);
			}//for
		}//for
	}//for


	var output=[];
	SQL.outputToList(output, indexedOutput, facets, 0);

	//TURN AGGREGATE OBJECTS TO SINGLE NUMBER
	for (c in select){
		var s=select[c];
		if (s.end===undefined) continue;

		for(i in output){
			var o=output[i];
			o[s.name]=s.end(o[s.name]);
		}//for
	}//for


	//FINALLY, ORDER THE OUTPUT
	if (query.order===undefined) return output;
	output=SQL.order(output, query.order, resultColumns);

	return output;
};//method



// CONVERT THE indexed OBJECT TO A FLAT LIST FOR output
SQL.outputToList=function(output, indexed, facets, depth){
	if (depth==facets.length){
		output.push(indexed);
	}else{
		var keys=Object.keys(indexed);
		for(k in keys){
			SQL.outputToList(output, indexed[keys[k]], facets, depth+1)
		}//for
	}//endif
};//method


SQL.addResultToOutput=function(result, output, select, facets){

	//FIND RESULT IN output
	//output IS A TREE INDEXED BY THE PARTITION CANONICAL VALUES
	var depth=output;
	for (i=0;i<facets.length-1;i++){
		var v=result[facets[i].name].value;
		if (depth[v]===undefined) depth[v]={};
		depth=depth[v];
	}//for
	v=result[facets[i].name].value;
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

SQL.column={};

SQL.column.compile=function(sourceColumns, resultColumn){

	if (resultColumn.value===undefined){
		resultColumn.calc=Util.returnNull;
		return;
	}//endif

	//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS AS COLUMN DEFS
	var f="resultColumn.calc=function(__row){\n";
	for(s in sourceColumns){
		var v=sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(v)!=-1){
			f+="var "+v+"=__row."+v+";\n";
		}//endif
	}//for
	f+=
		"try{ "+
		"	return ("+resultColumn.value+"); "+
		"}catch(e){ "+
		"	D.warning(\"Problem with \\\""+resultColumn.name+"\\\" {"+resultColumn.value+"}\", e); "+
		"}}";
	eval(f);

};//method


////////////////////////////////////////////////////////////////////////////////
// AGGREGATION
////////////////////////////////////////////////////////////////////////////////



SQL.aggregate={};
SQL.aggregate.compile=function(select){

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
};

SQL.aggregate.sum=function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		return total+v;
	};//method
};

SQL.aggregate.count=function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add=function(total, v){
		if (v===undefined || v==null) return total;
		return total+1;
	};//method
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
};


////////////////////////////////////////////////////////////////////////////////
// DOMAIN
////////////////////////////////////////////////////////////////////////////////
SQL.domain=function(){};

SQL.domain.compile = function(sourceColumns, column){
	if (column.domain === undefined){
		SQL.domain["default"](column, sourceColumns);
	}else if (SQL.domain[column.domain.type]===undefined){
		D.error("Do not know how to compile a domain of type '" + column.domain.type + "'");
	}else{
		SQL.domain[column.domain.type](column, sourceColumns);
	}//endif
};//method



//
// DEFAULT DOMAIN FOR GENERAL SETS OF PRIMITIVES
//
SQL.domain["default"]=function(column, sourceColumns){
	column.sortOrder=1;
	if (column.sort=="descending") column.sortOrder=-1;

	column.domain={};

	column.domain.equal=function(a, b){
		return a == b;
	};//method

	column.domain.compare=function(a, b){
		if (a==null){
			if (b==null) return 0;
			return -1;
		}else if (a==null){
			return 1;
		}//endif

		return column.sortOrder*((a < b) ? -1 : ((a > b) ? +1 : 0));
	};//method


	column.domain.list=[];

	column.domain.getPartition=function(value){
		for(i in this.list){
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
};







SQL.domain.time=function(column, sourceColumns){
	column.sortOrder=1;
	if (column.sort=="descending") column.sortOrder=-1;

	var d=column.domain;
	if (d.name===undefined) d.name=d.type;

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

	d.equal=function(a, b){
		if (a==null || b==null)	return a == b;
		return (a.floor(this.interval)-b.floor(this.interval))==0;
	};//method


	d.compare=function(a, b){
		if (a==null){
			if (b==null) return 0;
			return -1;
		}else if (a==null){
			return 1;
		}//endif

		return column.sortOrder*Math.sign(a.floor(this.interval)-b.floor(this.interval));
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


	d.getPartition=function(value){
		if (value==null) return null;
		if (value < this["<="] || this["<"] <= value){
			D.warning(value+" is out of range ["+this["<="]+","+this["<"]+")");
			return null;
		}//endif
		return value.floor(this.interval);
	};//method


	if (d.list===undefined){
		d.list=[];
		for(v=d[">="];v<d["<"];v=v.add(1, d.interval)){
			var r={};
			r.value=v;
			r.min=v;
			r.max=v.add(1, d.interval);
			r.name=d.format(v);
			d.list.push(r);
		}//for
	}//endif

	if (!(column.test===undefined)){
		var f=
		"d.getPartitions=function(__row){\n"+
			"if (__row==null) return [];\n";

			for(s in sourceColumns){
				var v=sourceColumns[s].name;
				//ONLY DEFINE VARS THAT ARE USED
				if (column.test.indexOf(v)!=-1){
					f+="var "+v+"=__row."+v+";\n";
				}//endif
			}//for

			f+=
			"var output=[];\n"+
			"for(i in this.list){\n" +
				"var "+d.name+"=this.list[i];\n"+
				"if ("+column.test+") output.push("+d.name+");\n "+
			"}\n "+
			"return output;\n "+
		"}";
		eval(f);
	}//endif



};//method;


////////////////////////////////////////////////////////////////////////////////
// ORDERING
////////////////////////////////////////////////////////////////////////////////



//TAKE data LIST OF OBJECTS AND ENSURE names ARE ORDERED
SQL.order=function(data, ordering, columns){

	var totalSort=function(a, b){
		for(o in ordering){
			var diff=columns[ordering[o]].domain.compare(a[ordering[o]].value, b[ordering[o]].value);
			if (diff!=0) return diff;
		}//for
		return 0;
	};

	data.sort(totalSort);

	return data;
};//method

