/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */






(function(){


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

	Array.prototype.select=function(attrName){
		var output=[];
		for(var i=0;i<this.length;i++) output.push(this[i][attrName]);
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

	Array.prototype.remove=function(obj){
		for(var i=this.length;i--;){
			if (this[i]!=obj) continue;
			this.splice(i, 1);
		}//for
		return this;
	};

	//[].remove("a");


	//RETURN TRUE IF VALUE IS FOUND IN ARRAY
	Array.prototype.contains = function(value){
		for(var i = this.length; i--;){
			if (this[i] == value) return true;
		}//for
		return false;
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


	//RETURN UNION OF UNIQUE VALUES (WORKS ON STRINGS ONLY)
	Array.prototype.union = function(b){
		var output={};
		for(var i = 0; i < this.length; i++) output[this[i]]=1;
		for(var j = 0; j < b.length; j++) output[b[i]]=1;
		return Object.keys(output);
	};//method



	Array.prototype.subtract=function(b){
		var c=[];
	A:	for(var x=0;x<this.length;x++){
			if (this[x]!==undefined){
				for(var y=0;y<b.length;y++) if (this[x]==b[y]) continue A;
				c.push(this[x]);
			}//endif
		}//for
		return c;
	};//method
})();