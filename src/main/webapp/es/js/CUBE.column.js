CUBE.column = {};

CUBE.column.compile = function(sourceColumns, resultColumn, edges){

	if (resultColumn.value === undefined){
		resultColumn.calc = Util.returnNull;
		return;
	}//endif

	resultColumn.sortOrder = 1;
	if (resultColumn.sort == "descending") resultColumn.sortOrder = -1;


	//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
	//AS VAR DEFS, AND USING THE GROUPBY result
	var f = "resultColumn.calc=function(__source, __result){\n";
	for(var s = 0; s < sourceColumns.length; s++){
		var columnName = sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(columnName) != -1){
			f += "var " + columnName + "=__source." + columnName + ";\n";
		}//endif
	}//for
	if (edges !== undefined) for(var i = 0; i < edges.length; i++){
		var columnName = edges[i].name;
		var domainName = edges[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(domainName + ".") != -1){
			f += "var " + domainName + "=__result." + columnName + ";\n";
		}//endif
	}//for

	f +=
		"var output;\n"+
		"try{ " +
			"	output=" + resultColumn.value + "; " +
			"	if (output===undefined) D.error(\"" + resultColumn.name + " returns undefined\");\n"+
			"	return output;\n" +
			"}catch(e){ " +
			"	D.error(\"Problem with definition of name=\\\"" + resultColumn.name + "\\\" value=" + CNV.String2Quote(CNV.String2Quote(resultColumn.value)).leftBut(1).rightBut(1) + " when operating on __source=\"+CNV.Object2JSON(__source)+\" and __result=\"+CNV.Object2JSON(__result), e); " +
			"}}";
	try{
		eval(f);
	} catch(e){
		D.error("can not compile " + f, e);
	}//try

};//method


////////////////////////////////////////////////////////////////////////////////
//WE OFTEN NEED TO COMPILE CODE IN THE CONTEXT OF THE OBJECTS WE ARE WORKING ON
//THIS WILL ENCAPSULATE INTO A FUNCTION WITH THE PARAMETER NAMES GIVEN
CUBE.column.compileInContext(code, localVars){
	var output;
	var f =
		"output=function(__source){\n" +
			"if (__source==null) [];\n";

	for(var s = 0; s < localVars.length; s++){
		var v = localVars[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (column.test.indexOf(v) != -1){
			f += "var " + v + "=__source." + v + ";\n";
		}//endif
	}//for

	f +=
		"var output=[];\n" +
			"for(var i=0;i<this.partitions.length;i++){\n" +
			"var " + d.name + "=this.partitions[i];\n" +
			"if (" + column.test + ") output.push(" + d.name + ");\n " +
			"}\n " +
			"return output;\n " +
			"}";
	eval(f);

//MAKE THE WHERE TEST METHOD
CUBE.where = {};
CUBE.where.compile = function(whereClause, sourceColumns, edges){
	var whereMethod = null;


	if (whereClause === undefined){
		eval("whereMethod=function(a, b){return true;}");
		return whereMethod;
	}//endif

	var f = "whereMethod=function(__source, __result){\n";
	for(var s = 0; s < sourceColumns.length; s++){
		var columnName = sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(columnName) != -1){
			f += "var " + columnName + "=__source." + columnName + ";\n";
		}//endif
	}//for
	if (edges !== undefined) for(var i = 0; i < edges.length; i++){
		var columnName = edges[i].name;
		var domainName = edges[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(domainName + ".") != -1){
			f += "var " + domainName + "=__result." + columnName + ";\n";
		}//endif
	}//for

	f +=
		"try{ " +
			"	return (" + whereClause + "); " +
			"}catch(e){ " +
			"	D.warning(\"Problem with definition of the where clause {" + whereClause + "}\", e); " +
			"}}";
	eval(f);

	return whereMethod;

};//method


