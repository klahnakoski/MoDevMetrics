


var D=new function(){};

D.println=function(message){
	console.info(message);
}//method

D.error=function(description){
    throw description;
}//method

D.warning=function(description, cause){
	D.println(description + " caused by ("+cause+")");
}//method