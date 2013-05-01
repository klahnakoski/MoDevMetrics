/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript["aArray.js"];


var aQueue=null;


(function(){


	aQueue=function(data){
		this.array=[];
		this.map={};

		if (data!==undefined) data.forall(function(v, i){this.add(v);});
	};

	aQueue.add=function(v){
		if (this.map[v]!==undefined) return;
		this.map[v]=1;
		this.array.prepend(v);
		return this;
	};

	aQueue.pop=function(){
		var o=this.array.pop();
		this.map[o]=undefined;
		return o;
	};

	aQueue.push=function(v){
		if (this.map[v]!==undefined){
			this.array.remove(v);
		}//endif
		this.map[v]=1;
		this.array.push(v);
		return this;
	};

})();

