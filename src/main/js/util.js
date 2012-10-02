Math.isNumeric=function(input){
	return (input >=0.0 || input < 0.0);
};

Math.sign=function(value){
	return value>0.0?1.0:(value<0.0?-1.0:0.0);
};

String.join=function(list, seperator){
	var output="";

	for(i in list){
		if (output!="") output+=seperator;
		output+=list[i];
	}//for
	return output;
};




var Util={};

Util.copy=function(from, to){
	var keys=Object.keys(from);
	for(k in keys) to[keys[k]]=from[keys[k]];
	return to;
};

Util.returnNull=function(__row){
	return null;
};//method
