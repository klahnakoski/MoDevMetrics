CUBE.analytic={};

CUBE.analytic.ROWNUM="__rownum";


CUBE.analytic.add=function(query, analytic){
	CUBE.analytic.calc(query, analytic);
};//method




//from IS AN ARRAY OF TUPLES
//sourceColumns IS AN ARRAY OF COLUMNS DEFINING THE TUPLES IN from
CUBE.analytic.calc = function(query, analytic){
	var edges = analytic.edges;
	var sourceColumns=query.columns;
	var from=query.list;
	
	//FILL OUT THE ANALYTIC A BIT MORE
	if (analytic.name===undefined) analytic.name=analytic.value.split(".").last();
	sourceColumns.forall(function(v){ if (v.name==analytic.name) D.error("All columns must have different names");});
	analytic.columnIndex=sourceColumns.length;
	sourceColumns[analytic.columnIndex] = analytic;
	CUBE.analytic.compile(sourceColumns, analytic, query.edges, false);

//	sourceColumns=sourceColumns.copy();

//	var columns={};
//	sourceColumns.forall(function(v, i){
//		columns[v.name]=v;
//	});

	var allGroups=[];
	if (edges.length==0){
		//ONLY ONE GROUP
		allGroups.push(from);
	}else{
		var tree = {};  analytic.tree=tree;
		for(var i = from.length; i --;){
			var row = from[i];

			//FIND RESULT IN tree
			var trunk = analytic.tree;
			for(var f = 0; f < edges.length; f++){
				var branch=trunk[row[edges[f]]];

				if (branch===undefined){
					if (f==edges.length-1){
						branch=[];
						allGroups.push(branch);
					}else{
						branch={};
					}//endif
					trunk[row[edges[f]]]=branch;
				}//endif
				trunk=branch;
			}//for
			trunk.push(row);
		}//for
	}//endif
//	yield (aThread.yield());

	//SORT
	var sortFunction;
	if (analytic.sort){
		if (!(analytic.sort instanceof Array)) analytic.sort=[analytic.sort];
		sortFunction=CUBE.sort.compile(analytic.sort, sourceColumns, true);
	}//endif

	for(var g=allGroups.length;g--;){
		var group=allGroups[g];
		if (sortFunction) group.sort(sortFunction);

		for(var rownum=group.length;rownum--;){
			group[rownum][CUBE.analytic.ROWNUM]=rownum;
		}//for
	}//for


	//PERFORM CALC
	for(var i=from.length;i--;){
		from[i][analytic.name]=analytic.calc(from[i][CUBE.analytic.ROWNUM], from[i]);
		from[i][CUBE.analytic.ROWNUM]=undefined;	//CLEANUP
	}//for

};


CUBE.analytic.compile = function(sourceColumns, resultColumn, edges){
	if (resultColumn.value === undefined) D.error("Expecting "+resultColumn.name+" to have a value");

//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
	var f = "resultColumn.calc=function(rownum, __source){\n";
	for(var s = 0; s < sourceColumns.length; s++){
		var columnName = sourceColumns[s].name;
//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(columnName) != -1){
			f += "var " + columnName + "=__source." + columnName + ";\n";
		}//endif
	}//for
	f +=
		"var output;\n" +
			"try{ " +
			" output=" + resultColumn.value + "; " +
			" if (output===undefined) D.error(\"" + resultColumn.name + " returns undefined\");\n" +
			" return output;\n" +
			"}catch(e){\n" +
			" D.error(\"Problem with definition of name=\\\"" + resultColumn.name + "\\\" value=" + CNV.String2Quote(CNV.String2Quote(resultColumn.value)).leftBut(1).rightBut(1) + " when operating on __source=\"+CNV.Object2JSON(__source), e)+\" "+
			"Are you trying to get an attribute value from a NULL part?\"" +
			"}}";
	try{
		eval(f);
	} catch(e){
		D.error("can not compile " + f, e);
	}//try
};//method
