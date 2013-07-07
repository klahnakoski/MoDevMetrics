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

D.addLog=function(logger){
	if (!logger.println) D.println("Expecting a logger with println() method");
	D.logs.push(logger);
};

D.addLog({"println":function(message){console.info(message);}});

D.addLogToElement=function(id){
	$("#"+id).html("");
	D.addLog({
		"println":function(message){
			$("#"+id).append(CNV.String2HTML(message)+"<br>");
		}
	});
};

D.println = function(message){
	try{
		if (typeof(message)!="string") message=CNV.Object2JSON(message);
	}catch(e){
	}//try
	message=Date.now().addTimezone().format("HH:mm:ss - ")+message;

	D.logs.forall(function(v){
		v.println(message);
	});
};//method

D.error = function(description, cause){
	var e=new Exception(description, cause);
//	D.alert(description);
	console.error(e.toString());
	throw e;
};//method

D.warning = function(description, cause){
	var e=new Exception(description, cause);
	console.warn(e.toString());
};//method

D.alert=function(message, ok_callback, cancel_callback){
	D.println(message);
	
	var d=$('<div>'+message+"</div>").dialog({
		title:"Alert",
		draggable: false,
		modal: true,
		resizable: false,

		buttons: {
			"OK": function () { $(this).dialog("close"); if (ok_callback) ok_callback(); },
			"Cancel":cancel_callback ? function () { $(this).dialog("close"); cancel_callback(); } : undefined
		}
	});

//	if (!ok_callback && !cancel_callback){
//		setTimeout(function(){$(d).dialog("close");}, 10000);
//	}//endif
};//method


//TRACK ALL THE ACTIONS IN PROGRESS
D.actionStack=[];
D.action=function(message, waitForDone){
	var action={"message":message, "start":Date.now()};

	if (message.length>30){
		message=message.left(27)+"...";
	}//endif

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
	A: for(let i=0;i<keyList.length;i++){
		if (keyList[i] instanceof Array){
			for(let j=0;j<keyList[i].length;j++){
				if (obj[keyList[i][j]]!==undefined) continue A;
			}//for
			D.error("expecting object to have one of "+CNV.Object2JSON(keyList[i])+" attribute");
		}else{
			if (obj[keyList[i]]===undefined) D.error("expecting object to have '"+keyList[i]+"' attribute");
		}//endif
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



