
SQL.column={};

SQL.column.compile=function(sourceColumns, resultColumn, facets){

	if (resultColumn.value===undefined){
		resultColumn.calc=Util.returnNull;
		return;
	}//endif

	resultColumn.sortOrder=1;
	if (resultColumn.sort=="descending") resultColumn.sortOrder=-1;



	//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
	//AS VAR DEFS, AND USING THE GROUPBY result
	var f="resultColumn.calc=function(__source, __result){\n";
	for(var s in sourceColumns){
		var columnName=sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(columnName)!=-1){
			f+="var "+columnName+"=__source."+columnName+";\n";
		}//endif
	}//for
	if (facets!==undefined) for(var i in facets){
		var columnName=facets[i].name;
		var domainName=facets[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (resultColumn.value.indexOf(domainName+".")!=-1){
			f+="var "+domainName+"=__result."+columnName+";\n";
		}//endif
	}//for

	f+=
		"try{ "+
		"	return ("+resultColumn.value+"); "+
		"}catch(e){ "+
		"	D.warning(\"Problem with definition of \\\""+resultColumn.name+"\\\" "+CNV.String2Quote(CNV.String2Quote(resultColumn.value)).leftBut(1).rightBut(1)+"\", e); "+
		"}}";
	
	try{
		eval(f);
	}catch(e){
		D.error("can not compile "+f, e);
	}//try

};//method


//MAKE THE WHERE TEST METHOD
SQL.where={};
SQL.where.compile=function(whereClause, sourceColumns, facets){
	var whereMethod=null;


	if (whereClause===undefined){
		eval("whereMethod=function(a, b){return true;}");
		return whereMethod;
	}//endif

	var f="whereMethod=function(__source, __result){\n";
	for(var s in sourceColumns){
		var columnName=sourceColumns[s].name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(columnName)!=-1){
			f+="var "+columnName+"=__source."+columnName+";\n";
		}//endif
	}//for
	if (facets!==undefined) for(var i in facets){
		var columnName=facets[i].name;
		var domainName=facets[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (whereClause.indexOf(domainName+".")!=-1){
			f+="var "+domainName+"=__result."+columnName+";\n";
		}//endif
	}//for

	f+=
		"try{ "+
		"	return ("+whereClause+"); "+
		"}catch(e){ "+
		"	D.warning(\"Problem with definition of the where clause {"+whereClause+"}\", e); "+
		"}}";
	eval(f);

	return whereMethod;

};//method


