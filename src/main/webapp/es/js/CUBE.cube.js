// MAKE A CUBE OF DEFAULT VALUES
CUBE.cube = {};

CUBE.cube.newInstance = function(edges, depth, select){
	var data = [];
	if (depth == edges.length){
		if (select instanceof Array){
			for(var s = 0; s < select.length; s++){
				data[s] = select[s].defaultValue();
			}//for
		} else{
			data = select.defaultValue();
		}//endif
		return data;
	}//for

	var p = 0;
	for(; p < (edges[depth].domain.partitions).length; p++){
		data[p] = CUBE.cube.newInstance(edges, depth + 1, select);
	}//for
	if (edges[depth].allowNulls){
		data[p]= CUBE.cube.newInstance(edges, depth + 1, select);
	}//endif
	return data;
};//method



//PROVIDE THE SAME EDGES, BUT IN DIFFERENT ORDER
CUBE.cube.transpose = function(cube, edges, select){
	//MAKE COMBO MATRIX
	var smap = CUBE.cube.transpose.remap(cube.select, select);
	var fmap = CUBE.cube.transpose.remap(cube.edges, edges);

	//ENSURE THE CUBE HAS ALL DIMENSIONS
	var data = CUBE.cube.newInstance(edges, 0, []);

	var loops = "";
	var ends = "";
	var source = "var s=cube.data";
	var dest = "var d=data";

	for(var i = 0; i < edges.length; i++){
		loops += "for(var a" + i + " in cube.edges[" + i + "].domain.partitions){\n";
		ends += "}\n";
		source += "[cube.edges[" + i + "].domain.partitions[a" + i + "]]";
		dest += "[edges[" + i + "].domain.partitions[a" + fmap[i] + "]]";
	}//for
	var f = loops +
		source + ";\n" +
		dest + ";\n" +
		"for(var i=0;i<select.length;i++) d[i]=s[smap[i]];\n" +
		ends;
	eval(f);

	return {
		"edges":edges,
		"select":select,
		"data":data
	}

};//method

//MAKE THE MAP ARRAY FROM NEW TO OLD COLUMN INDICIES
//newColumns[i]==oldColumns[smap[i]]
CUBE.cube.transpose.remap = function(oldColumns, newColumns){
	var smap = [];
	for(var snew = 0; snew < newColumns.length; snew++){
		for(var sold = 0; sold < oldColumns.length; sold++){
			if (newColumns[snew].name == oldColumns[sold].name) smap[snew] = sold;
		}//for
	}//for
	for(var s = 0; s < newColumns.length; s++) if (smap[i]===undefined) D.error("problem remapping columns, '"+newColumns[snew].name+"' can not be found in old columns");
	return smap;
};//method


// UNION THE CUBES, AND ADD PARTITIONS AS NEEDED
CUBE.cube.union=function(cubeA, cubeB){
	//ENSURE NAMES MATCH SO MERGE IS POSSIBLE
	if (cubeA.edges.length!=cubeB.edges.length) D.error("Expecting cubes to have smae number of edges, with matching names");
	for(var i=cubeA.edges.length;i--;){
		if (cubeA.edges[i].name!=cubeB.edges[i].name) D.error("Expecting both cubes to have edges in the same order");
	}//for

		





};//method

