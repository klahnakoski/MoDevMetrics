////////////////////////////////////////////////////////////////////////////////
// AGGREGATION
////////////////////////////////////////////////////////////////////////////////


CUBE.aggregate = {};
CUBE.aggregate.compile = function(select){
	if (select.operation === undefined) select.operation = "none";

	if (CUBE.aggregate[select.operation] === undefined){
		D.error("Do not know aggregate operation '" + select.operation + "'");
	}//endif

	CUBE.aggregate[select.operation](select);

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

//
//CUBE.aggregate.analytic = function(column){
//	if (column.separator === undefined) column.separator = '';
//
//	column.defaultValue = function(){
//		return [];
//	};//method
//
//	column.add = function(total, v){
//		if (v === undefined || v == null) return total;
//		total.push(v);
//		return total;
//	};//method
//
//	column.domain = CUBE.domain.value;
//
//	column.end=function(total){
//		//GROUP BY
//
//		//SORT
//		//CALC VALUE
//
//
//
//		return total.join(column.separator);
//	};//method
//};


CUBE.aggregate.join = function(column){
	if (column.separator === undefined) column.separator = '';

	column.defaultValue = function(){
		return [];
	};//method

	column.add = function(total, v){
		if (v === undefined || v == null) return total;
		total.push(v);
		return total;
	};//method

	column.domain = CUBE.domain.value;

	column.end=function(total){
		return total.join(column.separator);
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
