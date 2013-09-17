
importScript("../CNV.js");



var Exception=function(description, cause){
	this.message=description;
	this.cause=cause;
};

//MAKE A GENERIC ERROR OBJECT DECRIBING THE ARGUMENTS PASSED
Exception.error=function(){
	var args = Array.prototype.slice.call(arguments).map(function(v,i){
		if (typeof(v)=="string") return v;
		return CNV.Object2JSON(v);
	});
	return new Exception("error called with arguments("+args.join(",\n"+")"), null);
};


Exception.prototype.contains=function(type){
	if (this==type) return true;
	if (this.message==type) return true;

	if (this.cause===undefined){
		return false;
	}else if (this.cause instanceof Array){
		for(var i=this.cause.length;i--;){
			if (this.cause[i].contains(type)) return true;
		}//for
		return false;
	}else{
		return this.cause.contains(type);
	}//endif
};


Exception.prototype.toString=function(){
	if (this.cause===undefined){
		return this.message;
	}else if (this.cause.toString === undefined){
		return this.message + " caused by (\n" + (""+this.cause).indent(1) + "\n)\n";
	}else if (this.cause instanceof Exception){
		return this.message + " caused by (\n" + this.cause.toString().indent(1) + "\n)\n";
	}else{
		return this.message + " caused by (" + this.cause.message + ")";
	}//endif
};

Exception.TIMEOUT=new Exception("Timeout", undefined);

