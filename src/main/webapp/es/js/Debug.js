var D = new function(){
};

D.logs=[];

D.addLog=function(id){
	D.logs.push(id);
	$("#"+id).html("");
};


D.println = function(message){
	try{
		if (typeof(message)!="string") message=CNV.Object2JSON(message);
	}catch(e){
	}//try
	message=Date.now().addTimezone().format("HH:mm:ss - ")+message;

	console.info(message);

	D.logs.forall(function(v, i){
		try{
			var ele=$("#"+v);
			ele.append(CNV.String2HTML(message)+"<br>");
		}catch(e){
		}//try
	});
};//method

D.error = function(description, cause){
	var e=new Exception(description, cause);
	console.error(e.toString());
	throw e;
};//method

D.warning = function(description, cause){
	console.error(description); return;
	D.println(new Exception("WARNING: "+description, cause).toString());
};//method

D.alert=function(message){
	alert(message);
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



