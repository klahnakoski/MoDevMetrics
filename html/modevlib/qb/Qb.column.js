/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
if (qb===undefined) var qb = {};


qb.column = {};


qb.column.normalize=function(column){
	if (isString(column)) {
		return {"name": column};
	}else if (!column.name){
		column.name = coalesce(column.value, column.aggregate);
	}else{
		return column;
	}//endif
};//function


qb.column.compile = function(resultColumn, sourceColumns, edges, useMVEL){  //useMVEL TO INDICATE THIS IS AN ES COLUMN

	if (isString(resultColumn)){
		Log.error("expecting a column definition, not a string");
	}//endif
	if (resultColumn.name===undefined) resultColumn.name=resultColumn.value;


	if (resultColumn.domain){
		if (resultColumn.domain.compare===undefined)
			qb.domain.compile(resultColumn, sourceColumns);
	}else{
		resultColumn.domain=qb.domain.value;
	}//endif

	resultColumn.sortOrder = 1;
	if (resultColumn.sort== "descending") resultColumn.sortOrder = -1;
	if (resultColumn.sort!=undefined && !["descending", "none", "ascending", "-1", "0", "1"].contains(""+resultColumn.sort)){
		Log.error(resultColumn.name+' has unknown sort order, pick one of ["descending", "none", "ascending", -1, 0, 1]');
	}//endif

	if (useMVEL!==undefined && useMVEL) return;

	if (resultColumn.value === undefined){
		//TODO: RUN MORE TEST TO VERIFY CORRECTNESS
		var all_have_filters=true;
		var calc_val="(function(){";
		resultColumn.domain.partitions.forall(function(v){
			if (!v.esfilter){
				all_have_filters=false;
			}else{
				calc_val+="if ("+convert.esFilter2Expression(v.esfilter)+") return "+ convert.Value2Quote(v[resultColumn.domain.key])+";\nelse ";
			}//endif
		});
		calc_val+="return null;\n";
		calc_val+="})()";
		if (all_have_filters){
			resultColumn.value=calc_val;
		}else{
			resultColumn.calc = Util.returnNull;
			return;
		}//endif
	}else if (resultColumn.value instanceof Date){
		resultColumn.value="Date.newInstance("+resultColumn.value.getMilli()+")";
	}else if (aMath.isNumeric(resultColumn.value)){
		resultColumn.value=""+resultColumn.value;
	}//endif

	//COMPILE THE CALCULATION OF THE DESTINATION COLUMN USING THE SOURCE COLUMNS
	var f = "resultColumn.calc=function(__source, __result){\n" +
		"try{\n";
	if (resultColumn.value==".") {
		resultColumn.value = "__source";
	}else if (resultColumn.value instanceof Function){
		Log.error("Can not accept a function, use a string with Javascript instead")
	}else{
		for(var s = 0; s < sourceColumns.length; s++){
			var columnName = sourceColumns[s].name;
			//ONLY DEFINE VARS THAT ARE USED
			if (resultColumn.value.indexOf(columnName) != -1){
				f += "var " + columnName + "=__source." + columnName + ";\n";
			}//endif
		}//for
	}
	if (edges !== undefined) for(var i = 0; i < edges.length; i++){
		var domainName = edges[i].domain.name;
		//ONLY DEFINE VARS THAT ARE USED
		if (domainName!==undefined){
			if (resultColumn.value.indexOf(domainName + ".") != -1){
				f += "var " + domainName + "=__result["+i+"];\n";
			}//endif

			var reg=new RegExp(domainName+"\\s*==", "g");
			if (reg.test(resultColumn.value)){
				Log.error("Using domain '"+domainName+"' on it's own is a good idea, it is just not implemented yet");
			}//endif
		}//endif
	}//for

	f +=
			"   var output;\n"+

			"  output = " + resultColumn.value + ";\n" +
			"  if (output===undefined || (output!=null && aMath.isNaN(output))) Log.error(\"" + resultColumn.name + " returns \"+convert.Value2Quote(output));\n"+
			"  return output;\n" +
			"}catch(e){\n" +
			"  Log.error("+
					"\"Problem with definition of name=\\\"" + resultColumn.name +
					"\\\" value=" + convert.String2Quote(convert.String2Quote(resultColumn.value)).leftBut(1).rightBut(1) +
					" when operating on __source=\"+convert.value2json(__source)+\" and __result=\"+convert.value2json(__result)"+
					"+\" caused by (\"+e.message+\")\""+
					"+\" Are you trying to get an attribute value from a NULL part?\"" +
				", e)"+
			"}}";
	try{
		eval(f);
	} catch(e){
		Log.error("can not compile " + f, e);
	}//try

};//method



//MAKE THE WHERE TEST METHOD
qb.where = {};
qb.where.compile = function(whereClause, sourceColumns, edges){
	var whereMethod = null;


	if (whereClause === undefined || whereClause==null){
		eval("whereMethod=function(a, b){return true;}");
		return whereMethod;
	}//endif

	if (!isString(whereClause)){
		return convert.esFilter2function(whereClause);
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
		if (whereClause.indexOf(domainName) != -1){
			f += "var " + domainName + "=__result["+i+"];\n";
		}//endif
		if (whereClause.indexOf(columnName) != -1){
			f += "var " + columnName + "=__result["+i+"];\n";
		}//endif
	}//for

	f +=
		"try{\n" +
			"  return (" + whereClause + ");\n" +
			"}catch(e){\n" +
			"  Log.warning(\"Problem with definition of the where clause " + convert.String2Quote(whereClause).rightBut(1).leftBut(1) + "\", e);\n" +
			"}}";
	try{
		eval(f);
	}catch(e){
		Log.error("Can not compile where clause {\n"+f+"\n}", e);
	}//try

	return whereMethod;

};//method


