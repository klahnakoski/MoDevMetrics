
var D;
var aScript={};


var readfile=function(path){
	//DECODE RELATIVE PATHS
//	document.path

	var client = new XMLHttpRequest();
	client.open('GET', path, false);
//	client.onreadystatechange = function(state) {
//		if (this.readyState!=4) return;
//		successFunction(client.responseText);
//	};
//	client.send();
	try{
		client.send(null);
	}catch(e){
		if(D===undefined) throw  "Can not read file "+path+": "+e;
		D.error("Problem loading file "+path, e);
	}//try
	return client.responseText;
};

var globalEval = function(name, src) {
	src="//@ sourceURL="+name+"\n"+src;		//ADD NAME FOR DEBUGGER

    if (window.execScript) {
        window.execScript(src);
        return;
    }
    var fn = function() {
        window.eval.call(window,src);
    };
    fn();
};

var getFullPath=function(parentScriptPath, relativePath){

	var e=parentScriptPath.lastIndexOf("/");
	if (e==-1){
		parentScriptPath=".";
	}else{
		parentScriptPath=parentScriptPath.substring(0, e);
	}//endif

	var absPath;
	if (relativePath.charAt(0)=='/'){
		absPath=relativePath;	//NOT RELATIVE
	}else{
		absPath=parentScriptPath+"/"+relativePath;
	}//endif

	absPath=absPath.replace("/./", "/");
	if (absPath.substring(0,2)=="./") absPath=absPath.substring(2);
	
	var e=absPath.indexOf("/../");
	if (e>=0){
		var s=absPath.lastIndexOf("/", e-1);
		if (s>=0){
			absPath=absPath.substring(0,s)+absPath.substring(e+3);
		}//endif
	}//endif


	return absPath;

};

var scriptLoadStates={};
var scriptNumPending=0;

//var scripts = document.getElementsByTagName("script");
//var src = scripts[scripts.length-1].getAttribute("src");
//var scriptPath=getFullPath(getFullPath("", window.location.pathname), src);
var scriptParentPath=".";//getFullPath(".", src);

var importScript=function(path){

	//BATCH IMPORT WILL DELAY document.ready() UNTIL ALL ARE IMPORTED (INCLUDING DEPENDENCIES)
	if (path instanceof Array){
		scriptNumPending++;
		for(var i=0;i<path.length;i++) importScript(path[i]);
		aScript.done();
		return;
	}//endif


	if (scriptLoadStates[path]=="loaded") return;
	if (scriptLoadStates[path]=="pending") D.error("Import dependency loop detected");

	scriptLoadStates[path]="pending";
	scriptNumPending++;
	var fullPath=getFullPath(scriptParentPath, path);
	var content=readfile(fullPath);
console.info("getFullPath("+currPath+", "+path+")="+fullPath);
	try{
		var currPath=scriptParentPath;
		scriptParentPath=fullPath;
		globalEval(fullPath, content);
		scriptParentPath=currPath;
	}catch(e){
		scriptLoadStates[path]="error";
		aScript.done();
		if (D === undefined) throw "Can not load script "+path+": "+e;
		D.error("Can not load script "+path, e);
	}//try
	scriptParentPath=currPath;
	scriptLoadStates[path]="loaded";
	aScript.done();
};

var scriptWaiting=[];

aScript.ready=function(func){
	if (scriptNumPending==-1){
		func();
		return;
	}//endif
	
	scriptWaiting.push(func);
};//method


aScript.done=function(){
	scriptNumPending--;
	if (scriptNumPending<=0){
		scriptNumPending=-1;
		for(var i=0;i<scriptWaiting.length;i++){
			scriptWaiting[i]();
		}//for
	}//endif
};//method



scriptNumPending++;

importScript("lib/js/jquery-1.7.js");

jQuery.get('PageTemplate.html', function(data, success, raw) {
	$("body").append(raw.responseText);
	scriptNumPending--;//DO NOT TRIGGER done()
});
