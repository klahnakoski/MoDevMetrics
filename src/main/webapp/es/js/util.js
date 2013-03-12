/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var Map={};

Map.newInstance=function(key, value){
	var output={};
	output[key]=value;
	return output;
};//method

Map.copy = function(from, to){
	if (to===undefined) to={};
	var keys = Object.keys(from);
	for(var k = 0; k < keys.length; k++){
		var v=from[keys[k]];
		if (v===undefined) continue;	//DO NOT ADD KEYS WITH NO VALUE
		to[keys[k]] = v;
	}//for
	return to;
};


//THROW AN ERROR IF WE DO NOT SEE THE GIVEN ATTRIBUTE IN THE LIST
Map.expecting=function(obj, keyList){
	for(let i=0;i<keyList.length;i++){
		if (obj[keyList[i]]===undefined) D.error("expecting object to have '"+keyList[i]+"' attribute");
	}//for
};


Map.codomain=function(map){
	var output=[];
	var keys=Object.keys(map);
	for(var i=keys.length;i--;){
		var val=map[keys[i]];
		if (val!==undefined) output.push(val);
	}//for
	return output;
};//method


Map.domain=Object.keys;


//RETURN TRUE IF MAPS LOOK IDENTICAL
Map.equals=function(a, b){
	forAllKey(a, function(k, v, i){
		if (b[k]!=v) return false;
	});
	forAllKey(b, function(k, v, i){
		if (a[k]!=v) return false;
	});
	return true;
};//method


var forAllKey=function(map, func){
	var keys=Object.keys(map);
	for(var i=keys.length;i--;){
		var key=keys[i];
		var val=map[key];
		if (val!==undefined) func(key, val);
	}//for
};

var countAllKey=function(map){
	var count=0;
	var keys=Object.keys(map);
	for(var i=keys.length;i--;){
		var key=keys[i];
		var val=map[key];
		if (val!==undefined) count++;
	}//for
	return count;
};

var mapAllKey=function(map, func){
	var output=[];
	var keys=Object.keys(map);
	for(var i=keys.length;i--;){
		var key=keys[i];
		var val=map[key];
		output.push(func(key, val));
	}//for
	return output;
};

if (window['importScript'] === undefined) importScript=function(){};

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

Array.prototype.insert=function(index, value){
	this.splice(index, 0, value);
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
	return this;
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

Array.prototype.left=function(num){
	return this.slice(0, num);
};

Array.prototype.leftBut = function(amount){
	return this.slice(0, this.length - amount);
};//method

Array.prototype.right=function(num){
	return this.slice(Math.max(0, this.length-num));
};

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
	if (to===undefined) to={};
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
		var r = aMath.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};//method


/// REPLACE ALL INSTANCES OF find WITH REPLACE, ONLY ONCE
String.prototype.replaceAll = function(find, replace){
	return this.split(find).join(replace);
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
	return this.substring(0, aMath.min(this.length, amount));
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


aMath={};
aMath.PI=Math.PI;

aMath.isNumeric = function(n){
	if (n==null) return null;
	return !isNaN(parseFloat(n)) && isFinite(n);
};

aMath.sign = function(n){
	if (n==null) return null;
	return n > 0.0 ? 1.0 : (n < 0.0 ? -1.0 : 0.0);
};

aMath.abs=function(n){
	if (n==null) return null;
	return Math.abs(n);
};


aMath.round=function(value, rounding){
	if (rounding===undefined) return Math.round(value);
	var d=Math.pow(10, rounding);
	return Math.round(value*d)/d;
};//method


aMath.min=function(){
	var min=null;
	for(var i=0;i<arguments.length;i++){
		if (arguments[i]==null) continue;
		if (min==null || min>arguments[i]) min=arguments[i];
	}//for
	return min;
};//method


aMath.max=function(){
	var max=null;
	for(var i=0;i<arguments.length;i++){
		if (arguments[i]==null) continue;
		if (max==null || max<arguments[i]) max=arguments[i];
	}//for
	return max;
};//method

//
aMath.average=function(array){
	var total=0.0;
	var count=0;
	for(var i=0;i<array.length;i++){
		if (array[i]==null) continue;
		total+=array[i];
		count++;
	}//for
	if (count==0) return null;
	return total/count;
};//method



aMath.floor=Math.floor;
aMath.ceil=Math.ceil;
aMath.ceiling=Math.ceil;
aMath.log=Math.log;
aMath.random=Math.random;

(function(){
	function Cart(x, y){
		this.x=x;
		this.y=y;
	}
	aMath.Cart=Cart;

	aMath.Cart.prototype.toPolar=function(){
		var r=Math.sqrt(this.x*this.x + this.y*this.y);
		var t=Math.atan2(this.y, this.x);
		return new Polar(r, t);
	};


	function Polar(r, t){
		this.r=r;
		this.t=t;
	}
	aMath.Polar=Polar;

	var D2R=Math.PI/180;
	var R2D=1/D2R;

	aMath.Polar.prototype.toCart=function(){
		var x=this.r*Math.sin(this.t);
		var y=this.r*Math.cos(this.t);
		
		return new Cart(x, y);
	};

	aMath.Polar.prototype.addRadians=function(rads){
		var t=this.t+rads;
		return new Polar(this.r, t);
	};
	aMath.Polar.prototype.rotate=aMath.Polar.prototype.addRadians;

	aMath.Polar.prototype.addDegrees=function(degs){
		this.t+=degs*D2R;
	};




})();