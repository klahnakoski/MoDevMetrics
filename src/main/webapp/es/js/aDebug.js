/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



importScript([
	"../lib/jquery.js",
	"../lib/jquery-ui/js/jquery-ui-1.10.2.custom.js",
	"../lib/jquery-ui/css/start/jquery-ui-1.10.2.custom.css"
]);



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
		$('<div>'+message+"</div>").dialog({
		title:"Alert",
		draggable: false,
		modal: true,
		resizable: false,

		buttons: {
			"OK": function () { $(this).dialog("close"); if (ok_callback) ok_callback(); },
			"Cancel":cancel_callback ? function () { $(this).dialog("close"); cancel_callback(); } : undefined
		}
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


ASSERT={};
ASSERT.hasAttributes=function(obj, keyList){
	for(let i=0;i<keyList.length;i++){
		if (obj[keyList[i]]===undefined) D.error("expecting object to have '"+keyList[i]+"' attribute");
	}//for
};









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



Exception.prototype.toString=function(){
	if (this.cause===undefined){
		return this.message;
	}else if (this.cause instanceof Exception){
		return this.message + " caused by (\n" + this.cause.toString().indent(1) + "\n)\n";
	}else{
		return this.message + " caused by (" + this.cause.message + ")";
	}//endif
};



