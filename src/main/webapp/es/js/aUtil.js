/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


if (window['import'+'Script'] === undefined) var importScript=function(){};



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

Map.jsonCopy=function(value){
	return JSON.parse(JSON.stringify(value));
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

Util.returnNull = function(__row){
	return null;
};//method

Util.UID=function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = aMath.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};//method



