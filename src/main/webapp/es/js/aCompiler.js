



aCompile={};

////////////////////////////////////////////////////////////////////////////////
// EXECUTE SIMPLE CODE IN THE CONTEXT OF AN OBJECT'S VARIABLES
////////////////////////////////////////////////////////////////////////////////
aCompile.method=function(code, contextObjects){
	if (!(contextObjects instanceof Array)) contextObjects=[contextObjects];
	var output;

	var contextObjectNames=[];
	contextObjects.forall(function(c, i){
		contextObjectNames.push("__source"+i);
	});

	var f =
			"output=function("+contextObjectNames.join(",")+"){\n";

		for(var s = contextObjects.length; s--;){
			var params=Object.keys(contextObjects[s]);
			params.forall(function(p){
				//ONLY DEFINE VARS THAT ARE USED
				if (code.indexOf(p) != -1){
					f += "var " + p + "="+contextObjectNames[s]+"." + p + ";\n";
				}//endif
			});
		}//for

		f+=code.trim().rtrim(";")+";\n";

		//FIRST CONTEXT OBJECT IS SPECIAL, AND WILL HAVE IT'S VARS ASSIGNED BACK
		var params=Object.keys(contextObjects[0]);
		params.forall(function(p){
			if (code.indexOf(p) != -1){
				f += contextObjectNames[0] + "." + p + "=" + p + ";	\n";
			}//endif
		});

		f += "}";
		eval(f);

	return output;

};