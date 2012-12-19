

var forAllKey=function(map, func){
	var keys=Object.keys(map);
	for(var i=keys.length;i--;){
		var key=keys[i];
		var val=map[key];
		func(key, val);
	}//for
};

var mapAllKey=function(map, func){
	var output={};
	var keys=Object.keys(map);
	for(var i=keys.length;i--;){
		var key=keys[i];
		var val=map[key];
		output[key]=func(key, val);
	}//for
	return output;
};

if (window['importScript'] === undefined) importScript=function(){};

Math.isNumeric = function(n){
	return !isNaN(parseFloat(n)) && isFinite(n);
};

Math.sign = function(value){
	return value > 0.0 ? 1.0 : (value < 0.0 ? -1.0 : 0.0);
};

String.join = function(list, seperator){
	var output = "";

	for(var i = 0; i < list.length; i++){
		if (output != "") output += seperator;
		output += list[i];
	}//for
	return output;
};

//RETURN THE STRING BETWEEN THE start AND end
//IF end IS UNDEFINED, THEN GRABS TO END OF STRING
String.prototype.between=function(start, end){
	var s=this.indexOf(start);
	if (s==-1) return null;
	s+=start.length;
	if (end===undefined) return this.substring(s);

	var e=this.indexOf(end, s);
	if (e==-1) return null;
	return this.substring(s, e);
};


String.prototype.indent=function(numTabs){
	var indent="\t\t\t\t\t\t".left(numTabs);
	return indent+this.toString().replaceAll("\n", "\n"+indent);
};

String.prototype.rtrim=function(value){
	if (value===undefined) value=" ";

	var i=this.length-1;
	for(;i>=0;i--) if (this.charAt(i)!=value) break;

	return this.substring(0, i+1);
};

String.prototype.startsWith=function(value){
	return this.substring(0, value.length)==value;
};


Array.prototype.contains = function(value){
	for(var i = this.length; i--;){
		if (this[i] == value) return true;
	}//for
	return false;
};//method

Array.prototype.copy = function(){
	return this.slice(0);
};//method



Array.prototype.forall=function(func){
	for(var i=0;i<this.length;i++){
		func(this[i], i, this);
	}//for
};//method



Array.prototype.map=function(func){
	var output=[];
	for(var i=0;i<this.length;i++){
		var v=func(this[i], i);
		if (v===undefined || v==null) continue;
		output.push(v);
	}//for
	return output;
};//method

Array.prototype.appendArray=function(arr){
	for(var i=0;i<arr.length;i++){
		this.push(arr[i]);
	}//for
};//method

Array.prototype.prepend=Array.prototype.unshift;

Array.prototype.last=function(){
	return this[this.length-1];
};//method

Array.prototype.indexOf=function(value){
	for(var i=0;i<this.length;i++){
		if (this[i]==value) return i;
	}//for
	return -1;
};//method

Array.prototype.substring=Array.prototype.slice;


var Util = {};

//RETURN FIRST NOT NULL, AND DEFINED VALUE
Util.coalesce = function(){
	var a;
	for(var i=0;i<arguments.length;i++){
		a=arguments[i];
		if (a!==undefined && a!=null) return a;
	}//for
	return a;
};//method

Util.nvl = Util.coalesce;

Util.copy = function(from, to){
	var keys = Object.keys(from);
	for(var k = 0; k < keys.length; k++) to[keys[k]] = from[keys[k]];
	return to;
};

Util.jsonCopy = function(obj){
	return JSON.parse(JSON.stringify(obj));
};

Util.returnNull = function(__row){
	return null;
};//method

Util.UID=function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};//method


/// REPLACE ALL INSTANCES OF find WITH REPLACE, ONLY ONCE
String.prototype.replaceAll = function(find, replace){
	var output=this;
	var s=0;
	while(true){
		s = output.indexOf(find, s);
		if (s < 0) return output;
		output=output.replace(find, replace);
		s=s-find.length+replace.length;
	}//while
};//method



String.prototype.deformat = function(){
	var output=[];
	for(var i=0;i<this.length;i++){
		var c=this.charAt(i);
		if ((c>='a' && c<='z') || (c>='0' && c<='9')){
			output.push(c);
		}else if (c>='A' && c<='Z'){
			output.push(String.fromCharCode(c.charCodeAt(0)+32));
		}//endif
	}//for
	return output.join("");
};//method



///
/// EXPECTING AN OBJECT WITH KEY VALUE PAIRS
String.prototype.replaceVars = function(values){
	var output = Util.jsonCopy(this);

	while(true){
		var s = output.indexOf('{');
		if (s < 0) return output;
		var e = output.indexOf('}', s);
		if (e < 0) return output;
		var key = output.substring(s + 1, e);
		if (output.substring(s + 1, e) in values){
			output = output.replace(output.substring(s, e + 1), values[key]);
		}//endif
	}//while
};//method

String.prototype.left = function(amount){
	return this.substring(0, amount);
};//method

String.prototype.right = function(amount){
	return this.substring(this.length - amount);
};//method

String.prototype.leftBut = function(amount){
	return this.substring(0, this.length - amount);
};//method

String.prototype.rightBut = function(amount){
	return this.substring(amount, this.length);
};//method

String.prototype.endsWith=function(value){
	return this.substring(this.length - value.length)==value;
};//method

String.prototype["in"]=function(array){
	for(var i=array.length;i--;){
		if (array[i]==this) return true;
	}//for
	return false;
};//method


var List = {};

//RETURN LIST OF COMMON VALUES
List.intersect = function(a, b){
	var output = [];
	for(var i = 0; i < a.length; i++){
		for(var j = 0; j < b.length; j++){
			if (a[i] == b[j]){
				output.push(a[i]);
				break;
			}//endif
		}//for
	}//for
	return output;
};//method



if (Math.oldRound) throw "You can not call this util.js twice!!!"
Math.oldRound=Math.round;

Math.round=function(value, rounding){
	if (rounding===undefined) return Math.oldRound(value);
	var d=Math.pow(10, rounding);
	return Math.oldRound(value*d)/d;
};//method