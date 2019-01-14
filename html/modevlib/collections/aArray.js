/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../util/aUtil.js");



(function(){
	var DEBUG=true;


	Array.newInstance=function(value){
		if (value === undefined || value==null) return [];
		if (value instanceof Array) return value;
		return [value];
	};//method


	Array.newRange=function(min, max, interval){
		//RETURN AN ARRAY OF NUMBERS
		if (interval===undefined) interval=1;
		if (min>max) Log.error();

		var output=[];
		for(var i=min;i<max;i+=interval) output.push(i);
		return output;
	};//method


	//WITH undefined AND nulls REMOVED
	Array.prototype.cleanCopy=function(){
		var output=[];
		for(var i=0;i<this.length;i++){
			if (this[i]===undefined || this[i]==null) continue;
			output.push(this[i]);
		}//for
		return output;
	};//method

	Array.unwrap = function(value){
		if (isArray(value)) return value.unwrap();
		if (value==null) return null;
		return value;
	};//method

	Array.prototype.unwrap = function(){
		if (this.length==0) {
			return undefined;
		}else if (this.length==1){
			return this[0];
		}else{
			return this;
		}//endif
	};//method


	Array.prototype.copy = function(){
		//http://jsperf.com/new-array-vs-splice-vs-slice/19
		var b=[];
		var i = this.length;
		while(i--) { b[i] = this[i]; }
		return b;
	};//method

	Array.reverse = function(array){
		var b = [];
		var t = array.length - 1;
		for (var i = t + 1; i--;) {
			b[i] = array[t - i];
		}//for
		return b;
	};//method

	Array.prototype.forall=function(func){
		for(var i=0;i<this.length;i++){
			func(this[i], i, this);
		}//for
		return this;
	};//method

	Array.prototype.insert=function(index, value){
		this.splice(index, 0, value);
	};//method

	/**
	 * INTERPRET undefined AS OUT-IN-CONTEXT
	 * @param func - RETURN undefined TO BE REMOVED FROM RESULT
	 * @returns {Array}
     */
	Array.prototype.mapExists=function(func){
		var output=[];
		for(var i=0;i<this.length;i++){
			var v=func(this[i], i, this);
			if (v===undefined) continue;
			output.push(v);
		}//for
		return output;
	};//method

	//Array.prototype.map=function(func){
	//	var output=[];
	//	for(var i=0;i<this.length;i++){
	//		var v=func(this[i], i, this);
	//		if (v===undefined) continue;
	//		output.push(v);
	//	}//for
	//	return output;
	//};//method

	// func IS EXPECTED TO TAKE (group, values) WHERE
	//     group IS THE GROUP VALUE (OR OBJECT)
	//     values IS THE LIST IN THAT GROUP
	// params CAN BE {"size": size} TO GROUP ARRAY BY SIZE
	Array.prototype.groupBy = function(params, func){
		if (params.size) {
			var size = params.size;
			if (func===undefined) {
				var output = [];
				for (var g = 0; g * size < this.length; g++) {
					output.append({"group": g, "values": this.slice(g * size, g * size + size)})
				}//for
				return output;
			}else {
				for (var g = 0; g * size < this.length; g++) {
					func(g, this.slice(g * size, g * size + size))
				}//for
			}//endif
		} else if (params.keys) {
			Log.error("Not implemented yet");
		}else{
			Log.error("Do not know how to handle");
		}//endif
		return this;
	};//method


	Array.prototype.select = function(attrName){
		var output=[];
		if (typeof(attrName)=="string"){
			if (attrName.indexOf(".")==-1){
				for(var i=0;i<this.length;i++)
					output.push(Map.get(this[i], attrName));
			}else{
				for(var i=0;i<this.length;i++)
					output.push(Map.get(this[i], attrName));
			}//endif
		}else if (attrName instanceof Array){
			//SELECT MANY VALUES INTO NEW OBJECT
			for(var i=0;i<this.length;i++){
				var v=this[i];
				var o={};
				for (var a = 0; a < attrName.length; a++) {
					var n = attrName[a];
					Map.set(o, n, Map.get(v, n));
				}//for
				output.push(o);
			}//for
		}else{
			//ASSUMING NUMERICAL INDEX
			for(var i=0;i<this.length;i++)
				output.push(this[i][attrName]);
		}//endif
		return output;
	};//method


	//RETURN MAP THAT USES field AS KEY TO ELEMENTS
	Array.prototype.index = function(field) {
		var output = {};
		for (var i = 0; i < this.length; i++) {
			var v = this[i];
			if (v === undefined) continue;
			output[v[field]] = v;
		}//for
	};


	//WE ASSUME func ACCEPTS (row, i, rows)
	Array.prototype.filter=function(func){

		if (typeof(func) != "function") func = qb.get(func);

		var output=[];
		for(var i=0;i<this.length;i++){
			if (func(this[i], i)) output.push(this[i]);
		}//for
		return output;
	};//method

	//RETURN A RANDOM SAMPLE OF VALUES
	Array.prototype.sample=function(num){
		if (this.length<num) return this;

		var temp=this.map(function(u){return {"key":Math.random(), "value":u};});
		temp.sort(function(a, b){return a.key-b.key;});
		return temp.substring(0, num).map(function(v){return v.value;});
	};

	Array.prototype.orderBy=function(sort){
		return qb.sort(this, sort);
	};//method

	Array.prototype.append=function(v){
		this.push(v);
		return this;
	};//method

	function extend(arr){
		for(var i=0;i<arr.length;i++){
			this.push(arr[i]);
		}//for
		return this;
	}//method
	Array.prototype.extend=extend;


	if (DEBUG){
		var temp=[0,1,2].extend([3,4,5]);
		for(var i=0;i<6;i++) if (temp[i]!=i)
			Log.error();
	}//endif


	Array.prototype.prepend=function(v){
		this.unshift(v);
		return this;
	};//method

	Array.prototype.last=function(){
		return this[this.length-1];
	};//method

	Array.prototype.first=function(){
		if (this.length==0) return null;
		return this[0];
	};//method

//  Array.prototype.indexOf=function(value){
//    for(var i=0;i<this.length;i++){
//      if (this[i]==value) return i;
//    }//for
//    return -1;
//  };//method

	Array.prototype.substring=Array.prototype.slice;

	Array.prototype.left=function(num){
		return this.slice(0, num);
	};

	//TRUNCATE ARRAY IF LONGER THAN num
	Array.prototype.limit=Array.prototype.left;

	Array.prototype.leftBut = function(amount){
		return this.slice(0, this.length - amount);
	};//method

	Array.prototype.right=function(num){
		return this.slice(Math.max(0, this.length-num));
	};

	Array.prototype.rightBut=function(num){
		if (num<=0) return this;
		return this.slice(num , this.length);
	};



	Array.prototype.remove=function(obj, start){
		while(true){
			var i=this.indexOf(obj, start);
			if (i==-1) return this;
			this.splice(i, 1);
		}//while
	};

	Array.prototype.concatenate=function(separator){
		return this.mapExists(function(v){return v;}).join(separator);
	};

	//RETURN TRUE IF VALUE IS FOUND IN ARRAY
	Array.prototype.contains = function(value){
		return this.indexOf(value)>=0;
	};//method


	//RETURN LIST OF COMMON VALUES
	Array.prototype.intersect = function(b){
		var output = [];
		for(var i = 0; i < this.length; i++){
			for(var j = 0; j < b.length; j++){
				if (this[i] == b[j]){
					output.push(this[i]);
					break;
				}//endif
			}//for
		}//for
		return output;
	};//method


	//RETURN UNION OF UNIQUE VALUES
	//ASSUMES THAT THE COORCED STRING VALUE IS UNIQUE
	//EXPECTING EACH ARGUMENT TO BE AN ARRAY THAT REPRESENTS A SET
	Array.prototype.union = function(){
		return Array.union.apply(undefined, [].extend(arguments).append(this));
	};//method

	//RETURN UNION OF UNIQUE VALUES
	//ASSUMES THAT THE COORCED STRING VALUE IS UNIQUE
	//EXPECTING ONE ARGUMENT, WHICH IS A LIST OF AN ARRAYS, EACH REPRESENTING A SET
	Array.union = function union(){
		var arrays = (arguments.length == 1 && arguments[0] instanceof Array) ? arguments[0] : arguments;
		return Array.UNION(arrays);
	};

	Array.UNION = function(arrays){
		/*
		 * EXPECTING A LIST OF ARRAYS TO union
		 */
		var output = {};
		for (var j = arrays.length; j--;) {
			var a = Array.newInstance(arrays[j]);
			for (var i = a.length; i--;) {
				var v = a[i];
				output[v] = v;
			}//for
		}//for
		return Map.getValues(output);
	};


	function AND(values){
		for(var i=values.length;i--;){
			var v=values[i];
			if (v==false) return false;
		}//for
		return true;
	}
	Array.AND=AND;

	function OR(values){
		for(var i=values.length;i--;){
			var v=values[i];
			if (v==true) return true;
		}//for
		return false;
	}
	Array.OR=OR;

	Array.range = function range(min, max, step){
		if (step===undefined) step=1;
		var output = [];
		for (var i = min; i < max; i += step) {
			output.append(i);
		}//for
		return output;
	};//function

	Array.extend=function extend(){
		var arrays = (arguments.length==1  && arguments[0] instanceof Array) ? arguments[0] : arguments;
		var output=[];
		for(var i=0;i<arrays.length;i++){
			var a = Array.newInstance(arrays[i]);
			output.extend(a);
		}//for
		return output;
	};


	Array.prototype.subtract=function(b){
		var c=[];
	A:  for(var x=0;x<this.length;x++){
		var v=this[x];
			if (v!==undefined){
				for(var y=b.length;y--;) if (v==b[y]) continue A;
				c.push(v);
			}//endif
		}//for
		return c;
	};//method
})();


function isArray(value){
	return value instanceof Array;
}
