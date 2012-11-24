
var CUBE = function(){
};

importScript("CNV.js");
importScript("aDate.js");
importScript("util.js");
importScript("Debug.js");
importScript("MVEL.js");
importScript("CUBE.aggregate.js");
importScript("CUBE.column.js");
importScript("CUBE.cube.js");
importScript("CUBE.domain.js");
importScript("trampoline.js");




CUBE.compile = function(query, sourceColumns){
//COMPILE COLUMN CALCULATION CODE
	var columns = {};

	var edges = query.edges;
	for(var g = 0; g < edges.length; g++){
		var e=edges[g];

		if (typeof(e)=='string'){
			e={"value":e}; //NOW DEFINE AN EDGE BY ITS VALUE
			edges[g]=e;
		}//endif
		if (e.name===undefined) e.name=e.value;
		if (e.allowNulls === undefined) e.allowNulls = false;
		e.columnIndex=g;

		if (columns[e.name]!==undefined) D.error("All edges must have different names");
		columns[e.name] = e;

		CUBE.column.compile(sourceColumns, e);
		CUBE.domain.compile(sourceColumns, e);
		e.outOfDomainCount = 0;
	}//for

	var select = CUBE.select2Array(query.select);
	for(var s = 0; s < select.length; s++){
		if (select[s].name===undefined) select[s].name=select[s].value.split(".").last();
		if (columns[select[s].name]!==undefined) D.error("All columns must have different names");
		select[s].columnIndex=s+edges.length;
		columns[select[s].name] = select[s];
		CUBE.column.compile(sourceColumns, select[s], edges);
		CUBE.aggregate.compile(select[s]);
	}//for

	query.columns=columns;
	return columns;
};

//MAP SELECT CLAUSE TO AN ARRAY OF SELECT COLUMNS
CUBE.select2Array = function(select){
	if (select === undefined) return [];
	if (!(select instanceof Array)) return [select];
	return select;
};//method



CUBE.calc2Tree = function(query){
	if (query.edges.length==0) D.error("Tree processing requires an edge");

	var sourceColumns;
	var from=query.from;
	if (query.from instanceof Array){
		sourceColumns=CUBE.getColumns(query.from);
		from=query.from;
	}else if(query.from.list){
		sourceColumns=query.columns;
		from=query.from.list;
	}else if (query.from.cube){
		query.from.list=CUBE.Cube2List(query.from);
		sourceColumns=query.columns;
		from=query.from.list;
	}//endif
	if (sourceColumns===undefined) sourceColumns=CUBE.getColumns(from);

	var select = CUBE.select2Array(query.select);
	var edges = query.edges;
	query.columns = CUBE.compile(query, sourceColumns);
	var where = CUBE.where.compile(query.where, sourceColumns, edges);
	var agg=CUBE.calcAgg;


	var tree = {};  query.tree=tree;
	var nextYield=new Date().getMilli()+200;
	FROM: for(var i = 0; i < from.length; i++){
		var now=new Date().getMilli();
		if (now > nextYield){
			yield (aThread.yield());
			nextYield=new Date().getMilli()+200;
		}//endif


		var row = from[i];
		//CALCULATE THE GROUP COLUMNS TO PLACE RESULT
		var results = [[]];
		for(var f = 0; f < edges.length; f++){
			var edge = edges[f];


			if (edge.test===undefined){
				var v = edge.calc(row, null);

				//STANDARD 1-1 MATCH VALUE TO DOMAIN
				var p = edge.domain.getPartByKey(v);
				if (p === undefined){
					D.error("getPartByKey() must return a partition, or null");
				}//endif
				if (p == edge.domain.NULL){
					edge.outOfDomainCount++;
					if (edge.allowNulls){
						for(var t = results.length; t--;){
							results[t][f] = edge.domain.NULL;
						}//for
					} else{
						continue FROM;
					}//endif
				} else{
					for(var t = results.length; t--;) results[t][f] = p;
				}//endif
			} else{ //test is DEFINED ON EDGE
				//MULTIPLE MATCHES EXIST
				var matches = edge.domain.getMatchingParts(row);
				if (matches.length == 0){
					edge.outOfDomainCount++;
					if (edge.allowNulls){
						for(var t = results.length; t--;){
							results[t][f] = edge.domain.NULL;
						}//for
					} else{
						continue FROM;
					}//endif
				} else{
					//WE MUTIPLY THE NUMBER OF MATCHES TO THE CURRENT NUMBER OF RESULTS (SQUARING AND CUBING THE RESULT-SET)
					for(var t = results.length; t--;){
						result = results[t];
						result[f] = matches[0];
						for(var p = 1; p < matches.length; p++){
							result = result.copy();
							results.push(result);
							result[f] = matches[p];
						}//for
					}//for
				}//endif
			}//endif
		}//for


		for(var r=results.length;r--;){
			var pass=where(row, results[r]);
			if (pass){
				agg(row, results[r], query, select);
			}//for
		}//for

	}//for

	for(var g = 0; g < edges.length; g++){
		if (edges[g].outOfDomainCount > 0)
			D.warning(edges[g].name + " has " + edges[g].outOfDomainCount + " records outside domain " + edges[g].domain.name);
	}//for


//	query.tree=tree;
	yield query;
};


CUBE.calcAgg=function(row, result, query, select){
	var agg = CUBE.getAggregate(result, query, select);
	for(var s = 0; s < select.length; s++){
		//ADD TO THE AGGREGATE VALUE
		agg[s] = select[s].aggregate(row, result, agg[s]);
	}//endif
};//method


CUBE.getAggregate = function(result, query, select){
	//WE NEED THE select TO BE AN ARRAY
	var edges=query.edges;

	//FIND RESULT IN tree
	var agg = query.tree;
	var i = 0;
	for(; i < edges.length - 1; i++){
		var part=result[i];
		var v = edges[i].domain.getKey(part);
		if (agg[v] === undefined) agg[v] = {};
		agg = agg[v];
	}//for


	
	part=result[i];
	v = edges[i].domain.getKey(part);
	if (agg[v] === undefined){
		agg[v]=[];
		//ADD SELECT DEFAULTS
		for(var s = 0; s < select.length; s++){
			agg[v][s] = select[s].defaultValue();
		}//for
	}//endif

	return agg[v];
};//method


CUBE.calc2List = function(query){
	if (query.edges===undefined) query.edges=[];
	var select = CUBE.select2Array(query.select);

	//NO EDGES IMPLIES NO AGGREGATION AND NO GROUPING:  SIMPLE SET OPERATION
	if (query.edges.length==0){
		if (select[0].operation===undefined){
			yield (CUBE.setOP(query));
		}else{
			yield (CUBE.aggOP(query));
		}//endif
	}//endif

	yield (CUBE.calc2Tree(query));

	var edges=query.edges;
	var columns=query.columns;

	var output = [];
	CUBE.Tree2List(output, query.tree, select, edges, {}, 0);
	yield (aThread.yield());

	//ORDER THE OUTPUT
	if (query.sort === undefined){
		query.sort = [];
		for(var f = 0; f < edges.length; f++) query.sort.push(edges[f].name);
	}//endif
	output = CUBE.sort(output, query.sort, columns);

	//COLLAPSE OBJECTS TO SINGLE VALUE
	for(var c in columns){
		var s=columns[c];
		if (s.domain===undefined){
			D.error("expecting all columns to have a domain");
		}//endif
		var d = columns[c].domain;
		if (d.end === undefined) continue;

		//d.end() MAY REDEFINE ITSELF (COMPILE GIVEN CONTEXT)
		for(var i = 0; i < output.length; i++){
			var o = output[i];
			o[s.name] = d.end(o[s.name]);
		}//for
	}//for

	query.list = output;
	yield (query);
};//method


CUBE.calc2Array = function(query){
	if (query.select instanceof Array) D.error("Expecting select to not be an array");
	if (query.edges !== undefined && query.edges.length > 0) D.error("Expecting zero edges");

	var temp = query.select.name;
	query.select.name = 0;
	var list = CUBE.setOP(query).list;
	query.select.name = temp;

	var output = [];
	for(var i = 0; i < list.length; i++){
		output.push(list[i][0]);
	}//for
	return output;
};//method


CUBE.calc2Cube = function(query){
	if (query.edges===undefined) query.edges=[];

	if (query.edges.length==0){
		CUBE.aggOP(query);
		yield (query);
	}//endif

	yield (CUBE.calc2Tree(query));

	//ASSIGN dataIndex TO ALL PARTITIONS
	var edges = query.edges;
	for(var f = 0; f < edges.length; f++){
		var p = 0;
		for(; p < (edges[f].domain.partitions).length; p++){
			edges[f].domain.partitions[p].dataIndex = p;
		}//for
		edges[f].domain.NULL.dataIndex = p;
	}//for

	//MAKE THE EMPTY DATA GRID
	query.cube = CUBE.cube.newInstance(edges, 0, query.select);

	CUBE.Tree2Cube(query, query.cube, query.tree, 0);

	yield (query);
};//method



//CONVERT LIST TO CUBE
CUBE.List2Cube=function(query){

	if (query.list!==undefined) D.error("Can only convert list to a cube at this time");

	//ASSIGN dataIndex TO ALL PARTITIONS
	var edges = query.edges;
	for(var f = 0; f < edges.length; f++){
		var p = 0;
		for(; p < (edges[f].domain.partitions).length; p++){
			edges[f].domain.partitions[p].dataIndex = p;
		}//for
		edges[f].domain.NULL.dataIndex = p;
	}//for

	//MAKE THE EMPTY DATA GRID
	query.cube = CUBE.cube.newInstance(edges, 0, query.select);


	for(var i=query.list.length;i--;){
		var cube=query.cube;
		var e=0;
		for(;e<query.edges.length-1;e++){
			cube=cube[edges[e].dataIndex];
		}//for
		if (query.select instanceof Array){
			cube[edges[e].dataIndex]=query.list[i];
		}else{
			cube[edges[e].dataIndex]=query.list[i][query.select.name];
		}//endif
	}//for

	return query;
};//method


////////////////////////////////////////////////////////////////////////////////
//  REDUCE ALL DATA TO ZERO DIMENSIONS
////////////////////////////////////////////////////////////////////////////////
CUBE.aggOP=function(query){
	var select = CUBE.select2Array(query.select);

	var sourceColumns = CUBE.getColumns(query.from);
	var columns = CUBE.compile(query, sourceColumns);
	var where = CUBE.where.compile(query.where, sourceColumns, []);

	var result={};
	//ADD SELECT DEFAULTS
	for(var s = 0; s < select.length; s++){
		result[select[s].name] = select[s].defaultValue();
	}//for

	var indexedOutput = {};
	for(var i = 0; i < query.from.length; i++){
		var row = query.from[i];
		if (where(row, null)){
			for(var s = 0; s < select.length; s++){
				var ss = select[s];
				var v = ss.calc(row, result);
				result[ss.name] = ss.add(result[ss.name], v);
			}//for
		}//endif
	}//for

	//TURN AGGREGATE OBJECTS TO SINGLE NUMBER
	for(var c in columns){
		var s=columns[c];
		if (s.domain===undefined){
			D.error("expectin all columns to have a domain");
		}//endif
		var r = columns[c].domain.end;
		if (r === undefined) continue;

		result[s.name] = r(result[s.name]);
	}//for

	query.list = [result];
	query.cube = result;
	return query;
};




////////////////////////////////////////////////////////////////////////////////
//  SIMPLE TRANSFORMATION ON A LIST OF OBJECTS
////////////////////////////////////////////////////////////////////////////////
CUBE.setOP = function(query){
	var sourceColumns = CUBE.getColumns(query.from);
	var columns = {};

	var select = CUBE.select2Array(query.select);

	for(var s = 0; s < select.length; s++){
		columns[select[s].name] = select[s];
		CUBE.column.compile(sourceColumns, select[s], undefined);
	}//for
	var where = CUBE.where.compile(query.where, sourceColumns, []);

	var output = [];
	for(var t = 0; t < query.from.length; t++){
		var result = {};
		for(var s = 0; s < select.length; s++){
			var ss = select[s];
			result[ss.name] = ss.calc(query.from[t], null);
		}//for
		if (where(query.from[t], result)){
			output.push(result);
		}//endif
	}//for


	//ORDER THE OUTPUT
	if (query.sort === undefined) query.sort = [];
	output = CUBE.sort(output, query.sort, columns);

	query.list = output;
	return query;

};//method


////////////////////////////////////////////////////////////////////////////////
// TABLES ARE LIKE LISTS, ONLY ATTRIBUTES ARE INDEXED BY COLUMN NUMBER
////////////////////////////////////////////////////////////////////////////////
CUBE.toTable=function(query){

	if (query.cube===undefined) D.error("Can only turn a cube into a table at this time");
	if (query.edges.length!=2) D.error("can only handle 2D cubes right now.");

	var columns=[];
	var parts=[];
	var f="<CODE>";
	var param=[];
	var coord="";
	for(var w=0;w<query.edges.length;w++){
		f=f.replace("<CODE>","for(var p"+w+"=0;p"+w+"<parts["+w+"].length;p"+w+"++){\n<CODE>}\n");
		param.push("parts["+w+"][p"+w+"]");
		coord+="[p"+w+"]";

		columns[w]=query.edges[w];
		var d=query.edges[w].domain;
		if (d.end===undefined) d.end=function(part){return part;};
		parts[w]=[];
		d.partitions.forall(function(v,i){parts[w][i]=d.end(v);});
		if (query.edges[w].allowNulls) parts[w].push(d.end(d.NULL));
	}//for

	CUBE.select2Array(query.select).forall(function(s, i){
		columns.push(s);
		param.push("query.cube"+coord+((query.select instanceof Array) ? "["+i+"]" : ""));
	});

	var output=[];
	f=f.replace("<CODE>", "var row=["+param.join(", ")+"];\noutput.push(row);\n");
	eval(f);

	return {"columns":columns, "rows":output};

};//method


CUBE.Cube2List=function(query){
	var name=CUBE.select2Array(query.select)[0].name;
	if (query.select instanceof Array) name=undefined;


	if (query.cube===undefined) D.error("Can only turn a cube into a table at this time");

	var output=[];
	if (query.edges.length==2){
		if (!(typeof(query.cube[0][0])+"").startsWith("[object")) name=CUBE.select2Array(query.select)[0].name;  //ES QUERIES WILL RETURN A VALUE, NOT A TUPLE
		var parts0=query.edges[0].domain.partitions.copy();
		if (query.edges[0].allowNulls) parts0.push(query.edges[0].domain.NULL);
		var parts1=query.edges[1].domain.partitions.copy();
		if (query.edges[1].allowNulls) parts1.push(query.edges[1].domain.NULL);

		for(var p0=0;p0<parts0.length;p0++){
			for(var p1=0;p1<parts1.length;p1++){
				var row={};
				if (name===undefined){
					row=Util.copy(query.cube[p0][p1], row);
				}else{
					row[name]=query.cube[p0][p1];
				}//endif
				row[query.edges[0].name]=query.edges[0].domain.end(parts0[p0]);
				row[query.edges[1].name]=query.edges[1].domain.end(parts1[p1]);
				output.push(row);
				if (output.length%1000==0) yield(aThread.yield());
			}//for
		}//for
		yield (output);
	}else if (query.edges.length==1){
		if (!(typeof(query.cube[0])+"").startsWith("[object")) name=CUBE.select2Array(query.select)[0].name;  //ES QUERIES WILL RETURN A VALUE, NOT A TUPLE
		var parts0=query.edges[0].domain.partitions.copy();
		if (query.edges[0].allowNulls) parts0.push(query.edges[0].domain.NULL);

		for(var p0=0;p0<parts0.length;p0++){
			var row;
			if (name===undefined){
				row=Util.copy(query.cube[p0], {});
			}else{
				row={};
				row[name]=query.cube[p0];
			}//endif
			row[query.edges[0].name]=parts0[p0].value;  //ONLY FOR default DOMAIN
			output.push(row);
			if (output.length%1000==0)
				yield(aThread.yield());
		}//for
		yield (output);
	}else{
		D.error("can only handle 2D cubes right now.");
	}//endif
};//method



////////////////////////////////////////////////////////////////////////////////
// ASSUME THE FIRST DIMESION IS THE COHORT, AND NORMALIZE (DIVIDE BY SUM(ABS(Xi))
////////////////////////////////////////////////////////////////////////////////
CUBE.normalizeByCohort=function(query, multiple){
	if (multiple===undefined) multiple=1.0;
	if (query.cube===undefined) D.error("Can only normalize a cube into a table at this time");

//	SELECT
//		count/sum(count over Cohort) AS nCount
//	FROM
//		query.cube

	for(var c=0;c<query.cube.length;c++){
		var total=0;
		for(var e=0;e<query.cube[c].length;e++) total+=Math.abs(query.cube[c][e]);
		if (total!=0){
			for(var e=0;e<query.cube[c].length;e++) query.cube[c][e]*=(multiple/total);
		}//endif
	}//for
};//method

////////////////////////////////////////////////////////////////////////////////
// ASSUME THE SECOND DIMESION IS THE XAXIS, AND NORMALIZE (DIVIDE BY SUM(ABS(Ci))
////////////////////////////////////////////////////////////////////////////////
CUBE.normalizeByX=function(query, multiple){
	if (multiple===undefined) multiple=1;
	if (query.cube===undefined) D.error("Can only normalize a cube into a table at this time");

//	SELECT
//		count/sum(count over Cohort) AS nCount
//	FROM
//		query.cube

	for(var e=0;e<query.cube[0].length;e++){
		var total=0;
		for(var c=0;c<query.cube.length;c++){
			if (query.cube[c][e]===undefined) query.cube[c][e]=0;
			total+=Math.abs(query.cube[c][e]);
		}//for
		if (total!=0){
			for(var c=0;c<query.cube.length;c++) query.cube[c][e]*=(multiple/total);
		}//endif
	}//for
};//method





// CONVERT THE tree STRUCTURE TO A FLAT LIST FOR output
CUBE.Tree2List = function(output, tree, select, edges, coordinates, depth){
	if (depth == edges.length){
		//FRESH OBJECT
		var obj={};
		Util.copy(coordinates, obj);
		for(var s=0;s<select.length;s++){
			obj[select[s].name]=tree[s];
		}//for
		output.push(obj);
	} else{
		var keys = Object.keys(tree);
		for(var k = 0; k < keys.length; k++){
			coordinates[edges[depth].name]=edges[depth].domain.getPartByKey(keys[k]);
			CUBE.Tree2List(output, tree[keys[k]], select, edges, coordinates, depth + 1)
		}//for
	}//endif
//	yield (null);
};//method




// CONVERT THE tree STRUCTURE TO A cube
CUBE.Tree2Cube = function(query, cube, tree, depth){
	var edge=query.edges[depth];
	var domain=edge.domain;

	if (depth < query.edges.length-1){
		var keys=Object.keys(tree);
		for(var k=keys.length;k--;){
			var p=domain.getPartByKey(keys[k]).dataIndex;
			CUBE.Tree2Cube(query, cube[p], tree[keys[k]], depth+1);
		}//for
		return;
	}//endif

	if (query.select instanceof Array){
		var keys=Object.keys(tree);
		for(var k=keys.length;k--;){
			var p=domain.getPartByKey(keys[k]).dataIndex;
			var tuple={};
			for(var s = 0; s < query.select.length; s++){
				tuple[query.select[s].name] = tree[keys[k]][s];
			}//for
			cube[p]=tuple;
		}//for
	} else{
		var keys=Object.keys(tree);
		for(var k=keys.length;k--;){
			var p=domain.getPartByKey(keys[k]).dataIndex;
			cube[p]=tree[keys[k]][0];
		}//for
	}//endif

};//method




////ADD THE MISSING DOMAIN VALUES
//CUBE.nullToList=function(output, edges, depth){
//	if ()
//
//
//};//method




// PULL COLUMN DEFINITIONS FROM LIST OF OBJECTS
CUBE.getColumns = function(data){
	var output = [];
	for(var i = 0; i < (data).length; i++){
		var keys = Object.keys(data[i]);
		kk: for(var k = 0; k < (keys).length; k++){
			for(var c = 0; c < (output).length; c++){
				if (output[c].name == keys[k]) continue kk;
			}//for
			output.push({"name":keys[k]});
		}//for
	}//for
	return output;
};//method


//({
//	"domain":{"name":"category"},
//	"partitions":[
//		{"value":"Request", "from":requested, "edges":["time"]},
//		{"value":"Review", "from":reviewed, "edges":["time"]},
//		{"value":"Still Open", "from":open, "edges":["time"]}
//	]
//});
CUBE.join=function(query){
	var newEdge={
		"name":query.domain.name,
		"domain":{
			"name":query.domain.name,
			"type":"default",
			"partitions":query.partitions.map(function(v, i){return {"name":v.value, "value":v.value, "dataIndex":i};}),
			"end":function(p){return p.value}
		}
	};

	//MAP THE EDGE NAMES TO ACTUAL EDGES IN THE from QUERY
	query.partitions.forall(function(p){
		if (p.edges.length!=p.from.edges.length) D.error("do not know how to join partial edges");

		p.edges.forall(function(pe, i, edges){
			p.from.edges.forall(function(pfe, j){
				if (pfe.name==pe) edges[i]=pfe;
			});//for
		});
	});

	var commonEdges=query.partitions[0].edges;

	var output={};
	output.edges=[newEdge];
	output.edges.appendArray(commonEdges);
	output.cube=[];

	query.partitions.forall(function(p, index){
		//VERIFY DOMAINS ARE IDENTICAL
		if (p.edges.length!=commonEdges.length) D.error("Expecting all partitions to have same number of (common) edges declared");
		p.edges.forall(function(pe, i){
			if (typeof(pe)=="string") D.error("can not find edge named '"+pe+"'");
			if (!CUBE.domain.equals(commonEdges[i].domain, p.edges[i].domain)) D.error("Edges domains ("+p.value+", edge="+pe.name+") and ("+query.partitions[0].value+", edge="+commonEdges[i].name+") are different");
		});

		//REFER TO
		if (p.from.cube!==undefined){
			output.cube[index]=p.from.cube;
		}else if (p.from.list!==undefined){
			output.cube[index]=CUBE.List2Cube(p.from).cube;
		}else{
			D.error("do not know how to handle");
		}//endif
	});

//	output.select=query.partitions[0].from.select;	//I AM TIRED, JUST MAKE A BUNCH OF ASSUMPTIONS

	return output;
};//method





////////////////////////////////////////////////////////////////////////////////
// ORDERING
////////////////////////////////////////////////////////////////////////////////
//TAKE data LIST OF OBJECTS AND ENSURE names ARE ORDERED
CUBE.sort = function(data, sortOrder, columns){

	var orderedColumns=sortOrder.map(function(v, i){
		return columns[v];
	});

	var totalSort = function(a, b){
		for(var o = 0; o < orderedColumns.length; o++){
			var col=orderedColumns[o];
			if (col.domain === undefined){
				D.warning("what?");
			}

			var diff = col.domain.compare(a[col.name], b[col.name]);
			if (diff != 0) return col.sortOrder * diff;
		}//for
		return 0;
	};

	data.sort(totalSort);

	return data;
};//method

