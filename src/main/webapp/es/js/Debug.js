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

D.alert=function(message, ok_callback, cancel_callback){

	$(function() {
		$(
		'<div>'+message+"</div>"
		).dialog({
			title:"Alert",
		 	draggable: false,
			modal: true,
			resizable: false,
			buttons: {
					"OK": function () { $(this).dialog("close"); ok_callback(); },
					"Cancel": function () { $(this).dialog("close"); cancel_callback(); }
				}
		});
	  });

//  <div id="dialog" title="Basic dialog">
//	  <p>This is the default dialog which is useful for displaying information. The dialog window can be moved, resized and closed with the 'x' icon.</p>
//  </div>



//	alert(message);
};//method


//TRACK ALL THE ACTIONS IN PROGRESS
D.actionStack=[];
D.action=function(message, workload){
	var action={"message":message, "workload":workload, "start":Date.now()};
	D.actionStack.push(action);
	$("#status").html(message);
	if (message.toLowerCase()=="done" && $('.loading')!==undefined) $('.loading').hide();

	D.println("start "+message+" "+action.start.format("HH:mm:ss"));

	if (workload){

		try{
			workload();
		}catch(e){
			D.actionDone(action);
			throw e;
		}//try
		D.actionDone(action);
	}else{
		//JUST SHOW MESSAGE FOR THREE SECONDS
		$("#status").html(message);
		setTimeout(function(){D.actionDone(action, true);}, 3000);
		return action;		//RETURNED IF YOU WANT TO REMOVE IT SOONER
	}//endif
};//method


D.actionDone=function(action, ignoreIfMissing){
	action.end=Date.now();

	if (D.actionStack.length==0 && !ignoreIfMissing){
		D.error("Unexpected");
	}//endif

	var i=D.actionStack.indexOf(action);
	if (i==-1 && !ignoreIfMissing)
		D.error("Unexpected");
	D.actionStack.splice(i, 1);

	D.println("done "+action.message+" "+action.end.format("HH:mm:ss")+" ("+action.end.subtract(action.start).floor(Duration.SECOND).toString()+")");

	if (D.actionStack.length==0){
		if ($('.loading')!==undefined) $('.loading').hide();
		$("#status").html("Done");
	}else{
		$("#status").html(D.actionStack[0].message);
	}//endif
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



