var D = new function(){
};

D.logs=[];

D.addLog=function(id){
	D.logs.push(id);
	$("#"+id).html("");
};


D.println = function(message){
	console.info(Date.now().format("HH:mm:ss - ")+message);
	D.logs.forall(function(v, i){
		try{
			if (typeof(message)!="string") message=CNV.Object2JSON(message);
			var ele=$("#"+v);
			ele.append(CNV.String2HTML(message)+"<br>");
		}catch(e){

		}//try
	});
};//method

D.error = function(description, cause){
	if (cause===undefined) cause="";
	console.error(description+":"+cause);
//	return;
	throw new Exception(description, cause);
};//method

D.warning = function(description, cause){
	console.error(description); return;
	D.println(new Exception("WARNING: "+description, cause).toString());
};//method





var Exception=function(description, cause){
	this.description=description;
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



Exception.prototype.toString=function(){
	if (this.cause===undefined){
		return this.description;
	}else if (this.cause instanceof Exception){
		return this.description + " caused by (\n" + this.cause.toString().indent(1) + "\n)\n";
	}else{
		return this.description + " caused by (" + this.cause + ")";
	}//endif
};



