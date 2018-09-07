////////////////////////////////////////////////////////////////////////////////
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
////////////////////////////////////////////////////////////////////////////////
// Author: Kyle Lahnakoski  (kyle@lahnakoski.com)
////////////////////////////////////////////////////////////////////////////////


//INSPIRED FROM  https://github.com/airportyh/trampoline.js/blob/master/6_add_exception.html


//TEST IF GENERATORS WORK
try {
	eval("(function*(){})");
} catch (e) {
	setTimeout(
		function () {
			$("body").html(
				'<div style="height:100%;width:100%;vertical-align: middle; text-align: center;"><h1>This page uses Javascript Generators!</h1>' +
				'<div style="line-height: 1em;font-size:1.5em;max-width:800px;  margin-left: auto; margin-right: auto;">I suggest using Firefox.  If you must use Google Chrome, you can enable Experimental Javascript at <a href="chrome://flags/#enable-javascript-harmony">chrome://flags/#enable-javascript-harmony</a> (and then reboot).<br>' +
				'If you must use IE, then I am sorry.</div>' +
				'</div>'
			);
		},
		5000  //A LITTLE DELAY WITH HOPE $ WILL BE DEFINED!! :)
	);
}//try


var Thread;

build = function () {
	"use strict";

	var currentTimestamp;
	if (Date.currentTimestamp) {
		currentTimestamp = Date.currentTimestamp;
	} else {
		currentTimestamp = Date.now;
	}//endif

	var DEBUG = false;
	var POPUP_ON_ERROR = true;
	var FIRST_BLOCK_TIME = 500;  //TIME UNTIL YIELD
	var NEXT_BLOCK_TIME = 150;  //THE MAXMIMUM TIME (ms) A PIECE OF CODE SHOULD HOG THE MAIN THREAD
	var YIELD = {"name": "yield"};  //BE COOPERATIVE, WILL PAUSE EVERY MAX_TIME_BLOCK MILLISECONDS

	//Suspend CLASS

	function suspend(request) {
		this.name = "suspend";
		this.request = request;
	}

	var Suspend = suspend;

	var DUMMY_GENERATOR = {
		"close": function () {
		}
	};

	//RETURN FIRST NOT NULL, AND DEFINED VALUE
	function coalesce() {
		var args = arguments;
		var a;
		for (var i = 0; i < args.length; i++) {
			a = args[i];
			if (a !== undefined && a != null) return a;
		}//for
		return null;
	}//method

	Thread = function (gen) {
		if (typeof(gen) == "function") {
			try {
				gen = gen();  //MAYBE THE FUNCTION WILL CREATE A GENERATOR
				if (String(gen) !== '[object Generator]') {
					Log.error("You can not pass a function.  Pass a generator! (have function use the yield keyword instead)");
				}//endif
			} catch (e) {
				Log.error("Expecting a Generator!", e);
			}//endif
		}//endif

		this.keepRunning = true;
		this.gen = null;    //CURRENT GENERATOR
		this.stack = [gen];
		this.nextYield = currentTimestamp() + FIRST_BLOCK_TIME;
		this.children = [];
		this.joined = [];   //FUNCTIONS TO RUN AFTER THREAD COMPLETED
	};

	Thread.YIELD = YIELD;


	//YOU SHOULD NOT NEED THESE UNLESS YOU ARE CONVERTING ASYNCH CALLS TO SYNCH CALLS
	//EVEN THEN, MAYBE YOU CAN USE Thread.call
	Thread.Resume = {"name": "resume"};
	Thread.Interrupted = new Exception("Interrupted");

	Thread.run = function (name, gen) {
		if (typeof(name) != "string") {
			gen = name;
			name = undefined;
		}//endif

		var output = new Thread(gen);
		output.name = name;
		output.start();
		return output;
	};//method


	//JUST LIKE RUN, ONLY DOES NOT REGISTER THE THREAD IN isRunning
	Thread.daemon = function (name, gen) {
		if (typeof(name) != "string") {
			gen = name;
			name = undefined;
		}//endif


		Thread.currentThread.addChild(this);

		//START IN SILENT MODE
		var output = new Thread(gen);
		output.name = name;
		output.resume(output.stack.pop());
		output.parentThread = Thread.currentThread;
		Thread.currentThread.addChild(this);
		return output;
	};//method


	//FEELING LUCKY?  MAYBE THIS GENERATOR WILL NOT DELAY AND RETURN A VALID VALUE BEFORE IT YIELDS
	//YOU CAN HAVE IT BLOCK THE MAIN TREAD FOR time MILLISECONDS
	Thread.runSynchronously = function (gen, time) {
		if (String(gen) !== '[object Generator]') {
			Log.error("You can not pass a function.  Pass a generator!");
		}//endif

		var thread = new Thread(gen);
		if (time !== undefined) {
			thread.nextYield = currentTimestamp() + time;
		}//endif
		var result = thread.start();
		if (result === Suspend)
			Log.error("Suspend was called while trying to synchronously run generator");
		if (result instanceof Exception) {
			throw result;
		} else {
			return result;
		}//endif
	};//method


	Thread.getStackTrace = function (depth) {
		var trace;
		try {
			this.undef();  //deliberate error
		} catch (e) {
			trace = e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^[\(@]/gm, '{anonymous}()@').split('\n');
		}//try
		return trace.slice(depth + 1);
	};//method


	//ADD A KILLABLE CHILD {"kill":function}
	function addChild(child) {
		this.children.push(child);
		child.parentThread = this;
	}//function
	Thread.prototype.addChild = addChild;

	var mainThread = {"name": "main thread", "children": [], "addChild": addChild};
	Thread.currentThread = mainThread;
	Thread.isRunning = [];

	//REPLACE THESE WHEN YOU WANT SIGNALS ABOUT WORKING THREADS
	Thread.showWorking = function () {
	};
	Thread.hideWorking = function () {
	};


	Thread.prototype.start = function () {
		Thread.isRunning.push(this);
		Thread.currentThread.addChild(this);
		Thread.showWorking(Thread.isRunning.length);
		return this.resume(this.stack.pop());
	};


	Thread.prototype.resume = function Thread_prototype_resume(retval) {
		Thread.showWorking(Thread.isRunning.length);
		while (this.keepRunning) {
			if (retval === YIELD) {
				if (this.nextYield < currentTimestamp()) {
					var self_ = this;
					setTimeout(function () {
							self_.nextYield = currentTimestamp() + NEXT_BLOCK_TIME;
							self_.currentRequest = undefined;
							self_.resume();
						}, 1
					);
					return Suspend;
				} else {
					//simply resume
				}//endif
			} else if (String(retval) === '[object Generator]') {
				this.stack.push(retval);
				retval = undefined
			} else if (retval instanceof Suspend) {
				if (retval.request) {
					this.addChild(retval.request)
				}//endif
				if (!this.keepRunning) this.kill(new Exception("thread aborted"));
				if (this.stack.length == 0)
					Log.error("Should not happen");
				return Suspend;
			} else if (retval === Thread.Resume) {
				(function (self) {
					retval = function (retval) {
						if (!self.keepRunning) {
							if (DEBUG) Log.note("Resuming dead thread " + self.name + " has no effect");
							return;
						}//endif
						if (DEBUG) Log.note("Resuming thread " + self.name);
						self.nextYield = currentTimestamp() + NEXT_BLOCK_TIME;
						self.currentRequest = undefined;
						self.resume(retval);
					};
				})(this);
			} else { //RETURNING A VALUE/OBJECT/FUNCTION TO CALLER
				var expendedGenerator = this.stack.pop();
				if (expendedGenerator && expendedGenerator.close !== undefined)
					expendedGenerator.close(); //ONLY HAPPENS WHEN EXCEPTION IN THREAD IS NOT CAUGHT

				if (this.stack.length == 0) {
					this.cleanup(retval);
					return retval;
				}//endif
			}//endif

			var selfThread = Thread.currentThread;
			Thread.currentThread = this;
			try {
				this.gen = this.stack[this.stack.length - 1];
				if (this.gen.history === undefined) this.gen.history = [];

				var result;
				if (retval instanceof Exception) {
					result = this.gen.throw(retval);  //THROW METHOD OF THE GENERATOR IS CALLED, WHICH IS SENT TO CALLER AS thrown EXCEPTION
				} else {
					result = this.gen.next(retval)
				}//endif
				retval = result.value;
			} catch (e) {
				retval = Exception.wrap(e);
			} finally {
				Thread.currentThread = selfThread;
			}//try
		}//while
		//CAN GET HERE WHEN THREAD IS KILLED AND Thread.Resume CALLS BACK
		this.kill(retval);
	};//function

	//THIS IS A MESS, CALLED FROM DIFFERENT LOCATIONS, AND MUST DISCOVER
	//CONTEXT TO RUN CORRECT CODE
	//retval===undefined - NORMAL KILL
	//retval===true - TOTAL KILL, NO TRY/CATCH (REALLY BAD) SUPPRESS THREAD EXCEPTION
	//retval instanceof Exception - THROW SPECIFIC THREAD EXCEPTION
	Thread.prototype.kill = function (retval) {
		if (!this.keepRunning) return;  //ALREADY DEAD

		var children = this.children.slice();  //CHILD THREAD WILL REMOVE THEMSELVES FROM THIS LIST
		for (var c = 0; c < children.length; c++) {
			var child = children[c];
			if (!child) continue;
			try {
				if (child.kill) {
					child.kill();
				} else if (child.abort) {
					child.abort();
				}//endif
			} catch (e) {
				Log.error("kill?", {}, e)
			}//try
		}//for

		if (this.stack.length > 0) {
			this.stack.push(DUMMY_GENERATOR); //TOP OF STACK IS THE RUNNING GENERATOR, THIS kill() CAME FROM BEYOND
			this.resume(Thread.Interrupted);  //RUN THE EXCEPTION HANDLER RIGHT NOW
		}//endif
		if (this.stack.length > 0) {
			this.keepRunning = false;
			Thread.isRunning.remove(this);
			Log.error("Expecting thread " + convert.string2quote(self.name) + " to have dealt with kill() immediately");
		}//endif
		if (this.keepRunning) {
			this.cleanup();
			Log.warning("not expected");
		}//endif
	};

	Thread.prototype.cleanup = function (retval) {
		if (DEBUG) Log.note("Cleanup " + this.name);
		if (!this.keepRunning) return;

		var children = this.children.slice(); //copy
		var exitEarly = false;
		var self = this;
		if (DEBUG) {
			if (children.length > 0) {
				Log.note("Join the child threads of " + this.name);
			} else {
				Log.note("Join the child threads of " + this.name);
			}//endif
		}//endif

		for (var c = 0; c < children.length; c++) {
			var childThread = children[c];
			if (!(childThread instanceof Thread)) continue;
			if (childThread.keepRunning) {
				if (DEBUG) Log.note("Joining to " + childThread.name);
				childThread.joined.push(function(retval){
					self.cleanup(retval)
				});
				exitEarly = true;
			}//endif
		}//for
		if (DEBUG) Log.note("Done join of child threads of "+this.name);
		if (exitEarly) return;
		this.children = [];

		this.threadResponse = retval;				//REMEMBER FOR THREAD THAT JOINS WITH THIS
		this.keepRunning = false;
		this.parentThread.children.remove(this);
		Thread.isRunning.remove(this);

		if (this.joined.length > 0) {
			if (DEBUG) Log.note(this.name + " has " + this.joined.length + " other items waiting to join, running them now.");
			var joined = this.joined.slice();  //COPY
			for (var f = 0; f < joined.length; f++) {
				try {
					var fun = joined[f];
					fun(retval);
				} catch (e) {
					Log.warning("not expected", e)
				}//try
			}//for
		} else if (retval instanceof Exception) {
			if (POPUP_ON_ERROR || DEBUG) {
				var details = retval.toString();
				if (details == "[object Object]") details = retval.message;
				Log.alert("Uncaught Error in thread: " + coalesce(this.name, "") + "\n  " + details);
			} else {
				Log.warning("Uncaught Error in thread: " + coalesce(this.name, "") + "\n  ", retval);
			}//endif
		}//endif

		if (Thread.isRunning.length == 0) {
			Thread.hideWorking();
		}//endif

		if (DEBUG && Thread.isRunning.length > 0) {
			Log.note("Threads running:\n"+Thread.isRunning.select("name").join(",\n").indent());
		}//endif
	};

	//PUT AT THE BEGINNING OF A GENERATOR TO ENSURE IT WILL ONLY BE CALLED USING yield()
	Thread.assertThreaded = function () {
		//GET CALLER AND DETERMINE IF RUNNING IN THREADED MODE
		if (arguments["callee"].caller.caller.name != "Thread_prototype_resume")
			Log.error("must call from a thread as \"yield (GUI.refresh());\" ");
	};//method

	//DO NOT RESUME FOR A WHILE
	Thread.sleep = function* (millis) {
		var resume = yield(Thread.Resume);

		if (DEBUG) {
			var threadName = Thread.currentThread.name;
			var temp = resume;
			resume = function () {
				Log.note("done sleep of " + millis + ", resuming thread " + threadName);
				temp()
			};
		}//endif

		var to = setTimeout(resume, millis);
		yield (Thread.suspend({
			"kill": function () {
				clearTimeout(to);
			}
		}))
	};

	//LET THE MAIN EVENT LOOP GET SOME ACTION
	// CALLING yield (Thread.YIELD) IS FASTER THAN yield (Thread.yield())
	Thread.yield = function* () {
		yield (YIELD);
	};

	//NEW SUSPEND OBJECT
	Thread.suspend = function (request) {
		if (request !== undefined) {
			if (request.kill === undefined) {
				if (request.abort === undefined) {
					Log.error("Expecting an object with kill() or abort() function");
				} else {
					request.kill = function () {
						try {
						    this.abort();
						}catch(e){
							//DO NOTHING
						}//try
					};//function
				}//endif
			}//endif
		}//endif
		return new Suspend(request);
	};


	//RETURNS A GENERATOR, BE SURE TO yield IT
	Thread.prototype.join = function (timeout) {
		return Thread.join(this, timeout);
	};


	//WAIT FOR OTHER THREAD TO FINISH
	Thread.join = function* (otherThread, timeout) {
		if (!otherThread.keepRunning) {
			yield (otherThread.threadResponse);
			return;
		}//endif

		var resumeWhenDone = yield(Thread.Resume);
		otherThread.joined.push(resumeWhenDone);
		if (timeout != null) {
			var self = Thread.currentThread;
			setTimeout(function () {
				if (DEBUG) Log.note("join timeout, resuming thread " + self.name);
				otherThread.joined.remove(resumeWhenDone);
				resumeWhenDone(Thread.TIMEOUT);
			}, timeout)
		}//endif

		if (DEBUG) Log.note("pausing thread " + Thread.currentThread.name + " while joining " + otherThread.name);
		yield (Thread.suspend());
	};


	/*
	 * RESUME WHEN ANY THREAD IN LIST DOES NOT FAIL AND IS DONE, OR
	 * THROW THE EXCEPTION OF THE LAST-COMPLETED-THREAD
	 */
	Thread.joinAny = function* (otherThreads) {
		var resumeCurrentThread = yield(Thread.Resume);

		var immediateResponse = (function (resumeCurrentThread) {
			var immediateResponse = undefined;
			var livingThreads = otherThreads.length;

			for (var i = 0; i < otherThreads.length; i++) {
				var otherThread = otherThreads[i];
				if (!otherThread.keepRunning) {
					livingThreads--;
					var retval = otherThread.threadResponse;
					if (resumeCurrentThread && (livingThreads == 0 || !(retval instanceof Exception))) {
						if (DEBUG) Log.note(otherThread.name + " already completed, continuing " + Thread.currentThread.name);
						resumeCurrentThread = null;
						immediateResponse = retval;
					}//endif
				} else {
					var resumeOnce = (function (otherThread) {
						//WRAP THE RESUME FUNCTION SO IT IS ONLY RUN ONCE
						return function (retval) {
							livingThreads--;
							if (resumeCurrentThread && (livingThreads == 0 || !(retval instanceof Exception))) {
								if (DEBUG) Log.note(otherThread.name + " completed, resuming thread...");
								var temp = resumeCurrentThread;
								resumeCurrentThread = null;
								temp(retval)
							}else{
								if (DEBUG) Log.note(otherThread.name + " already resumed, returning previous returned value");
							}//endif
							return retval;
						};
					})(otherThread);
					otherThread.joined.push(resumeOnce);
					if (DEBUG) Log.note("adding thread " + otherThread.name + " to joinAny()");
				}//endif
			}//for

			return immediateResponse;
		})(resumeCurrentThread);

		if (immediateResponse === undefined) {
			if (DEBUG) Log.note("pausing thread " + Thread.currentThread.name + " while joinAny()");
			var delayedResponse = yield (Thread.suspend());
			yield (delayedResponse);
		} else {
			yield (immediateResponse);
		}//endif
	};

	//CALL THE funcTION WITH THE GIVEN PARAMETERS
	//WILL ADD success AND error FUNCTIONS TO param TO CAPTURE RESPONSE
	Thread.call = function* (func, param) {
		param.success = yield(Thread.Resume);
		param.error = function () {
			throw new Exception("callback to func was error:\n\t" + window.JSON.stringify(arguments), undefined);
		};
		var instance = func(param);
		yield (new Suspend(instance));
	};//method


};


if (window.Exception === undefined) {

	window.Exception = function (message, cause) {
		this.message = message;
		this.cause = cause;
	};

	window.Exception.wrap = function (e) {
		if (e instanceof Exception) {
			return e;
		} else {
			return new Exception("Error", e);
		}//endif
	};

	Array.prototype.remove = function (obj, start) {
		while (true) {
			var i = this.indexOf(obj, start);
			if (i == -1) return this;
			this.splice(i, 1);
		}//while
	};

	String.prototype.indent = function (numTabs) {
		if (numTabs === undefined) numTabs = 1;
		var indent = "\t\t\t\t\t\t".left(numTabs);
		var str = this.toString();
		var white = str.rightBut(str.rtrim().length); //REMAINING WHITE IS KEPT (CASE OF CR/LF ESPECIALLY)
		return indent + str.rtrim().replaceAll("\n", "\n" + indent) + white;
	};

}

if (!window.Log) {
	Log = {};
	Log.error = function (mess, cause) {
		console.error(mess);
		throw new Exception(mess, cause);
	};
	Log.warning = console.warn;
	Log.note = Log.note = function (v) {
		console.log(v);
	};
}//endif


build();
