var SQL = function(){
};


SQL.compile = function(query, sourceColumns){
//COMPILE COLUMN CALCULATION CODE
	var resultColumns = {};

	var facets = query["facets"];
	for(var g = 0; g < facets.length; g++){
		if (facets[g].allowNulls === undefined) facets[g].allowNulls = false;
		resultColumns[facets[g].name] = facets[g];
		SQL.column.compile(sourceColumns, facets[g]);
		SQL.domain.compile(sourceColumns, facets[g]);
		facets[g].outOfDomainCount = 0;
	}//for

	var select = SQL.select2Array(query.select);
	for(var s = 0; s < select.length; s++){
		resultColumns[select[s].name] = select[s];
		SQL.column.compile(sourceColumns, select[s], facets);
		SQL.aggregate.compile(select[s]);
	}//for

	return resultColumns;
};

//MAP SELECT CLAUSE TO AN ARRAY OF SELECT COLUMNS
SQL.select2Array = function(select){
	if (select === undefined) return [];
	if (!(select instanceof Array)) return [select];
	return select;
};//method


SQL.prototype.calc2List = function(query){

	//NO FACETS IMPLIES NO AGGREGATION AND NO GROUPING:  SIMPLE SET OPERATION
	if (query.facets === undefined || query.facets.length == 0){
		return this.setOP(query);
	}//endif

	var sourceColumns = SQL.getColumns(query.from);
	var select = SQL.select2Array(query.select);
	var facets = query.facets;
	var resultColumns = SQL.compile(query, sourceColumns);
	var where = SQL.where.compile(query.where, sourceColumns, facets);


	var indexedOutput = {};
	FROM: for(var i = 0; i < query.from.length; i++){
		var row = query.from[i];

		//CALCULATE THE GROUP COLUMNS TO PLACE RESULT
		var results = [
			{}
		];
		for(var f = 0; f < facets.length; f++){
			var facet = facets[f];
			var v = facet.calc(row, null);


			if (facet.domain.getPartition !== undefined){
				//STANDARD 1-1 MATCH VALUE TO DOMAIN
				var p = facet.domain.getPartition(v);
				if (p === undefined){
					D.error("getPartition() must return a partition, or null");
				}//endif
				if (p == null){
					facet.outOfDomainCount++;
					if (facet.allowNulls){
						for(var t = results.length; t--;){
							results[t][facet.name] = facet.domain.NULL;
						}//for
					} else{
//							results=[];
						continue FROM;
					}//endif
				} else{
					for(var t = results.length; t--;) results[t][facet.name] = p;
				}//endif
			} else{
				//MULTIPLE MATCHES EXIST
				var partitions = facet.domain.getPartitions(row);
				if (partitions.length == 0){
					facet.outOfDomainCount++;
					if (facet.allowNulls){
						for(var t = results.length; t--;){
							results[t][facet.name] = facet.domain.NULL;
						}//for
					} else{
//							results=[];
						continue FROM;
					}//endif
				} else{
					for(var t = results.length; t--;){
						result = results[t];
						result[facet.name] = partitions[0];
						for(var p = 1; p < partitions.length; p++){
							result = Util.copy(result, {});
							results.push(result);
							result[facet.name] = partitions[p];
						}//for
					}//for
				}//endif
			}//endif
		}//for


		if (select.length == 0){
			for(var t = 0; t < results.length; t++){
				if (where(row, results[t])) SQL.addResultToOutput(results[t], indexedOutput, select, facets);
			}//for
		} else{
			for(var s = 0; s < (select).length; s++){
				var ss = select[s];
				for(var t = 0; t < results.length; t++){
					//FIND CANONICAL RESULT
					result = SQL.addResultToOutput(results[t], indexedOutput, select, facets);
					if (where(row, results[t])){
						//CALCULATE VALUE
						var v = ss.calc(row, result);

						//ADD TO THE AGGREGATE VALUE
						result[ss.name] = ss.add(result[ss.name], v);
					}//endif

				}//for
			}//for
		}//endif
	}//for

	for(var g = 0; g < facets.length; g++){
		if (facets[g].outOfDomainCount > 0) D.warning(facets[g].name + " has " + facets[g].outOfDomainCount + " records outside domain " + facets[g].domain.name);
	}//for


	var output = [];
	SQL.outputToList(output, indexedOutput, facets, 0, query.order);


	//ORDER THE OUTPUT
	if (query.order === undefined){
		query.order = [];
		for(var f = 0; f < facets.length; f++) query.order.push(facets[f].name);
	}//endif
	output = SQL.order(output, query.order, resultColumns);

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


SQL.prototype.calc2Array = function(sql){
	if (sql.select instanceof Array) D.error("Expecting select to not be an array");
	if (sql.facets !== undefined && sql.facets.length > 0) D.error("Expecting zero facets");

	var temp = sql.select.name;
	sql.select.name = 0;
	var list = new SQL().setOP(sql).list;
	sql.select.name = temp;

	var output = [];
	for(var i = 0; i < list.length; i++){
		output.push(list[i][0]);
	}//for
	return output;
};//method


SQL.prototype.calc2Cube = function(query){
	var cube = this.calc2List(query);

	//ASSIGN dataIndex TO ALL PARTITIONS
	var facets = query.facets;
	for(var f = 0; f < facets.length; f++){
		var p = 0;
		for(; p < (facets[f].domain.partitions).length; p++){
			facets[f].domain.partitions[p].dataIndex = p;
		}//for
		if (facets[f].allowNulls) facets[f].domain.NULL.dataIndex = p;
	}//for

	//MAKE THE EMPTY DATA GRID
	var data = SQL.cube.newInstance(facets, 0, query.select);

	//FILL GRID WITH VALUES
	for(var o = 0; o < cube.list.length; o++){
		var result = cube.list[o];
		var value = data;
		var f = 0;

		if (query.select instanceof Array){
			for(; f < facets.length; f++){
				value = value[result[facets[f].name].dataIndex];
			}//for
			for(var s = 0; s < query.select.length; s++){
				value[s] = result[query.select[s].name];
			}//for
		} else{
			for(; f < facets.length - 1; f++){
				value = value[result[facets[f].name].dataIndex];
			}//for
			value[result[facets[f].name].dataIndex] = result[query.select.name];
		}//endif
	}//for

	query.data = data;
	return query;
};//method



////////////////////////////////////////////////////////////////////////////////
//  SIMPLE TRANSFORMATION ON A LIST OF OBJECTS
////////////////////////////////////////////////////////////////////////////////
SQL.prototype.setOP = function(query){
	var sourceColumns = SQL.getColumns(query.from);
	var resultColumns = {};

	var select = SQL.select2Array(query.select);

	for(var s = 0; s < select.length; s++){
		resultColumns[select[s].name] = select[s];
		SQL.column.compile(sourceColumns, select[s], undefined);
	}//for
	var where = SQL.where.compile(query.where, sourceColumns, []);

	var output = [];
	for(var t = 0; t < query.from.length; t++){
		var result = {};
		for(var s = 0; s < select.length; s++){
			var ss = select[s];
			if (where(query.from[t], {})){
				result[ss.name] = ss.calc(query.from[t], null);
			}//endif
		}//for
		output.push(result);
	}//for


	//ORDER THE OUTPUT
	if (query.order === undefined) query.order = [];
	output = SQL.order(output, query.order, resultColumns);

	query.list = output;
	return query;

};//method


////////////////////////////////////////////////////////////////////////////////
// TABLES ARE LIKE LISTS, ONLY ATTRIBUTES ARE INDEXED BY COLUMN NUMBER
////////////////////////////////////////////////////////////////////////////////
SQL.toTable=function(query){

	if (query.data===undefined) D.error("Can only turn a cube into a table at this time");
	if (query.facets.length!=2) D.error("can only handle 2D cubes right now.");

	var parts0=query.facets[0].domain.partitions.copy();
	if (query.facets[0].allowNulls) parts0.push(query.facets[0].domain.NULL);
	var parts1=query.facets[1].domain.partitions.copy();
	if (query.facets[1].allowNulls) parts1.push(query.facets[1].domain.NULL);

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
// ASSUME THE FIRST DIMESION IS THE COHORT, AND NORMALIZE
////////////////////////////////////////////////////////////////////////////////
SQL.normalizeByCohort=function(query){
	if (query.data===undefined) D.error("Can only normalize a cube into a table at this time");

	for(var c=0;c<query.data.length;c++){
		var total=0;
		for(var e=0;e<query.data[c].length;e++) total+=query.data[c][e];
		if (total==0) total=1;
		for(var e=0;e<query.data[c].length;e++) query.data[c][e]/=total;
	}//for
};//method

// CONVERT THE indexed OBJECT TO A FLAT LIST FOR output
SQL.outputToList = function(output, indexed, facets, depth, order){
	if (depth == facets.length){
		output.push(indexed);
	} else{
		var keys = Object.keys(indexed);
		for(var k = 0; k < keys.length; k++){
			SQL.outputToList(output, indexed[keys[k]], facets, depth + 1)
		}//for
	}//endif
};//method

////ADD THE MISSING DOMAIN VALUES
//SQL.nullToList=function(output, facets, depth){
//	if ()
//
//
//};//method


SQL.addResultToOutput = function(result, output, select, facets){

	//FIND RESULT IN output
	//output IS A TREE INDEXED BY THE PARTITION CANONICAL VALUES
	var depth = output;
	for(var i = 0; i < facets.length - 1; i++){
		var part=result[facets[i].name];
		var v = facets[i].domain.getKey(part);
		if (depth[v] === undefined) depth[v] = {};
		depth = depth[v];
	}//for
	part=result[facets[i].name];
	if (part == null){
		D.println("what?");
	}//endif
	v = facets[i].domain.getKey(part);
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
SQL.getColumns = function(data){
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
SQL.order = function(data, ordering, columns){

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

