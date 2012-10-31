

var readfile=function(path, successFunction){
	//DECODE RELATIVE PATHS
//	document.path

	var client = new XMLHttpRequest();
	client.open('GET', path);
	client.onreadystatechange = function(state) {
		successFunction(client.responseText);
	};
	client.send();
};


var scriptState={};
var importScript=function(path){

	if (scriptState[path]=="loaded") return;
	if (scriptState[path]=="pending") D.error("Import dependency loop detected");

	scriptState[path]="pending";
	readfile(path, function(content){
		eval(content);
		scriptState[path]="loaded";
	})
};


importScript("lib/js/jquery-1.7.js");


$(document).ready(function(){
	jQuery.get('PageTemplate.html', function(data, success, raw) {
		$("body").append(raw.responseText);
	});
});