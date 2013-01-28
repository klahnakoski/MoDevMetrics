/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


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
	D.alert(description);
	console.error(e.toString());
	throw e;
};//method

D.warning = function(description, cause){
	console.warn(description);
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
					"OK": function () { $(this).dialog("close"); if (ok_callback) ok_callback(); },
					"Cancel": function () { $(this).dialog("close"); if (cancel_callback) cancel_callback(); }
				}
		});
	  });

};//method


//TRACK ALL THE ACTIONS IN PROGRESS
D.actionStack=[];
D.action=function(message, waitForDone){
	var action={"message":message, "start":Date.now()};
	D.actionStack.push(action);
	$("#status").html(message);
	if (message.toLowerCase()=="done"){
		$("#status").html(message);
		return;
	}//endif

	D.println("start "+message+" "+action.start.format("HH:mm:ss"));

	//JUST SHOW MESSAGE FOR THREE SECONDS
	$("#status").html(message);
	if (!waitForDone) setTimeout(function(){D.actionDone(action, true);}, 3000);
	return action;		//RETURNED IF YOU WANT TO REMOVE IT SOONER
};//method


D.actionDone=function(action){
	action.end=Date.now();

	if (D.actionStack.length==0) {
		$("#status").html("Done");
		return;
	}//endif

	var i=D.actionStack.indexOf(action);
	if (i>=0) D.actionStack.splice(i, 1);

	D.println("done "+action.message+" "+action.end.format("HH:mm:ss")+" ("+action.end.subtract(action.start).floor(Duration.SECOND).toString()+")");

	if (D.actionStack.length==0){
		$("#status").html("Done");
	}else{
		$("#status").html(D.actionStack[D.actionStack.length-1].message);
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
		return this.description + " caused by (" + this.cause.message + ")";
	}//endif
};



