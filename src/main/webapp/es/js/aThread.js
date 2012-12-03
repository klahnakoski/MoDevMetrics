
//INSPIRED FROM  https://github.com/airportyh/trampoline.js/blob/master/6_add_exception.html

importScript("util.js");

aThread=function(gen){
	if (typeof(gen)=="function") gen=gen();	//MAYBE THE FUNCTION WILL CREATE A GENERATOR
	if (String(gen) !== '[object Generator]'){
		D.error("You can not pass a function.  Pass a generator! (have function use the yield keyword instead)");
	}//endif
	this.keepRunning=true;
	this.stack = [gen];
	this.nextYield=new Date().getMilli()+aThread.MAX_BLOCK_TIME;
};

aThread.MAX_BLOCK_TIME=200;	//200ms IS THE MAXMIMUM TIME A PIECE OF CODE SHOULD HOG THE MAIN THREAD

aThread.run=function(gen){
	var output=new aThread(gen);
	output.start();
	return output;
};//method

//FEELING LUCKY?  MAYBE THIS GENERATOR WILL NOT DELAY AND RETURN A VALID VALUE
aThread.runSynchonously=function(gen){
	if (String(gen) !== '[object Generator]'){
		D.error("You can not pass a function.  Pass a generator! (have function use the yield keyword instead)");
	}//endif

	var thread=new aThread(gen);
	var result=thread.start();
	if (result===aThread.Suspend)
		D.error("Suspend was called while trying to synchronously run generator");
	return result;
};//method


aThread.getStackTrace=function(depth){
	var trace;
	try{
		this.undef();  //deliberate error
	}catch(e){
		trace=e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^[\(@]/gm, '{anonymous}()@').split('\n');
	}//try
	return trace.slice(depth+1);
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
	return this.resume(this.stack.pop());
};

function aThread_prototype_resume(retval){
	aThread.showWorking();
	while (this.keepRunning){
		if (String(retval) === '[object Generator]'){
			this.stack.push(retval);
			retval = undefined
		}else if (retval === aThread.Yield){
			if (this.nextYield<Date.now().getMilli()){
				var self_=this;
				setTimeout(function(retval){
					self_.nextYield=new Date().getMilli()+aThread.MAX_BLOCK_TIME;
					self_.currentRequest=undefined;
					self_.resume(retval);
				}, 1);
				return aThread.Suspend;
			}//endif
		}else if (retval === aThread.Suspend){
			if (!this.keepRunning) this.kill(new Exception("thread aborted"));
			return retval;
		}else if (retval instanceof aThread.Suspend){
			this.currentRequest=retval.request;
			if (!this.keepRunning) this.kill(new Exception("thread aborted"));
			return aThread.Suspend;
		}else if (retval === aThread.Resume){
			var self=this;
			retval = function(retval){
				self.nextYield=new Date().getMilli()+aThread.MAX_BLOCK_TIME;
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
				this.kill(retval);
				return retval;
			}//endif

		}//endif


		var gen = this.stack.last();
		try{
			if (gen.history===undefined) gen.history=[];

//			gen.history.push(retval===undefined ? "undefined" : retval);

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

	D.error("Should not get here");
	//if (!this.keepRunning) this.kill();
}
aThread.prototype.resume=aThread_prototype_resume;

aThread.prototype.kill=function(retval){
	this.returnValue=retval;				//REMEMBER FO THREAD THAT JOINS WITH THIS
	this.keepRunning=false;

	//HOPEFULLY cr WILl BE UNDEFINED, OR NOT, (NOT CHANGING)
	var cr=this.currentRequest;
	this.currentRequest=undefined;

	if (cr!==undefined){
		//SOMETIMES this.currentRequest===undefined AT THIS POINT (LOOKS LIKE REAL MUTITHREADING?!)
		try{
			cr.kill();
		}catch(e){
			D.error("kill?", cr)
		}
	}//endif
	for(var i=this.stack.length;i--;){
		try{
			this.stack[i].close();
		}catch(e){

		}//try
	}//for
	this.stack=[];
};


//PUT AT THE BEGINNING OF A GNERATOR TO ENSURE IT WILL ONLY BE CALLED USING yield()
aThread.assertThreaded=function(){
	//GET CALLER AND DETERMINE IF RUNNING IN THREADED MODE
	if (arguments.callee.caller.caller.name!="aThread_prototype_resume")
		D.error("must call from a thread as \"yield (GUI.refresh());\" ");
};//method


//DO NOT RESUME FOR A WHILE
aThread.sleep=function(millis) {
    setTimeout((yield (aThread.Resume)), millis);
    yield (aThread.Suspend);
};

//LET THE MAIN EVENT LOOP GET SOME ACTION
aThread.yield=function() {
    yield (aThread.Yield);
};

//WAIT FOR OTHER THREAD TO FINISH
aThread.join=function(otherThread){
	if (otherThread.keepRunning) {
		//WE WILL SIMPLY MAKE THE JOINING THREAD LOOK LIKE THE otherThread's CALLER
		//(WILL ALSO GRAB ANY EXCEPTIONS THAT ARE THROWN FROM otherThread)
		var gen=aThread_join_resume(yield (aThread.Resume));
		gen.send();  //THE FIRST CALL TO send()
		otherThread.stack.prepend(gen);
		yield (aThread.Suspend);
	}else{
		yield (otherThread.returnValue);
	}//endif
};

//THIS GENERATOR EXPECTS send TO BE UN TWICE ONLY
//FIRST WITH NO PARAMETERS, AS REQUIRED BY ALL GENERATORS
//THE SEND RUN FROM THE JOINING THREAD TO RETURN THE VALUE
function aThread_join_resume(resumeFunction){
	var result=yield;	
	yield (resumeFunction(result));
	D.error("You used this wrong");
}//method

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
aThread.Yield = {"name":"yield"};  //BE COOPERATIVE, WILL PAUSEE VERY MAX_TIME_BLOCK MILLISECONDS
aThread.Suspend = function(request){
	if (request.kill===undefined) D.error("Expecting an object with kill() function");
	this.name="suspend";
	this.request=request;	//KILLABLE OBJECT
};
aThread.Suspend.name="suspend";




aThread_testFunction=function(){
	aThread.run(function(){
		var t=aThread.run(function(){
			yield (aThread.sleep(10000));	//REMOVING THIS WILL CHANGE ORDER, BUT STILL RETURN PROPER VALUE
			D.println("this is a test");
			yield ("return value");
		});
		D.println("this is first");
		var returnValue=yield (aThread.join(t));
		D.println("this is the return value: "+returnValue);
	});

};