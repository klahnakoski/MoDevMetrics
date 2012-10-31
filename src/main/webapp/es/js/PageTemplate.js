

var readfile=function(path, successFunction){
	//DECODE RELATIVE PATHS
//	document.path

	var client = new XMLHttpRequest();
	client.open('GET', path);
	client.onreadystatechange = function(state) {
		if (this.readyState!=4) return;
		successFunction(client.responseText);
	};
	client.send();
};


var getFullPath=function(currentFullPath, path){
	var e=path.lastIndexOf("/");
	if (path.charAt(0)=='/'){
		if (e==-1) return "/";
		return path.substring(0, e);
	}else{
		if (e==-1) return currentFullPath+"/"+path;
		return currentFullPath+"/"+path.substring(0, e);
	}//endif
};

var scriptLoadStates={};

var scripts = document.getElementsByTagName("script");
var src = scripts[scripts.length-1].getAttribute("src");
var scriptPath=getFullPath(getFullPath("", window.location.pathname), src);

var importScript=function(path){

	if (scriptLoadStates[path]=="loaded") return;
	if (scriptLoadStates[path]=="pending") D.error("Import dependency loop detected");

	scriptLoadStates[path]="pending";
	readfile(scriptPath+"/"+path, function(content){
		var currPath=scriptPath;
		scriptPath=getFullPath(scriptPath, path);
		
		try{
			eval(content);
		}catch(e){
			scriptPath=currPath;
			if (D===undefined) throw e;
			D.error("Can not load script "+path, e);
		}//try
		scriptPath=currPath;
		scriptLoadStates[path]="loaded";
	})
};


importScript("lib/js/jquery-1.7.js");


$(document).ready(function(){
	jQuery.get('PageTemplate.html', function(data, success, raw) {
		$("body").append(raw.responseText);
	});
});