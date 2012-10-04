Math.isNumeric=function(input){
	return (input >=0.0 || input < 0.0);
};

Math.sign=function(value){
	return value>0.0?1.0:(value<0.0?-1.0:0.0);
};

String.join=function(list, seperator){
	var output="";

	for(var i in list){
		if (output!="") output+=seperator;
		output+=list[i];
	}//for
	return output;
};






var Util={};

Util.copy=function(from, to){
	var keys=Object.keys(from);
	for(var k in keys) to[keys[k]]=from[keys[k]];
	return to;
};

Util.jsonCopy=function( obj ) {
	return JSON.parse(JSON.stringify(obj));;
};

Util.returnNull=function(__row){
	return null;
};//method


///
/// EXPECTING AN OBJECT WITH KEY VALUE PAIRS
String.prototype.replaceAll=function(values){
    var output=Util.jsonCopy(this);

    while(true){
        var s=output.indexOf('{');
        if (s<0) return output;
        var e=output.indexOf('}', s);
        if (e<0) return output;
        var key=output.substring(s+1, e);
        if (output.substring(s+1, e) in values){
            output=output.replace(output.substring(s, e+1), values[key]);
        }//endif
    }//while
};//method

String.prototype.leftBut=function(amount){
	return this.substring(0, this.length-amount);
};//method



var List={};

//RETURN LIST OF COMMON VALUES
List.intersect=function(a, b){
	var output=[];
	for(var i in a){
		for(var j in b){
			if (a[i]==b[j]){
				output.push(a[i]);
				break;
			}//endif
		}//for
	}//for
	return output;
};//method