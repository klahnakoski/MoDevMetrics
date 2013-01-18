/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// MAKE A CUBE OF DEFAULT VALUES
CUBE.cube = {};

CUBE.cube.newInstance = function(edges, depth, select){
	if (depth == edges.length){
		var element={};
//		var element=[]
		if (select instanceof Array){
			for(var s = 0; s < select.length; s++){
				element[select[s].name] = select[s].defaultValue();
//				element[s] = select[s].defaultValue();
			}//for
		} else{
			element = select.defaultValue();
		}//endif
		return element;
	}//for

	var data = [];
	var p = 0;
	for(; p < edges[depth].domain.partitions.length; p++){
		data[p] = CUBE.cube.newInstance(edges, depth + 1, select);
	}//for
//	if (edges[depth].domain.partitions.length==0 || edges[depth].allowNulls){
	if (edges[depth].allowNulls){
		data[p]= CUBE.cube.newInstance(edges, depth + 1, select);
	}//endif
	return data;
};//method



//PROVIDE THE SAME EDGES, BUT IN DIFFERENT ORDER
CUBE.cube.transpose = function(query, edges, select){
	//MAKE COMBO MATRIX
	var smap = CUBE.cube.transpose.remap(query.select, select);
	var fmap = CUBE.cube.transpose.remap(query.edges, edges);

	//ENSURE THE CUBE HAS ALL DIMENSIONS
	var cube = CUBE.cube.newInstance(edges, 0, []);

	var loops = "";
	var ends = "";
	var source = "var s=query.cube";
	var dest = "var d=cube";

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
		"cube":cube
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


CUBE.cube.toList=function(query){

	var output=[];
	if (query.edges.length==1){
		var parts=query.edges[0].domain.partitions;
		for(var p=parts.length;p--;){
			var obj={};
			obj[query.edges[0].name]=parts[p].value;

			if (query.select instanceof Array){
				for(var s=query.select.length;s--;){
					//I FORGET IF ELEMENTS IN CUBE ARE OBJECTS, OR ARRAYS
					obj[query.select[s].name]=query.cube[p][s];
//					obj[cube.select[s].name]=cube.cube[cube.select[s].name];
				}//for
			}else{
				obj[query.select.name]=query.cube[p];
			}//endif
			output.push(obj);
		}//for
	}else{
		D.error("can only convert 1D cubes");
	}//endif

	return output;
};//method



// UNION THE CUBES, AND ADD PARTITIONS AS NEEDED
CUBE.cube.union=function(cubeA, cubeB){
	//ENSURE NAMES MATCH SO MERGE IS POSSIBLE
	if (cubeA.edges.length!=cubeB.edges.length) D.error("Expecting cubes to have smae number of edges, with matching names");
	for(var i=cubeA.edges.length;i--;){
		if (cubeA.edges[i].name!=cubeB.edges[i].name) D.error("Expecting both cubes to have edges in the same order");
	}//for

		





};//method

