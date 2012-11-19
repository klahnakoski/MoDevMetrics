
//INSPIRED FROM  https://github.com/airportyh/trampoline.js/blob/master/6_add_exception.html

importScript("util.js");

aThread=function(gen){
	if (typeof(gen)=="function") gen=gen();	//MAYBE THE FUNCTION WILL CREATE A GENERATOR
	if (String(gen) !== '[object Generator]'){
		D.error("You can not pass a function.  Pass a generator! (have function use the yield keyword instead)");
	}//endif
	this.keepRunning=true;
	this.stack = [gen];
};

aThread.run=function(gen){
	var output=new aThread(gen);
	output.start();
	return output;
};//method

aThread.numRunning=0;

aThread.showWorking=function(){
	var l=$(".loading");
	l.show();
};
aThread.hideWorking=function(){
	var l=$(".loading");
	l.hide();
};


aThread.prototype.start=function(){
	aThread.numRunning++;
	aThread.showWorking();
	this.resume(this.stack.pop());
};

aThread.prototype.resume=function(retval){
	aThread.showWorking();
	while (this.keepRunning){
		if (String(retval) === '[object Generator]'){
			this.stack.push(retval);
			retval = undefined
		}else if (retval === aThread.Suspend){
			break;
		}else if (retval instanceof aThread.Suspend){
			this.currentRequest=retval.request;
			break;
		}else if (retval === aThread.Resume){
			var self=this;
			retval = function(retval){
				self.currentRequest=undefined;
				self.resume(retval);
			};
		}else{
			if (this.stack.length==0){
				D.error("what happened here?");
			}//endif
			this.stack.last().close();			//CLOSE THE GENERATOR
			this.stack.pop();

			if (this.stack.length==0){
				aThread.numRunning--;
				if (aThread.numRunning==0){
					aThread.hideWorking();
				}//endif
				this.keepRunning=false;
				break;
			}//endif

		}//endif


		var gen = this.stack.last();
		try{
			if (gen.history===undefined) gen.history=[];
			gen.history.push(retval===undefined ? "undefined" : retval);

			if (retval instanceof Exception){
				retval = gen["throw"](retval);  //THROW METHOD OF THE GENERATOR IS CALLED, WHICH IS SENT TO CALLER AS thrown EXCEPTION
			}else{
				retval = gen.send(retval)
			}//endif
		}catch(e){
			if (e instanceof StopIteration){
				retval=undefined;	//HAPPENS WHEN THE CALLED GENERATOR IS DONE
			}else{
				retval=e;
			}//endif
		}//try
	}//while

	if (!this.keepRunning) this.kill();
};

aThread.prototype.kill=function(){
	this.keepRunning=false;
	if (this.currentRequest!==undefined){
		this.currentRequest.kill();
		this.currentRequest=undefined;
	}//endif
	for(var i=this.stack.length;i--;){
		try{
			this.stack[i].close();
		}catch(e){

		}//try
	}//for
	this.stack=[];
};




//DO NOT RESUME FOR A WHILE
aThread.sleep=function(millis) {
    setTimeout((yield (aThread.Resume)), millis);
    yield (aThread.Suspend);
};

//LET THE MAIN EVENT LOOP GET SOME ACTION
aThread.yield=function(millis) {
    setTimeout((yield (aThread.Resume)), 1);
    yield (aThread.Suspend);
};

//CALL THE funcTION WITH THE GIVEN PARAMETERS
//WILL ADD success AND error FUNCTIONS TO PARAM TO CAPTURE RESPONSE
aThread.call=function(func, param){
	param.success=yield (aThread.Resume);
	param.error=function(){
		param.success(Exception.error(arguments));
	};
	func(param);
	yield (aThread.Suspend);
};//method






//YOU SHOULD NOT NEED THESE UNLESS YOU ARE CONVERTING ASYNCH CALLS TO SYNCH CALLS
aThread.Resume = {"name":"resume"};
aThread.Suspend = function(request){
	this.name="suspend";
	this.request=request;	//KILLABLE OBJECT
};
aThread.Suspend.name="suspend";

