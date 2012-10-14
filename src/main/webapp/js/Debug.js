var D = new function(){
};

D.println = function(message){
	console.info(message);
};//method

D.error = function(description){
	console.error(description);
	throw description;
};//method

D.warning = function(description, cause){
	D.println(description + (cause === undefined ? "" : (" caused by (" + cause + ")")));
};//method