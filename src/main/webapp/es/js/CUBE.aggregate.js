/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

////////////////////////////////////////////////////////////////////////////////
// AGGREGATION
////////////////////////////////////////////////////////////////////////////////

if (CUBE===undefined) var CUBE = {};


CUBE.aggregate = {};
CUBE.aggregate.compile = function(select){
	if (select.aggregate === undefined) select.aggregate = "none";

	if (CUBE.aggregate[select.aggregate] === undefined){
		D.error("Do not know aggregate aggregate '" + select.aggregate + "'");
	}//endif

	CUBE.aggregate[select.aggregate](select);

	//DEFAULT AGGREGATION USES A STRUCTURE (OR VALUE) THAT CHANGES
	//SOME AGGREGATES DEFER calc() UNTIL LATER
	if (select.aggregate===undefined){
		select.aggregate=function(row, result, agg){
			var v=this.calc(row, result);
			return this.add(agg, v);
		};//method
	}//endif


	return select;
};//method




CUBE.aggregate.join = function(select){
	if (select.separator === undefined) select.separator = '';

	select.defaultValue = function(){
		return [];
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		total.push(v);
		return total;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);

	select.domain.end=function(total){
		return total.join(select.separator);
	};//method


};

CUBE.aggregate.average = function(select){
	select.defaultValue = function(){
		return {total:0.0, count:0.0};
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;

		total.total += v;
		total.count++;

		return total;
	};//method

	select.domain = {

		compare:function(a, b){
			a = select.end(a);
			b = select.end(b);

			if (a == null){
				if (b == null) return 0;
				return -1;
			} else if (b == null){
				return 1;
			}//endif

			return ((a < b) ? -1 : ((a > b) ? +1 : 0));
		},

		NULL:null,

		getCanonicalPart:function(value){
			return value;
		},

		getKey:function(partition){
			return partition;
		},

		end :function(total){
			if (total.count == 0){
				if (select["default"]!==undefined) return select["default"];
				return null;
			}//endif
			return total.total / total.count;
		}
	};
};
CUBE.aggregate.avg=CUBE.aggregate.average;

////////////////////////////////////////////////////////////////////////////////
// THIS VALUE WILL BE SET ONCE AND ONLY ONCE
CUBE.aggregate.none = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null) return v;
		D.error("Not expecting to aggregate, only one non-null value allowed per set");
		return null;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);


};


////////////////////////////////////////////////////////////////////////////////
// THE AGGREGATE MAY BE ACCUMULATED MANY TIMES BUT ONLY ONE VALUE IS SET
CUBE.aggregate.one = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null) return v;
		if (total==v) return total;
		D.error("Expecting only one value to aggregate");
		return null;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);

	select.domain.end=function(value){
		if (value == null && select["default"]!==undefined) return eval(select["default"]);
		return value;
	};//method
};



CUBE.aggregate.sum = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + v;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);

	select.domain.end=function(value){
		if (value == null && select["default"]!==undefined) return eval(select["default"]);
		return value;
	};//method



};
CUBE.aggregate.add=CUBE.aggregate.sum;
CUBE.aggregate.X1=CUBE.aggregate.sum;


//SUM OF SQUARES
CUBE.aggregate.X2 = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + (v*v);
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);

	select.domain.end=function(value){
		if (value == null && select["default"]!==undefined) return eval(select["default"]);
		return value;
	};//method



};


//RETURN ZERO (FOR NO DATA) OR ONE (FOR DATA)
CUBE.aggregate.binary = function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return 1;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);
};
CUBE.aggregate.exists=CUBE.aggregate.binary;




CUBE.aggregate.count = function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + 1;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);
};

CUBE.aggregate.maximum = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null || v > total) return v;
		return total;
	};//method

	select.domain = {};
	Map.copy(CUBE.domain.value, select.domain);
	select.domain.end=function(value){
		if (value == null && select["default"]!==undefined) return select["default"];
		return value;
	};//method
};

CUBE.aggregate.minimum = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null || v < total) return v;
		return total;
	};//method

	select.domain=Map.copy(CUBE.domain.value, {});

	select.domain.end=function(value){
		if (value == null && select["default"]!==undefined) return select["default"];
		return value;
	};//method

};


CUBE.aggregate.percentile = function(select){
	select.defaultValue = function(){
		return {list:[]};
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;

		total.list.push(v);

		return total;
	};//method

	select.domain = {
		//HOPEFULLY WE WILL NEVER NEED TO SORT PERCENTILES!!!
		compare:function(a, b){
			D.error("Please, NO!");

			a = select.end(a);
			b = select.end(b);

			if (a == null){
				if (b == null) return 0;
				return -1;
			} else if (b == null){
				return 1;
			}//endif

			return ((a < b) ? -1 : ((a > b) ? +1 : 0));
		},

		NULL:null,

		getCanonicalPart:function(value){
			return value;
		},

		getKey:function(partition){
			return partition;
		},

		end :function(total){
			var l=total.list;
			if (l.length == 0){
				if (select["default"]!==undefined) return select["default"];
				return null;
			}//endif

			//THE Stats CAN ONLY HANDLE NUMBERS, SO WE CONVERT TYPES TO NUMBERS AND BACK AGAIN WHEN DONE
			if (l[0].milli){
				for(let i=l.length;i--;) l[i]=l[i].milli;
				let output=Stats.percentile(l, select.percentile);
				return Duration.newInstance(output);
			}else if (total.list[0].getMilli){
				for(let i=l.length;i--;) l[i]=l[i].getMilli();
				let output=Stats.percentile(l, select.percentile);
				return Date.newInstance(output);
			}else{
				return Stats.percentile(l, select.percentile);
			}//endif
		}
	};
};
