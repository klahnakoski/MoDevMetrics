var MVEL = function(){
};


MVEL.prototype.code = function(query){
	var selectList = CUBE.select2Array(query.select);
	var fromPath = query.from;			//FIRST NAME IS THE INDEX
	var indexName=fromPath.split(".")[0];
	var whereClause = query.where;

	//PARSE THE fromPath
	var code = this.from(fromPath, indexName, "__loop");
	var output = MVEL.addFunctions(
		'var cool_func = function('+indexName+'){\n' +
			"output=\"\";\n" +
			code.replace(
				"<CODE>",
				"if (" + this.where(whereClause) + "){" +
					this.select(selectList, fromPath, "output") +
				"}\n"
			) +
			'output;\n' +
		'};\n' +
		'cool_func(_source)\n'
	);

//	if (console !== undefined && D.println != undefined) D.println(output);
	return output;
};//method



// indexName NAME USED TO REFER TO HIGH LEVEL DOCUMENT
// loopVariablePrefix PREFIX FOR LOOP VARABLES
MVEL.prototype.from = function(fromPath, loopVariablePrefix){
	var loopCode = "if (<LIST>!=null){ for(<VAR> : <LIST>){\n<CODE>\n}}\n";
	this.prefixMap = [];
	var code = "<CODE>";

	var path = fromPath.split(".");

	var currPath = [];
	currPath.push(path[0]);
	for(var i = 1; i < path.length; i++){
		var loopVariable = loopVariablePrefix + i;
		currPath.push(path[i]);
		var pathi = String.join(currPath, ".");
		var shortPath = this.translate(pathi);
		this.prefixMap.unshift({"path":pathi, "variable":loopVariable});

		var loop = loopCode.replaceAll("<VAR>", loopVariable).replaceAll("<LIST>", shortPath);
		code = code.replaceAll("<CODE>", loop);
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
//MVEL.prototype.select = function(selectList, varName){
//
//	var list = [];
//	for(var s = 0; s < selectList.length; s++){
//		var variable = selectList[s].name;
//		var value = selectList[s].value;
//		var shortForm = this.translate(value);
//		list.push(MVEL.Value2Code(MVEL.Value2Code(variable) + ":") + "+String2Quote(" + shortForm + ")\n");
//	}//for
//
//
//	var output =
//		'if (' + varName + '!="") ' + varName + '+=", ";\n' +
//			varName + '+="{"+' + String.join(list, "+\",\"+") + '+"}";\n'
//		;
//
//	return output;
//};//method


// CREATE A PIPE DELIMITED RESULT SET
MVEL.prototype.select = function(selectList, fromPath, varName){
	var list = [];
	for(var s = 0; s < selectList.length; s++){
		var value = selectList[s].value;
		var shortForm = this.translate(value);
		list.push("Value2Pipe(" + shortForm + ")\n");
	}//for

	var output;
	if (fromPath.indexOf(".")>0){
		output =
			'if (' + varName + '!="") ' + varName + '+="|";\n' +
				varName + '+=' + String.join(list, '+"|"+') + ';\n'
			;
	}else{
		output=varName + ' = ' + String.join(list, '+"|"+') + ';\n'
	}//endif
	return output;
};//method




//STATIC SO IT CAN BE USED ELSEWHERE
MVEL.esFacet2List=function(facet, selectClause){
	//ASSUME THE .term IS JSON OBJECT WITH ARRAY OF RESULT OBJECTS
	var output = [];
	var list = facet.terms;
	for(var i = 0; i < list.length; i++){
		var value=undefined;
		if (list[i].term=="") continue;		//NO DATA
		var values = list[i].term.split("|");
		for(var v = 0; v < values.length; v++){
			var s=v%selectClause.length;
			if (s==0){
				if (value!==undefined){
					output.push(value);
				}//endif
				value={};
			}//endif
			value[selectClause[s].name]=CNV.Pipe2Value(values[v]);
		}//for
		output.push(value);
	}//for
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

		if (testExistence===undefined || testNull===undefined) D.error("must have 'existence' and 'null_value' attributes");

		var output=[];
		if (testExistence && !testNull){
			output.push("("+fieldName.replace(".?", ".")+" == empty)");		//REMOVE THE .? SO WE REFER TO THE FIELD, NOT GET THE VALUE
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
	}else if (op=="prefix"){
		var pair = esFilter[op];
		var variableName = Object.keys(pair)[0];
		var value = pair[variableName];
		return this.translate(variableName)+".startsWith(" + MVEL.Value2Code(value)+")";
	} else{
		D.error("'" + op + "' is an unknown operation");
	}//endif

	return "";
};//method


MVEL.Value2Code = function(value){
	if (Math.isNumeric(value)) return "" + value;
	return CNV.String2Quote(value);
};//method


//PREPEND THE REQUIRED MVEL FUNCTIONS TO THE CODE
MVEL.addFunctions=function(mvel){
	var isAdded={};			//SOME FUNCTIONS DEPEND ON OTHERS 

	var keepAdding=true;
	while(keepAdding){
		keepAdding=false;
		forAllKey(MVEL.FUNCTIONS, function(k, v){
			if (isAdded[k]) return;
			if (mvel.indexOf(k)==-1) return;
			keepAdding=true;
			isAdded[k]=v;
			mvel=v+mvel;
		});
	}//while
	return mvel;
};//method


MVEL.FUNCTIONS={
	"String2Quote":
		"var String2Quote = function(str){\n" +
			"if (!(str is String)){ str; }else{\n" +	//LAST VALUE IS RETURNED.  "return" STOPS EXECUTION COMPLETELY!
			"" + MVEL.Value2Code("\"") + "+" +
			"str.replace(" + MVEL.Value2Code("\\") + "," + MVEL.Value2Code("\\\\") +
			").replace(" + MVEL.Value2Code("\"") + "," + MVEL.Value2Code("\\\"") +
			").replace(" + MVEL.Value2Code("\'") + "," + MVEL.Value2Code("\\\'") + ")+" +
			MVEL.Value2Code("\"") + ";\n" +
			"}};\n",

	"Value2Pipe":
		'var Value2Pipe = function(value){\n' +  //SPACES ARE IMPORTANT BETWEEN "="
			"if (value==null){ \"0\" }else "+
			"if (value is ArrayList){ 's'+value.toString(); }else \n" +
			"if (value is Long || value is Integer){ 'n'+value; }else \n" +
			"if (!(value is String)){ 's'+value.getClass().getName(); }else \n" +
//			"value;\n"+
			'"s"+replaceAll(replaceAll(value, "\\\\", "\\\\\\\\"), "|", "\\\\p");'+  //CAN NOT ""+value TO MAKE NUMBER A STRING (OR EVEN TO PREPEND A STRING!)
		"};\n",

	"replaceAll":
		"var replaceAll = function(output, find, replace){\n" +
			"if (output.length()==0) return output;\n"+
			"s = output.indexOf(find, 0);\n" +
			"while(s>=0){\n" +
				"output=output.replace(find, replace);\n" +
				"s=s-find.length+replace.length;\n" +
				"s = output.indexOf(find, s);\n" +
			"}\n"+
			"output;\n"+
		'};\n',

	"floorDay":
		"var floorDay = function(value){ Math.floor(value/(24*60*60*1000))*(24*60*60*1000);};\n",

	"maximum"://JUST BECAUSE MVEL'S Math.max ONLY USES Math.max(int, int).  G*DDA*NIT!
		"var maximum = function(a, b){if (a==null) b; else if (b==null) a; else if (a>b) a; else b;\n};\n",

	"minimum"://JUST BECAUSE MVEL'S Math.max ONLY USES Math.max(int, int).  G*DDA*NIT!
		"var minimum = function(a, b){if (a==null) b; else if (b==null) a; else if (a<b) a; else b;\n};\n",

	"coalesce"://PICK FIRST NOT-NULL VALUE
		"var coalesce = function(a, b){if (a==null) b; else a; \n};\n",

	"zero2null"://ES MAKES IT DIFFICULT TO DETECT NULL/MISSING VALUES, BUT WHEN DEALING WITH NUMBERS, THE PIECE OF S**T DEFAULTS TO RETURNING ZERO FOR missing VALUES!!
		"var zero2null = function(a){if (a==0) null; else a; \n};\n",

	"get":	//MY OWN PERSONAL *FU* TO THE TWISTED MVEL PROPERTY ACCESS
		"var get = function(hash, key){\n"+
			"if (hash==null) null; else hash[key];\n"+
		"};\n"
};
