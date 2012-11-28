CUBE.column = {};

CUBE.column.compile = function(sourceColumns, resultColumn, edges){

	if (resultColumn.value === undefined){
		resultColumn.calc = Util.returnNull;
		return;
	}//endif

	resultColumn.sortOrder = 1;
	if (resultColumn.sort== "descending") resultColumn.sortOrder = -1;
	if (resultColumn.sort!=undefined && ["descending", "none", "ascending"].indexOf(resultColumn.sort)==-1){
		D.error(resultColumn.name+' has unknown sort order, pick one of ["descending", "none", "ascending"]');
	}//enidf

	//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
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
		if (domainName!==undefined){
			if (resultColumn.value.indexOf(domainName + ".") != -1){
				f += "var " + domainName + "=__result["+i+"];\n";
			}//endif
			
			var reg=new RegExp(domainName+"\\s*==", "g");
			if (reg.test(resultColumn.value)){
				D.error("Using domain '"+domainName+"' on it's own is a good idea, it is just not implemented yet");
			}//endif
		}//endif
	}//for

	f +=
		"var output;\n"+
		"try{ " +
			"	output=" + resultColumn.value + "; " +
			"	if (output===undefined) D.error(\"" + resultColumn.name + " returns undefined\");\n"+
			"	return output;\n" +
			"}catch(e){\n" +
			"	D.error(\"Problem with definition of name=\\\"" + resultColumn.name + "\\\" value=" + CNV.String2Quote(CNV.String2Quote(resultColumn.value)).leftBut(1).rightBut(1) + " when operating on __source=\"+CNV.Object2JSON(__source)+\" and __result=\"+CNV.Object2JSON(__result), e)+\" "+
			"Are you trying to get an attribute value from a NULL part?\"" +
			"}}";
	try{
		eval(f);
	} catch(e){
		D.error("can not compile " + f, e);
	}//try

};//method



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
			f += "var " + columnName + "=__source[\"" + columnName + "\"];\n";
		}//endif
	}//for
	if (edges !== undefined) for(var i = 0; i < edges.length; i++){
		var columnName = edges[i].name;
		var domainName = edges[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(domainName + ".") != -1){
			f += "var " + domainName + "=__result["+i+"];\n";
		}//endif
	}//for

	f +=
		"try{ " +
			"	return (" + whereClause + "); " +
			"}catch(e){ " +
			"	D.warning(\"Problem with definition of the where clause " + CNV.String2Quote(whereClause).rightBut(1).leftBut(1) + "\", e); " +
			"}}";
	try{
		eval(f);
	}catch(e){
		D.error("Can not compile where clause", e);
	}//try

	return whereMethod;

};//method


