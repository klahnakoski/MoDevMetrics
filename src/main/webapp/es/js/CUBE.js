var CUBE = function(){
};


CUBE.compile = function(query, sourceColumns){
//COMPILE COLUMN CALCULATION CODE
	var resultColumns = {};

	var edges = query["edges"];
	for(var g = 0; g < edges.length; g++){
		if (edges[g].allowNulls === undefined) edges[g].allowNulls = false;
		resultColumns[edges[g].name] = edges[g];
		CUBE.column.compile(sourceColumns, edges[g]);
		CUBE.domain.compile(sourceColumns, edges[g]);
		edges[g].outOfDomainCount = 0;
	}//for

	var select = CUBE.select2Array(query.select);
	for(var s = 0; s < select.length; s++){
		resultColumns[select[s].name] = select[s];
		CUBE.column.compile(sourceColumns, select[s], edges);
		CUBE.aggregate.compile(select[s]);
	}//for

	return resultColumns;
};

//MAP SELECT CLAUSE TO AN ARRAY OF SELECT COLUMNS
CUBE.select2Array = function(select){
	if (select === undefined) return [];
	if (!(select instanceof Array)) return [select];
	return select;
};//method


CUBE.prototype.calc2List = function(query){
	if (query.edges===undefined) query.edges=[];
	var select = CUBE.select2Array(query.select);

	//NO EDGES IMPLIES NO AGGREGATION AND NO GROUPING:  SIMPLE SET OPERATION
	if (query.edges.length==0){
		if (select[0].operation===undefined){
			return this.setOP(query);
		}else{
			return this.aggOP(query);
		}//endif
	}//endif

	var sourceColumns = CUBE.getColumns(query.from);
	var edges = query.edges;
	var resultColumns = CUBE.compile(query, sourceColumns);
	var where = CUBE.where.compile(query.where, sourceColumns, edges);


	var indexedOutput = {};
	FROM: for(var i = 0; i < query.from.length; i++){
		var row = query.from[i];

		//CALCULATE THE GROUP COLUMNS TO PLACE RESULT
		var results = [
			{}
		];
		for(var f = 0; f < edges.length; f++){
			var edge = edges[f];


			if (edge.domain.getPartition !== undefined){
				var v = edge.calc(row, null);

				//STANDARD 1-1 MATCH VALUE TO DOMAIN
				var p = edge.domain.getPartition(v);
				if (p === undefined){
					D.error("getPartition() must return a partition, or null");
				}//endif
				if (p == null){
					edge.outOfDomainCount++;
					if (edge.allowNulls){
						for(var t = results.length; t--;){
							results[t][edge.name] = edge.domain.NULL;
						}//for
					} else{
//							results=[];
						continue FROM;
					}//endif
				} else{
					for(var t = results.length; t--;) results[t][edge.name] = p;
				}//endif
			} else{
				//MULTIPLE MATCHES EXIST
				var partitions = edge.domain.getPartitions(row);
				if (partitions.length == 0){
					edge.outOfDomainCount++;
					if (edge.allowNulls){
						for(var t = results.length; t--;){
							results[t][edge.name] = edge.domain.NULL;
						}//for
					} else{
//							results=[];
						continue FROM;
					}//endif
				} else{
					for(var t = results.length; t--;){
						result = results[t];
						result[edge.name] = partitions[0];
						for(var p = 1; p < partitions.length; p++){
							result = Util.copy(result, {});
							results.push(result);
							result[edge.name] = partitions[p];
						}//for
					}//for
				}//endif
			}//endif
		}//for


		if (select.length == 0){
			for(var t = 0; t < results.length; t++){
				if (where(row, results[t])) CUBE.addResultToOutput(results[t], indexedOutput, select, edges);
			}//for
		} else{
			for(var s = 0; s < (select).length; s++){
				var ss = select[s];
				for(var t = 0; t < results.length; t++){
					var pass=where(row, results[t]);
					if (pass){
						//FIND CANONICAL RESULT
						var result = CUBE.addResultToOutput(results[t], indexedOutput, select, edges);

						//CALCULATE VALUE
						var v = ss.calc(row, result);

						//ADD TO THE AGGREGATE VALUE
						result[ss.name] = ss.add(result[ss.name], v);
					}//endif

				}//for
			}//for
		}//endif
	}//for

	for(var g = 0; g < edges.length; g++){
		if (edges[g].outOfDomainCount > 0) D.warning(edges[g].name + " has " + edges[g].outOfDomainCount + " records outside domain " + edges[g].domain.name);
	}//for


	var output = [];
	CUBE.outputToList(output, indexedOutput, edges, 0, query.order);


	//ORDER THE OUTPUT
	if (query.order === undefined){
		query.order = [];
		for(var f = 0; f < edges.length; f++) query.order.push(edges[f].name);
	}//endif
	output = CUBE.order(output, query.order, resultColumns);

	//TURN AGGREGATE OBJECTS TO SINGLE NUMBER
	for(var c in resultColumns){
		var s=resultColumns[c];
		if (s.domain===undefined){
			D.error("expectin all columns to have a domain");
		}//endif
		var r = resultColumns[c].domain.end;
		if (r === undefined) continue;

		for(var i = 0; i < output.length; i++){
			var o = output[i];
			o[s.name] = r(o[s.name]);
		}//for
	}//for

	query.list = output;
	return query;
};//method


CUBE.prototype.calc2Array = function(sql){
	if (sql.select instanceof Array) D.error("Expecting select to not be an array");
	if (sql.edges !== undefined && sql.edges.length > 0) D.error("Expecting zero edges");

	var temp = sql.select.name;
	sql.select.name = 0;
	var list = new CUBE().setOP(sql).list;
	sql.select.name = temp;

	var output = [];
	for(var i = 0; i < list.length; i++){
		output.push(list[i][0]);
	}//for
	return output;
};//method


CUBE.prototype.calc2Cube = function(query){
	var cube = this.calc2List(query);

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
	var data = CUBE.cube.newInstance(edges, 0, query.select);

	//FILL GRID WITH VALUES
	OO: for(var o = 0; o < cube.list.length; o++){
		var result = cube.list[o];
		var value = data;
		var f = 0;

		var part=undefined;
		for(; f < edges.length - 1; f++){
			part=result[edges[f].name];
			if (part.dataIndex===undefined) part=edges[f].domain.getPartition(part);//DEFAULT DOMAIN DOES NOT RETURN PARTITION OBJECTS, SPECIAL DEREF REQUIRED
			if (part.dataIndex==value.length) continue OO; //NULL VALUE FOUND, BUT NOT TO BE REPORTED
			value = value[part.dataIndex];
		}//for
		part=result[edges[f].name];
		if (part.dataIndex===undefined) part=edges[f].domain.getPartition(part);//DEFAULT DOMAIN DOES NOT RETURN PARTITION OBJECTS, SPECIAL DEREF REQUIRED

		if (query.select instanceof Array){
			value = value[part.dataIndex];

			for(var s = 0; s < this.select.length; s++){
				value[s] = result[query.select[s].name];
			}//for
		} else{
			value[part.dataIndex] = result[query.select.name];
		}//endif
	}//for

	query.data = data;
	return query;
};//method



////////////////////////////////////////////////////////////////////////////////
//  REDUCE ALL DATA TO ZERO DIMENSIONS
////////////////////////////////////////////////////////////////////////////////
CUBE.prototype.aggOP=function(query){
	var select = CUBE.select2Array(query.select);

	var sourceColumns = CUBE.getColumns(query.from);
	var resultColumns = CUBE.compile(query, sourceColumns);
	var where = CUBE.where.compile(query.where, sourceColumns, []);

	var result={};
	//ADD SELECT DEFAULTS
	for(var s = 0; s < (select).length; s++){
		result[select[s].name] = select[s].defaultValue();
	}//for

	var indexedOutput = {};
	for(var i = 0; i < query.from.length; i++){
		var row = query.from[i];
		if (where(row, null)){
			for(var s = 0; s < (select).length; s++){
				var ss = select[s];
				var v = ss.calc(row, result);
				result[ss.name] = ss.add(result[ss.name], v);
			}//for
		}//endif
	}//for

	var output=[result];


	//TURN AGGREGATE OBJECTS TO SINGLE NUMBER
	for(var c in resultColumns){
		var s=resultColumns[c];
		if (s.domain===undefined){
			D.error("expectin all columns to have a domain");
		}//endif
		var r = resultColumns[c].domain.end;
		if (r === undefined) continue;

		result[s.name] = r(result[s.name]);
	}//for

	query.list = output;
	return query;
};




////////////////////////////////////////////////////////////////////////////////
//  SIMPLE TRANSFORMATION ON A LIST OF OBJECTS
////////////////////////////////////////////////////////////////////////////////
CUBE.prototype.setOP = function(query){
	var sourceColumns = CUBE.getColumns(query.from);
	var resultColumns = {};

	var select = CUBE.select2Array(query.select);

	for(var s = 0; s < select.length; s++){
		resultColumns[select[s].name] = select[s];
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
	if (query.order === undefined) query.order = [];
	output = CUBE.order(output, query.order, resultColumns);

	query.list = output;
	return query;

};//method


////////////////////////////////////////////////////////////////////////////////
// TABLES ARE LIKE LISTS, ONLY ATTRIBUTES ARE INDEXED BY COLUMN NUMBER
////////////////////////////////////////////////////////////////////////////////
CUBE.toTable=function(query){

	if (query.data===undefined) D.error("Can only turn a cube into a table at this time");
	if (query.edges.length!=2) D.error("can only handle 2D cubes right now.");

	var parts0=query.edges[0].domain.partitions.copy();
	if (query.edges[0].allowNulls) parts0.push(query.edges[0].domain.NULL);
	var parts1=query.edges[1].domain.partitions.copy();
	if (query.edges[1].allowNulls) parts1.push(query.edges[1].domain.NULL);

	var output=[];
	for(var p0=0;p0<parts0.length;p0++){
		for(var p1=0;p1<parts1.length;p1++){
			var row=[parts0[p0].name, parts1[p1].name, query.data[p0][p1]];
			output.push(row);
		}//for
	}//for
	return output;
};//method



////////////////////////////////////////////////////////////////////////////////
// ASSUME THE FIRST DIMESION IS THE COHORT, AND NORMALIZE (DIVIDE BY SUM(ABS(Xi))
////////////////////////////////////////////////////////////////////////////////
CUBE.normalizeByCohort=function(query, multiple){
	if (multiple===undefined) multiple=1.0;
	if (query.data===undefined) D.error("Can only normalize a cube into a table at this time");

//	SELECT
//		count/sum(count over Cohort) AS nCount
//	FROM
//		query.cube

	for(var c=0;c<query.data.length;c++){
		var total=0;
		for(var e=0;e<query.data[c].length;e++) total+=Math.abs(query.data[c][e]);
		if (total!=0){
			for(var e=0;e<query.data[c].length;e++) query.data[c][e]*=(multiple/total);
		}//endif
	}//for
};//method

////////////////////////////////////////////////////////////////////////////////
// ASSUME THE SECOND DIMESION IS THE XAXIS, AND NORMALIZE (DIVIDE BY SUM(ABS(Ci))
////////////////////////////////////////////////////////////////////////////////
CUBE.normalizeByX=function(query, multiple){
	if (multiple===undefined) multiple=1;
	if (query.data===undefined) D.error("Can only normalize a cube into a table at this time");

//	SELECT
//		count/sum(count over Cohort) AS nCount
//	FROM
//		query.cube

	for(var e=0;e<query.data[0].length;e++){
		var total=0;
		for(var c=0;c<query.data.length;c++) total+=Math.abs(query.data[c][e]);
		if (total!=0){
			for(var c=0;c<query.data.length;c++) query.data[c][e]*=(multiple/total);
		}//endif
	}//for
};//method





// CONVERT THE indexed OBJECT TO A FLAT LIST FOR output
CUBE.outputToList = function(output, indexed, edges, depth, order){
	if (depth == edges.length){
		output.push(indexed);
	} else{
		var keys = Object.keys(indexed);
		for(var k = 0; k < keys.length; k++){
			CUBE.outputToList(output, indexed[keys[k]], edges, depth + 1)
		}//for
	}//endif
};//method

////ADD THE MISSING DOMAIN VALUES
//CUBE.nullToList=function(output, edges, depth){
//	if ()
//
//
//};//method


CUBE.addResultToOutput = function(result, output, select, edges){

	//FIND RESULT IN output
	//output IS A TREE INDEXED BY THE PARTITION CANONICAL VALUES
	var depth = output;
	for(var i = 0; i < edges.length - 1; i++){
		var part=result[edges[i].name];
		var v = edges[i].domain.getKey(part);
		if (depth[v] === undefined) depth[v] = {};
		depth = depth[v];
	}//for
	part=result[edges[i].name];
	if (part == null){
		D.println("what?");
	}//endif
	v = edges[i].domain.getKey(part);
	if (depth[v] !== undefined) return depth[v];

	//ADD SELECT DEFAULTS
	for(var s = 0; s < (select).length; s++){
		result[select[s].name] = select[s].defaultValue();
	}//for

	//ADD NEW GROUP TO output
	depth[v] = result;

	return result;
};//method


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






////////////////////////////////////////////////////////////////////////////////
// ORDERING
////////////////////////////////////////////////////////////////////////////////
//TAKE data LIST OF OBJECTS AND ENSURE names ARE ORDERED
CUBE.order = function(data, ordering, columns){

	var totalSort = function(a, b){
		for(var o = 0; o < ordering.length; o++){
			if (columns[ordering[o]].domain === undefined){
				D.warning("what?");
			}

			var diff = columns[ordering[o]].domain.compare(a[ordering[o]], b[ordering[o]]);
			if (diff != 0) return columns[ordering[o]].sortOrder * diff;
		}//for
		return 0;
	};

	data.sort(totalSort);

	return data;
};//method

