/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


if (window['import' + 'Script'] === undefined) var importScript = function(){
};


var Map = {};


////////////////////////////////////////////////////////////////////////////////
// undefined EFFECTIVELY REMOVES THE KEY FROM THE MAP
// null IS A VALID VALUE INDICATING THE VALUE IS UNKNOWN
////////////////////////////////////////////////////////////////////////////////
(function(){
	Map.newInstance = function(key, value){
		if (key==null){
			Log.error("expecting a string key")
		}//endif
		var output = {};
		output[key] = value;
		return output;
	};//method

	Map.zip = function(keys, values){
		// LIST OF [k, v] TUPLES EXPECTED
		// OR LIST OF keys AND LIST OF values
		var output = {};

		if (values === undefined) {
			keys.forall(function(kv){
				//LIST OF [k, v] TUPLES EXPECTED
				output[kv[0]] = kv[1];
			});
		} else {
			keys.forall(function(k, i){
				output[k] = values[i];
			});
		}//endif

		return output;
	};//method


	Map.copy = function(from, to){
		if (to === undefined) to = {};
		var keys = Object.keys(from);
		for (var k = 0; k < keys.length; k++) {
			var v = from[keys[k]];
			if (v === undefined) continue;  //DO NOT ADD KEYS WITH NO VALUE
			to[keys[k]] = v;
		}//for
		return to;
	};

	/**
	 * IF dest[k]==undefined THEN ASSIGN arguments[i][k]
	 * @param dest
	 * @returns {*}
   */
	Map.setDefault = function(dest){
		function _setDefault(dest, source, path){
			var keys = Object.keys(source);
			for (var k = 0; k < keys.length; k++) {
				var key = keys[k];
				var value = dest[key];
				if (value == null) {
					dest[key] = source[key];
				}else if (!Map.isMap(value)){
					//DO NOTHING
				}else if (path.indexOf(value)!=-1){
					//DO NOTHING
				}else{
					dest[key] = _setDefault(value, source[key], path.concat([value]));
				}//endif
			}//for
			return dest;
		}//function

		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			if (source === undefined) {
				continue;
			}else if (dest == null){
				if (Map.isMap(source)) {
					return _setDefault({}, source, []);
				}else{
					dest = source;
					break;
				}//endif
			}else if (Map.isMap(dest)) {
				return _setDefault(dest, source, []);
			}else{
				break;
			}//endif
		}//for
		return dest;
	};

	Map.jsonCopy = function(value){
		if (value === undefined) return undefined;
		return JSON.parse(JSON.stringify(value));
	};

	Map.clone = Map.jsonCopy;


	//IF map IS NOT 1-1 THAT'S YOUR PROBLEM
	Map.inverse = function(map){
		var output = {};
		Map.forall(map, function(k, v){
			output[v] = k;
		});
		return output;
	};//method


	//THROW AN ERROR IF WE DO NOT SEE THE GIVEN ATTRIBUTE IN THE LIST
	Map.expecting = function(obj, keyList){
		for (i = 0; i < keyList.length; i++) {
			if (obj[keyList[i]] === undefined) Log.error("expecting object to have '" + keyList[i] + "' attribute");
		}//for
	};

	// ASSUME THE DOTS (.) IN fieldName ARE SEPARATORS
	// AND THE RESULTING LIST IS A PATH INTO THE STRUCTURE
	// (ESCAPE "." WITH "\\.", IF REQUIRED)
	Map.get = function(obj, path){
		if (obj === undefined || obj == null) return obj;
		if (path==".") return obj;

		var pathArray = splitField(path);
		for (var i = 0; i < pathArray.length; i++) {
			var step = pathArray[i];
			if (step == "length") {
				obj = obj.length
			}else if (aMath.isInteger(step)){
				obj = obj[step];
			}else if (isArray(obj)){
				var temp = [];
				for (var j = obj.length; j--;) temp[j] = obj[j][step];
				obj = temp;
			} else {
				obj = obj[step];
			}//endif
			if (obj === undefined || obj == null) return undefined;
		}//endif
		return obj;
	};//method

	Map.set = function(obj, path, value){
		if (obj === undefined || obj == null || path=="."){
			Log.error("must be given an object ad field");
		}//endif

		var pathArray = splitField(path);
		var o = obj;
		for (var i = 0; i < pathArray.length-1; i++) {
			var step = pathArray[i];
			var val = o[step];
			if (val===undefined || val==null){
				val={};
				o[step]=val;
			}//endif
			o=val;
		}//endif
		o[pathArray[i]]=value;
		return obj;
	};//method


	//RETURN TRUE IF MAPS LOOK IDENTICAL
	Map.equals = function(a, b){
		var keys = Object.keys(a);
		for (var i = keys.length; i--;) {
			var key = keys[i];
			if (b[key] != a[key]) return false;
		}//for

		keys = Object.keys(b);
		for (i = keys.length; i--;) {
			key = keys[i];
			if (b[key] != a[key]) return false;
		}//for

		return true;
	};//method


	var forAllKey = function(map, func){
		//func MUST ACCEPT key, value PARAMETERS
		var keys = Object.keys(map);
		for (var i = keys.length; i--;) {
			var key = keys[i];
			var val = map[key];
			if (val !== undefined) func(key, val);
		}//for
	};

	Map.forall = forAllKey;
	Map.items = forAllKey;

	var countAllKey = function(map){
		var count = 0;
		var keys = Object.keys(map);
		for (var i = keys.length; i--;) {
			var key = keys[i];
			var val = map[key];
			if (val !== undefined) count++;
		}//for
		return count;
	};


	function mapAllKey(map, func){
		//func MUST ACCEPT key, value, index PARAMETERS
		var output = [];
		var keys = Object.keys(map);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = map[key];
			if (val !== undefined) {
				var result = func(key, val, i);
				if (result !== undefined) output.append(result);
			}//endif
		}//for
		return output;
	};

	Map.map=mapAllKey;

	//RETURN ARRAY OF {"key":key, "value":val} PAIRS
	Map.getItems = function getItems(map){
		var output = [];
		var keys = Object.keys(map);
		for (var i = keys.length; i--;) {
			var key = keys[i];
			var val = map[key];
			if (val !== undefined) {
				output.push({"key": key, "value": val});
			}//endif
		}//for
		return output;
	};//function


	Map.getValues = function getValues(map){
		var output = [];
		var keys = Object.keys(map);
		for (var i = keys.length; i--;) {
			var val = map[keys[i]];
			if (val !== undefined) output.push(val);
		}//for
		return output;
	};
	Map.codomain = Map.getValues;
	Map.values = Map.getValues;


	//RETURN KEYS
	Map.domain = function(map){
		var output = [];
		var keys = Object.keys(map);
		for (var i = keys.length; i--;) {
			var key = keys[i];
			var val = map[key];
			if (val !== undefined) output.push(key);
		}//for
		return output;
	};//method
	Map.keys = Map.domain;
	Map.getKeys = Map.domain;

	//RETURN LEAVES
	Map.leafItems = function(map){
		function _leaves(map, prefix){
			var output = [];
			var keys = Object.keys(map);
			for (var i = keys.length; i--;) {
				var key = keys[i];
				var val = map[key];

				var fullname = key.replaceAll(".", "\\.");
				if (prefix) fullname=prefix+"."+fullname;

				if (val==null){
					//do nothing
				}else if (Map.isObject(val)){
					output.extend(_leaves(val, fullname))
				}else{
					output.append([fullname, val])
				}//endif
			}//for
			return output;
		}
		return _leaves(map, null);
	};//method
	Map.getLeafItems = Map.leafItems;

	Map.isObject = function (val) {
			if (val === null) { return false;}
			return ( (typeof val == 'function') || (typeof val == 'object') );
	};
	Map.isMap = function(val){
		if (val === null) { return false;}
		return (typeof val == 'object')
	};

})();


//USE THE MAP FOR REVERSE LOOKUP ON codomain VALUES PROVIDED
//SINCE THE MAP CODOMAIN IS A VALUE, === IS USED FOR COMPARISION
var reverseMap = function(map, codomain){
	var output = [];
	codomain.forall(function(c, i){
		Map.forall(map, function(k, v){
			if (v === c) output.push(k);
		});
	});
	return output;
};


//RETURN FIRST NOT NULL, AND DEFINED VALUE
function coalesce(){
	var args = arguments;
	if (args instanceof Array && args.length == 1) {
		if (arguments[0] == null) {
			return null;
		} else {
			args = arguments[0]; //ASSUME IT IS AN ARRAY
		}//endif
	}//endif

	var a;
	for (var i = 0; i < args.length; i++) {
		a = args[i];
		if (a !== undefined && a != null) return a;
	}//for
	return null;
}//method

/**
 * COALESCE SET OPERATION
 * @param arrays - AN ARRAY OF ARRAYS,
 * @returns {Array} - zipped
 */
function COALESCE(values){
	var a;
	for (var i = 0; i < values.length; i++) {
		a = values[i];
		if (a !== undefined && a != null) return a;
	}//for
	return null;
}//method

/**
 * ZIP SET OPERATION
 * @param arrays - AN ARRAY OF ARRAYS,
 * @returns {Array} - TRANSPOSE, WITH LENGTH OF THE LONGEST ARRAY
 */
function ZIP(arrays){
	var temp=arrays.mapExists(Array.newInstance);
	var max = aMath.MAX(temp.mapExists(function(v){
		return v.length;
	}));
	var output = [];
	for (var i = max; i--;) {
		output[i] = temp.mapExists(function(vv){
			return vv[i];
		});
	}//for
	return output;
}//function

function zip(){
	return ZIP(arguments);
}




var Util = {};

Util.returnNull = function(__row){
	return null;
};//method

(function(){
	var next = 0;

	Util.UID = function(){
		next++;
		return next;
	};//method
})();


//POOR IMPLEMENTATION
/*
 * @return {string} A Random GUID
 */
Util.GUID = function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
		var r = aMath.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};//method


function splitField(fieldname){
	try {
		return fieldname.replaceAll("\\.", "\b").split(".").mapExists(function(v){
			return v.replaceAll("\b", ".");
		});
	} catch (e) {
		Log.error("Can not split field", e);
	}//try
}//method

function literalField(fieldname){
	return fieldname.replaceAll(".", "\\.")
}//method



deepCopy = function(value) {
		if (typeof value !== "object" || !value)
				return value;

	var copy;
	var k;
		if (Array.isArray(value)){
				copy = [];
				for (k=value.length;k--;) copy[k] = deepCopy(value[k]);
				return copy;
		}//endif

		var cons = value.constructor;
		if (cons === RegExp || cons === Date) return value;

		copy = cons();
	Map.forall(value, function(k, v){copy[k]=deepCopy(v);});
	return copy;
};


function isFunction(f){
	return typeof f === 'function'
};
