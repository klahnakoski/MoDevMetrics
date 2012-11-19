////////////////////////////////////////////////////////////////////////////////
// AGGREGATION
////////////////////////////////////////////////////////////////////////////////


CUBE.aggregate = {};
CUBE.aggregate.compile = function(select){
	if (select.operation === undefined) select.operation = "none";

	if (CUBE.aggregate[select.operation] === undefined){
		D.error("Do not know aggregate operation '" + select.operation + "'");
	}//endif

	return CUBE.aggregate[select.operation](select);
};//method


//CUBE.aggregate.analytic=function(column, columns){
//	var groupby=column.groupby;
//	if (groupby===undefined) column.groupby="1";
//	if (groupby instanceof String) groupby=[groupby];
//
//	var sort=column.sort;
//	if (sort===undefined) sort="1";
//	if (sort instanceof String) sort=[sort];
//
//
//	column.defaultValue = function(){
//		return []
//	};//method
//
//	column.add = function(total, v){
//		if (v === undefined || v == null) return total;
//
//		var t=total;
//		for(var i=0;i<groupby.length;i++){
//			t=t[v[groupby[i]]];
//			if (t===undefined){
//				t=[];
//				t[v[groupby[i]]]=t;
//			}//endif
//		}//endif
//		t.push(v);
//		return total;
//	};//method
//
//	column.domain = CUBE.domain.value;
//
//	column.sortFunction=function(a, b){
//		for(var o = 0; o < sort.length; o++){
//			if (columns[sort[o]].domain === undefined){
//				D.warning("what?");
//			}
//
//			var diff = columns[sort[o]].domain.compare(a[sort[o]], b[sort[o]]);
//			if (diff != 0) return columns[sort[o]].sortOrder * diff;
//		}//for
//		return 0;
//	};
//
//
//	column.domain = {
//
//		compare:function(a, b){
//			D.error("do not know how to compare analytic parts");
//		},
//
//		NULL:null,
//
//		getCanonicalPart:function(value){
//			return value;
//		},
//
//		getKey:function(partition){
//			return partition;
//		},
//
//		end :function(total){
//			//SORT
//
//
//
//
//			if (total.count == 0) return null;
//			return total.total / total.count;
//			data.sort(totalSort);
//		}
//	};
//
//
//
//
//
//};


CUBE.aggregate.join = function(column){
	if (column.separator === undefined) column.separator = '';

	column.defaultValue = function(){
		return null;
	};//method

	column.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null) return v;
		return total + this.separator + v;
	};//method

	column.domain = CUBE.domain.value;
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
			if (total.count == 0) return null;
			return total.total / total.count;
		}
	};
};

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

	select.domain = CUBE.domain.value;
};


////////////////////////////////////////////////////////////////////////////////
// THE AGGREGATE MAY BE ACCUMULATED MANY TIMES< BUT ONLY ONE VALUE IS SET
CUBE.aggregate.one = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null) return v;
		if (total==v) return total;
		D.error("Expecting onlyone value to aggrregate");
		return null;
	};//method

	select.domain = CUBE.domain.value;
};



CUBE.aggregate.sum = function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + v;
	};//method

	select.domain = CUBE.domain.value;
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

	select.domain = CUBE.domain.value;
};





CUBE.aggregate.count = function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + 1;
	};//method

	select.domain = CUBE.domain.value;
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

	select.domain = CUBE.domain.value;
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

	select.domain = CUBE.domain.value;
};
