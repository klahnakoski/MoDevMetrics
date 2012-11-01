



aCompile={};


aCompile.expression=function(code, contextObjects){
	var output;

	var contextObjectNames=[];
	contextObjects.forall(function(c, i){
		contextObjectNames.push("__source"+i);
	});

	var f =
			"output=function("+contextObjectNames.join(",")+"){\n";

		for(var s = contextObjects.length; s--;){
			var params=Object.keys(contextObjects[i]);
			params.forall(function(p){
				//ONLY DEFINE VARS THAT ARE USED
				if (code.indexOf(p) != -1){
					f += "var " + p + "="+contextObjectNames[s]+"." + p + ";\n";
				}//endif
			});
		}//for

		f += "return "+code+"\n"+
			"}";
		eval(f);

	return output;

};