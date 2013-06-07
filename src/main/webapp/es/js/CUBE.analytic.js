/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
if (CUBE===undefined) var CUBE = {};

CUBE.analytic={};

CUBE.analytic.ROWNUM="__rownum";
CUBE.analytic.ROWS="__rows";


CUBE.analytic.run=function(query){
	if (query.analytic){
		if (!(query.analytic instanceof Array)) query.analytic = [query.analytic];
		//ANALYTIC COLUMNS ARE ADDED IN ORDER SO EACH CAN REFER TO THE PREVIOUS
		for(var a = 0; a < query.analytic.length; a++){
			CUBE.analytic.add(query, query.analytic[a]);
		}//for
	}//endif
};//method


//from IS AN ARRAY OF OBJECTS
//sourceColumns IS AN ARRAY OF COLUMNS DEFINING THE TUPLES IN from
CUBE.analytic.add=function(query, analytic){

	var edges = analytic.edges;		//ARRAY OF COLUMN NAMES
	if (edges===undefined) D.error("Analytic expects 'edges' to be defined, even if empty");
	var sourceColumns=query.columns;

	var copyEdge=false;         //I WISH THE ELEMENT DID NOT HAVE TO BE POLLUTED WITH THE EDGE VALUE
	var parts=null;
	var from;
	if (query.edges.length==1 && query.cube!=undefined){
		from=query.cube;
		copyEdge=true;
		parts=query.edges[0].domain.partitions;
	}else if (query.list!=undefined){
		from=query.list;
	}else{
		D.error("Analytic not defined, yet");
	}//endif
	
	//FILL OUT THE ANALYTIC A BIT MORE
	if (analytic.name===undefined) analytic.name=analytic.value.split(".").last();
	sourceColumns.forall(function(v){ if (v.name==analytic.name)
		D.error("All columns must have different names");});
	analytic.columnIndex=sourceColumns.length;
	sourceColumns[analytic.columnIndex] = analytic;
	analytic.calc=CUBE.analytic.compile(sourceColumns, analytic.value);
	analytic.domain=CUBE.domain.value;

	if (analytic.where===undefined) analytic.where="true";
	var where=CUBE.analytic.compile(sourceColumns, analytic.where);

//	sourceColumns=sourceColumns.copy();

//	var columns={};
//	sourceColumns.forall(function(v, i){
//		columns[v.name]=v;
//	});

	var nullGroup=[];
	var allGroups=[];
	if (edges.length==0){
		allGroups.push([]);
		for(let i = from.length; i --;){
			let row = from[i];
			if (copyEdge) row[query.edges[0].name]=query.edges[0].domain.end(parts[i]);
			if (!where(null, -1, row)){
				nullGroup.push(row);
				continue;
			}//endif
			allGroups[0].push(row);
		}//for
	}else{
		var tree = {};  analytic.tree=tree;
		for(let i = from.length; i --;){
			let row = from[i];
			if (copyEdge) row[query.edges[0].name]=query.edges[0].domain.end(parts[i]);
			if (!where(null, -1, row)){
				nullGroup.push(row);
				continue;
			}//endif

			//FIND RESULT IN tree
			var trunk = tree;
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
//	yield (Thread.yield());

	//SORT
	var sortFunction;
	if (analytic.sort){
		if (!(analytic.sort instanceof Array)) analytic.sort=[analytic.sort];
		sortFunction=CUBE.sort.compile(analytic.sort, sourceColumns, true);
	}//endif

	for(var g=allGroups.length;g--;){
		var group=allGroups[g];
		if (sortFunction) group.sort(sortFunction);

		for(let rownum=group.length;rownum--;){
			group[rownum][CUBE.analytic.ROWNUM]=rownum;		//ASSIGN ROWNUM TO EVERY ROW
			group[rownum][CUBE.analytic.ROWS]=group;		//EVERY ROW HAS REFERENCE TO IT'S GROUP
		}//for
	}//for
	{//NULL GROUP
		if (sortFunction) nullGroup.sort(sortFunction);

		for(let rownum=nullGroup.length;rownum--;){
			nullGroup[rownum][CUBE.analytic.ROWNUM]=null;
			nullGroup[rownum][CUBE.analytic.ROWS]=null;
		}//for
	}


	//PERFORM CALC
	for(var i=from.length;i--;){
		from[i][analytic.name]=analytic.calc(from[i][CUBE.analytic.ROWS], from[i][CUBE.analytic.ROWNUM], from[i]);

		if (isNaN(from[i][analytic.name])){
			D.println("");
		}//enidf

		from[i][CUBE.analytic.ROWNUM]=undefined;	//CLEANUP
		from[i][CUBE.analytic.ROWS]=undefined;	//CLEANUP
	}//for

};


CUBE.analytic.compile = function(sourceColumns, expression){
	var func;


	if (expression === undefined) D.error("Expecting expression");

//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
	var f = "func=function(rows, rownum, __source){\n";
	for(var s = 0; s < sourceColumns.length; s++){
		var columnName = sourceColumns[s].name;
//ONLY DEFINE VARS THAT ARE USED
		if (expression.indexOf(columnName) != -1){
			f += "var " + columnName + "=__source." + columnName + ";\n";
		}//endif
	}//for
	f +=
		"var output;\n" +
			"try{ " +
			" output=" + expression + "; " +
			" if (output===undefined) D.error(\"analytic returns undefined\");\n" +
			" return output;\n" +
			"}catch(e){\n" +
			" D.error("+
				"\"Problem with definition of value=" + CNV.String2Quote(CNV.String2Quote(expression)).leftBut(1).rightBut(1) + " when operating on __source=\"+CNV.Object2JSON(__source)"+
				"+\" Are you trying to get an attribute value from a NULL part?\"" +
			", e)"+
			"}}";
	try{
		eval(f);
	} catch(e){
		D.error("can not compile " + f, e);
	}//try
	return func;
};//method
