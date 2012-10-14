////////////////////////////////////////////////////////////////////////////////
// AGGREGATION
////////////////////////////////////////////////////////////////////////////////


SQL.aggregate = {};
SQL.aggregate.compile = function(select){
	if (select.operation === undefined) select.operation = "none";

	if (SQL.aggregate[select.operation] === undefined){
		D.error("Do not know aggregate operation '" + select.operation + "'");
	}//endif

	return SQL.aggregate[select.operation](select);
};//method


//SQL.aggregate.filter=function(column){
//	column.defaultValue = function(){
//		return null;
//	};//method
//
//
//
//
//	column.add=function(total, v){
//		if (v===undefined || v==null) return total;
//		if (total==null) return v;
//
//		if () total=v;
//		return total;
//	};//method
//
//	column.end=function(total){
//		if (total==null) return null;
//		return column.calc(total);
//	};//method
//};


SQL.aggregate.join = function(column){
	if (column.separator === undefined) column.separator = '';

	column.defaultValue = function(){
		return null;
	};//method

	column.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null) return v;
		return total + this.separator + v;
	};//method

	column.domain = SQL.domain.value;
};

SQL.aggregate.average = function(select){
	select.defaultValue = function(){
		return {total:0.0, count:0.0};
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;

		total.total += v;
		total.count++;

		return total;
	};//method

	select.end = function(total){
		if (total.count == 0) return null;
		return total.total / total.count;
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

		getPartition:function(value){
			return value;
		},

		getKey:function(partition){
			return partition;
		},
	};
};

SQL.aggregate.none = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null) return v;
		D.error("Not expecting to aggregate, only one non-null value allowed per set");
		return null;
	};//method

	select.domain = SQL.domain.value;
};


SQL.aggregate.sum = function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + v;
	};//method

	select.domain = SQL.domain.value;
};

SQL.aggregate.count = function(select){
	select.defaultValue = function(){
		return 0;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		return total + 1;
	};//method

	select.domain = SQL.domain.value;
};

SQL.aggregate.maximum = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null || v > total) return v;
		return total;
	};//method

	select.domain = SQL.domain.value;
};

SQL.aggregate.minimum = function(select){
	select.defaultValue = function(){
		return null;
	};//method

	select.add = function(total, v){
		if (v === undefined || v == null) return total;
		if (total == null || v < total) return v;
		return total;
	};//method

	select.domain = SQL.domain.value;
};
