

// MAKE A CUBE OF DEFAULT VALUES
SQL.cube={};

SQL.cube.newInstance=function(facets, depth, select){
	var data=[];
	if (depth==facets.length){
		if (select instanceof Array){
			for(var s in select){
				data[s]=select[s].defaultValue();
			}//for
		}else{
			data=select.defaultValue();
		}//endif
		return data;
	}//for

	for(p in facets[depth].domain.partitions){
		data[p]=SQL.cube.newInstance(facets, depth+1, select);
	}//for
	return data;
};//method



//PROVIDE THE SAME FACETS, BUT IN DIFFERENT ORDER
SQL.cube.transpose=function(cube, facets, select){
	//MAKE COMBO MATRIX
	var smap=SQL.cube.transpose.remap(cube.select, select);
	var fmap=SQL.cube.transpose.remap(cube.facets, facets);

	//ENSURE THE CUBE HAS ALL DIMENSIONS
	var data=SQL.cube.newInstance(facets, 0, []);

	var loops="";
	var ends="";
	var source="var s=cube.data";
	var dest="var d=data";

	for(var i in facets){
		loops+="for(var a"+i+" in cube.facets["+i+"].domain.partitions){\n";
		ends+="}\n";
		source+="[cube.facets["+i+"].domain.partitions[a"+i+"]]";
		dest+="[facets["+i+"].domain.partitions[a"+fmap[i]+"]]";
	}//for
	var f=loops+
		source+";\n"+
		dest+";\n"+
		"for(var i in select) d[i]=s[smap[i]];\n"+
		ends;
	eval(f);

	return {
		"facets":facets,
		"select":select,
		"data":data
	}

};//method

//MAKE THE MAP ARRAY FROM NEW TO OLD COLUMN INDICIES
//newColumns[i]==oldColumns[smap[i]]
SQL.cube.transpose.remap=function(oldColumns, newColumns){
	var smap=[];
	for(var snew in newColumns){
		for(var sold in oldColumns){
			if (newColumns[snew] == oldColumns[sold]) smap[snew] = sold;
		}//for
	}//for
	return smap;
};//method
