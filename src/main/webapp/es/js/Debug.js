var D = new function(){
};

D.println = function(message){
	console.info(message);
};//method

D.error = function(description, cause){
	throw new Exception(description, cause);
};//method

D.warning = function(description, cause){
	console.info(description); return;
	D.println(new Exception("WARNING: "+description, cause).toString());
};//method


var Exception=function(description, cause){
	this.description=description;
	this.cause=cause;
};

Exception.prototype.toString=function(){
	if (this.cause===undefined){
		return this.description;
	}else if (this.cause instanceof Exception){
		return this.description + " caused by (\n" + this.cause.toString().indent(1) + "\n)\n";
	}else{
		return this.description + " caused by (" + this.cause + ")";
	}//endif
};



