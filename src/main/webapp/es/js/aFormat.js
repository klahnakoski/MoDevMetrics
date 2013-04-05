



importScript([
	"aString.js",
	"../lib/jquery.js",
	"../lib/jquery.numberformatter.js"
]);

var aFormat={};


(function(){
	aFormat.number=function(value, format){
		if (format.trim().left(1)=="+"){
			//FORCE PLUS SIGN
			if (value<=0) format="+"+format.rightBut(1);
		}//endif
		
		return $.formatNumber(value, {"format":format});
	};//method




})();