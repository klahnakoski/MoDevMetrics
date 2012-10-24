var MVEL = function(){
};


MVEL.prototype.code = function(query){
	var selectList = query.select;
	var fromPath = query.from;
	var whereClause = query.where;
	var pleaseDebug = query.debug;

	//PARSE THE fromPath
	var code = this.from(fromPath, "doc", "loop");
	var output =
		"var String2Quote = function(str){\n" + "if (!(str is String)){ str; }else{\n" +
			"" + MVEL.Value2Code("\"") + "+" +
			"str.replace(" + MVEL.Value2Code("\\") + "," + MVEL.Value2Code("\\\\") +
			").replace(" + MVEL.Value2Code("\"") + "," + MVEL.Value2Code("\\\"") +
			").replace(" + MVEL.Value2Code("\'") + "," + MVEL.Value2Code("\\\'") + ")+" +
			MVEL.Value2Code("\"") + ";}};\n" +
			"var floorDay = function(value){ Math.floor(value/(24*60*60*1000))*(24*60*60*1000);};\n" +
			'var cool_func = function(doc){\n' +
			"output=\"\";\n" +
			code.replace(
				"<CODE>",
				"if (" + this.where(whereClause) + "){" +
					this.select(selectList, "output") +
					"}\n"
			) +
			(pleaseDebug ? "if (output==\"\") output=\"{\\\"bug_id\\\":\"+doc.bug_id+\"}\";\n" : "") +
			"\"[\"+output+\"]\";\n" +
			'};\n' +
			'cool_func(_source)\n'
		;

	if (console !== undefined && D.println != undefined) D.println(output);
	return output;
};//method





// docVariableName NAME USED TO REFER TO HIGH LEVEL DOCUMENT
// loopVariablePrefix PREFIX FOR LOOP VARABLES
MVEL.prototype.from = function(fromPath, docVariableName, loopVariablePrefix){
	var loopCode = "for(<VAR> : <LIST>){\n<CODE>\n}\n";
	this.prefixMap = [];
	var code = "<CODE>";


	var path = fromPath.split(".");
	if (path[0] != docVariableName) D.error("Expecting all paths to start with " + docVariableName);

	var currPath = [];
	currPath.push(path[0]);
	for(var i = 1; i < path.length; i++){
		var loopVariable = loopVariablePrefix + i;
		currPath.push(path[i]);
		var pathi = String.join(currPath, ".");
		var shortPath = this.translate(pathi);
		this.prefixMap.unshift({"path":pathi, "variable":loopVariable});

		var loop = loopCode.replace("<VAR>", loopVariable).replace("<LIST>", shortPath);
		code = code.replace("<CODE>", loop);
	}//for

	return code;
};//method


MVEL.prototype.translate = function(variableName){

	var shortForm = variableName;
	for(var p = 0; p < (this.prefixMap).length; p++){
		var prefix = this.prefixMap[p].path;
		shortForm=shortForm.replaceAll(prefix+".", this.prefixMap[p].variable+".?"); //ADD NULL CHECK
		shortForm=shortForm.replaceAll(prefix+"[", this.prefixMap[p].variable+"[");
	}//for
	return shortForm;
};//method


// CREATE A JSON OBJECT FOR RETURN OF THE SELECTED
// selectList HAS SIMPLE LIST OF VARIABLES TO BE ASSIGNED TO EACH RETURN OBJECT
// prefixMap WILL MAP path TO A LOOP variable INDEX
// varName THE VARIABLE USED TO ACCUMULATE THE STRING CONCATENATION
MVEL.prototype.select = function(selectList, varName){

	var list = [];
	for(var s = 0; s < selectList.length; s++){
		var variable = selectList[s].name;
		var value = selectList[s].value;
		var shortForm = this.translate(value);
		list.push(MVEL.Value2Code(MVEL.Value2Code(variable) + ":") + "+String2Quote(" + shortForm + ")\n");
	}//for


	var output =
		'if (' + varName + '!="") ' + varName + '+=", ";\n' +
			varName + '+="{"+' + String.join(list, "+\",\"+") + '+"}";\n'
		;

	return output;
};//method


// esFilter SIMPLIFIED ElasticSearch FILTER OBJECT
MVEL.prototype.where = function(esFilter){
	if (esFilter === undefined) return "true";

	var output = "";

	var keys = Object.keys(esFilter);
	if (keys.length != 1) D.error("Expecting only one filter operation");
	var op = keys[0];
	if (op == "and"){
		var list = esFilter[op];
		if (list.length == 0) D.error("Expecting something in 'and' array");
		if (list.length == 1) return this.where(list[0]);
		for(var i = 0; i < list.length; i++){
			if (output != "") output += " && ";
			output += "(" + this.where(list[i]) + ")";
		}//for
		return output;
	} else if (op == "or"){
		var list = esFilter[op];
		if (list.length == 0) D.error("Expecting something in 'or' array");
		if (list.length == 1) return this.where(list[0]);
		for(var i = 0; i < list.length; i++){
			if (output != "") output += " || ";
			output += "(" + this.where(list[i]) + ")";
		}//for
		return output;
	} else if (op == "not"){
		return "!(" + this.where(esFilter[op]) + ")";
	} else if (op == "term"){
		var pair = esFilter[op];
		var variableName = Object.keys(pair)[0];
		var value = pair[variableName];
		return this.translate(variableName) + "==" + MVEL.Value2Code(value);
	} else if (op == "terms"){
		var pair = esFilter[op];
		var variableName = Object.keys(pair)[0];
		var valueList = pair[variableName];
		if (valueList.length == 0) D.error("Expecting something in 'terms' array");
		if (valueList.length == 1) return this.translate(variableName) + "==" + MVEL.Value2Code(valueList[0]);
		for(var i = 0; i < valueList.length; i++){
			if (output != "") output += " || ";
			output += "(" + this.translate(variableName) + "==" + MVEL.Value2Code(valueList[i]) + ")";
		}//for
		return output;
	}else if (op=="missing"){
//		"missing" : {
//			"field" : "requestee",
//			"existence" : true,
//			"null_value" : true
//		}
		var fieldName=this.translate(esFilter[op].field);
		var testExistence=esFilter[op].existence;
		var testNull=esFilter[op].null_value;

		var output=[];
		if (testExistence && !testNull){
			output.push("("+fieldName+" == empty)");
		}//endif
		if (testNull){
			output.push("("+fieldName+"==null)");
		}//endif
		return output.join(" || ");
	} else if (op == "range"){
		var pair = esFilter[op];
		var variableName = Object.keys(pair)[0];
		var range = pair[variableName];
		var lower = "";
		var upper = "";

		if (!(range.gte === undefined)){
			lower = MVEL.Value2Code(range.gte) + "<=" + this.translate(variableName);
		} else if (!(range.gt === undefined)){
			lower = MVEL.Value2Code(range.gt) + "<" + this.translate(variableName);
		} else if (!(range.from == undefined)){
			if (range.include_lower == undefined || range.include_lower){
				lower = MVEL.Value2Code(range.from) + "<=" + this.translate(variableName);
			} else{
				lower = MVEL.Value2Code(range.from) + "<" + this.translate(variableName);
			}//endif
		}//endif

		if (!(range.lte === undefined)){
			upper = MVEL.Value2Code(range.lte) + ">=" + this.translate(variableName);
		} else if (!(range.lt === undefined)){
			upper = MVEL.Value2Code(range.lt) + ">" + this.translate(variableName);
		} else if (!(range.from == undefined)){
			if (range.include_lower == undefined || range.include_lower){
				upper = MVEL.Value2Code(range.from) + ">=" + this.translate(variableName);
			} else{
				upper = MVEL.Value2Code(range.from) + ">" + this.translate(variableName);
			}//endif
		}//endif

		if (upper == "" || lower == ""){
			return "(" + upper + lower + ")";
		} else{
			return "(" + upper + ") && (" + lower + ")";
		}//endif
	} else if (op=="script"){
		var script = esFilter[op].script;
		return this.translate(script);
	} else{
		D.error("'" + op + "' is an unknown operation");
	}//endif

	return "";
};//method


MVEL.Value2Code = function(value){
	if (Math.isNumeric(value)) return "" + value;
	return CNV.String2Quote(value);
};//method