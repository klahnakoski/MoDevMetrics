/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$.holdReady(true);

if (!D){
	D={
		"println":function(message){
			Console.log(message);
		},

		"error":function(message){
			Console.error(message);
			throw message;
		}

	};
}//endif

var aScript={};


var readfile=function(path, callback){
	var client = new XMLHttpRequest();
	try{
		client.open('GET', path);
		client.success=function(){callback(client.responseText);};
		client.error=function(){callback(null);};
		client.send(null);
	}catch(e){
		callback(null);
	}//try
};


var globalEval = function(name, src) {
	src="//@ sourceURL="+name.substring(name.lastIndexOf("/")+1)+"\n"+src;		//ADD NAME FOR DEBUGGER

    if (window.execScript) {
        window.execScript(src);
        return;
    }
//    var fn = function() {
        window.eval.call(window,src);
//    };
//    fn();
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

aScript.loadState={};
aScript.numPending=0;
aScript.parentPath=".";


var importScript=function(paths){

	if (typeof(paths)=="string") paths=[paths];

	//BATCH IMPORT WILL DELAY document.ready() UNTIL ALL ARE IMPORTED (INCLUDING DEPENDENCIES)
	aScript.numPending++;
	for(var i=0;i<paths.length;i++) aScript._importScript_(paths[i]);
	aScript.done();
};

////////////////////////////////////////////////////////////////////////////////
//IMPORT A SCRIPT
////////////////////////////////////////////////////////////////////////////////
aScript._importScript_=function(path){
	var parentPath=aScript.parentPath;

	var fullPath=getFullPath(parentPath, path);


	D.println("getFullPath("+parentPath+", "+path+")="+fullPath);

	if (aScript.loadState[fullPath]=="loaded") return;
	if (aScript.loadState[fullPath]=="pending") D.error("Import dependency loop detected");
	aScript.loadState[fullPath]="pending";
	aScript.numPending++;

	readfile(fullPath, function(content){
		try{
			aScript.parentPath=fullPath;
			globalEval(fullPath, content);
			aScript.parentPath=parentPath;
		}catch(e){
			aScript.loadState[fullPath]="error";
			aScript.done();
			D.error("Can not load script "+fullPath, e);
		}//try
		aScript.parentPath=parentPath;
		aScript.loadState[fullPath]="loaded";
		aScript.done();
	});

};




//LIST OF DOCUMENT READY HANDLERS, I HOPE TO NEVER NEED THIS
var scriptWaiting=[];

aScript.ready=function(func){
	if (aScript.numPending==-1){
		func();
		return;
	}//endif
	
	scriptWaiting.push(func);
};//method


aScript.done=function(){
	aScript.numPending--;
	if (aScript.numPending<=0){
		aScript.numPending=-1;
		for(var i=0;i<scriptWaiting.length;i++){
			scriptWaiting[i]();
		}//for
	}//endif
};//method



aScript.numPending++;

importScript("lib/js/jquery-1.7.js");

jQuery.get('PageTemplate.html', function(data, success, raw) {
	$("body").append(raw.responseText);
	aScript.numPending--;//DO NOT TRIGGER done()
	if ($.holdReady!==undefined) $.holdReady(false);

});
