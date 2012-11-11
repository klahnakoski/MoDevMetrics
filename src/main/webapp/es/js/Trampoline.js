
//ORIGINALLY FROM https://github.com/airportyh/trampoline.js/blob/master/6_add_exception.html

importScript("util.js");

aThread={};
aThread.run=function(gen){
	var stack = [];

    function startBouncing(retval){
        try{
            while (true){
                if (String(retval) === '[object Generator]'){
                    stack.push(retval);
                    retval = undefined
                }else if (retval === aThread.Suspend){
                    break;
                }else if (retval === aThread.Continuation){
                    retval = startBouncing
                }else if (retval instanceof Exception){
                    stack.pop().close();
                    stack.last().throw(retval);  //THROW METHOD OF THE GENERATOR IS CALLED, WHICH IS SENT TO CALLER AS thrown EXCEPTION
                }else{
                    stack.pop().close();  //CLOSE THE GENERATOR
                }//endif
                gen = stack.last();
                if (!gen) break;
                retval = gen.send(retval)
            }
        }catch(e if e === aThread.Stop){
            console.log('Program ended.')
        }//try
    }
    startBouncing(gen);
};

aThread.Continuation = {};
aThread.Suspend = {};
aThread.Stop={};



aThread.sleep=function(millis) {
    setTimeout((yield aThread.Continuation), millis);
    yield aThread.Suspend;
};

