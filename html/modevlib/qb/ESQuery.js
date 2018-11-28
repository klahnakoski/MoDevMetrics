/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../Settings.js");
importScript("../util/convert.js");
importScript("../charts/aColor.js");
importScript("../collections/aArray.js");
importScript("../util/aDate.js");
importScript("../util/aUtil.js");
importScript("../util/aParse.js");
importScript("../debug/aLog.js");
importScript("MVEL.js");
importScript("qb.js");

importScript("../rest/ElasticSearch.js");
importScript("../rest/Rest.js");


ESQuery = {};
ESQuery.TrueFilter = {"match_all": {}};
ESQuery.DEBUG = false;
ESQuery.INDEXES = window.Settings.indexes;
ESQuery.NOT_SUPPORTED = "From clause not supported \n{{from}}";


var ESFilter = {};

ESFilter.simplify = function(esfilter){
	var output = ESFilter.fastAndDirtyNormalize(esfilter);
	if (output===undefined){
		return ESQuery.TrueFilter;
	}else if (output===false){
		return {"not": ESQuery.TrueFilter}
	}else{
		return output;
	}//endif
};

ESFilter.removeOr = function(esfilter){
	if (esfilter.not) return {"not": ESFilter.removeOr(esfilter.not)};

	if (esfilter.and) {
		return {"and": esfilter.and.mapExists(function(v, i){
			return ESFilter.removeOr(v);
		})};
	}//endif

	if (esfilter.or) {  //CONVERT OR TO NOT.AND.NOT
		return {"not": {"and": esfilter.or.mapExists(function(v, i){
			return {"not": ESFilter.removeOr(v)};
		})}};
	}//endif

	return esfilter;
};//method


//ENSURE NO ES-FORBIDDEN COMBINATIONS APPEAR (WHY?!?!?!?!?!  >:| )
//NORMALIZE BOOLEAN EXPRESSION TO OR.AND.NOT FORM
ESFilter.normalize = function(esfilter){
	if (esfilter.isNormal) return esfilter;

	Log.note("from: " + convert.value2json(esfilter));
	var output = esfilter;

	while (output != null) {
		esfilter = output;
		output = null;

		if (esfilter.terms) {									//TERMS -> OR.TERM
			var fieldname = Object.keys(esfilter.terms)[0];
			output = {};
			output.or = esfilter.terms[fieldname].mapExists(function(t, i){
				return {"and": [
					{"term": Map.newInstance(fieldname, t)}
				], "isNormal": true};
			});
		} else if (esfilter.not && esfilter.not.or) {				//NOT.OR -> AND.NOT
			output = {};
			output.and = esfilter.not.or.mapExists(function(e, i){
				return ESFilter.normalize({"not": e});
			});
		} else if (esfilter.not && esfilter.not.and) {			//NOT.AND
			output = {};
			output.or = esfilter.not.and.mapExists(function(e, i){
				return ESFilter.normalize({"not": e});
			});
		} else if (esfilter.not && esfilter.not.not) {			//NOT.NOT
			output = ESFilter.normalize(esfilter.not.not);
		} else if (esfilter.not) {
			if (esfilter.not.isNormal) {
				esfilter.isNormal = true;
			} else {
				output = {"not": ESFilter.normalize(esfilter.not)};
			}//endif
		} else if (esfilter.and) {
			output = {"and": []};

			esfilter.and.forall(function(a, i){
				a = ESFilter.normalize(a);
				if (a.or && a.or.length == 1) a = a.or[0];

				if (a.and) {										//AND.AND
					output.and.extend(a.and);
				} else if (a.script && a.script.script == "true") {
					//DO NOTHING
				} else {
					output.and.push(a);
				}//endif
			});

			var mult = function(and, d){							//AND.OR
				if (and[d].or === undefined) {
					if (d == and.length - 1)
						return {"or": [
							{"and": [and[d]], "isNormal": true}
						]};
					var out = mult(and, d + 1);
					for (var o = 0; o < out.or.length; o++) {
						out.or[o].and.prepend(and[d]);
					}//for
					return out;
				}//endif

				if (d == and.length - 1) {
					var or = and[d].or;
					for (var i = 0; i < or.length; i++) {
						if (!or[i].and) or[i] = {"and": [or[i]], "isNormal": true};
					}//for
					return {"or": or};
				}//endif

				var child = mult(and, d + 1);
				var or = [];
				for (var i = 0; i < and[d].or.length; i++) {
					for (var c = 0; c < child.or.length; c++) {
						var temp = {"and": [], "isNormal": true};
						if (and[d].or[i].and) {
							temp.and.extend(and[d].or[i].and);
						} else {
							temp.and.push(and[d].or[i]);
						}//endif
						temp.and.extend(child.or[c].and);
						or.push(temp);
					}//for
				}//for
				return {"or": or};
			};
			output = mult(output.and, 0);
			output.isNormal = true;
			esfilter = output;
			break;
		} else if (esfilter.or) {
			output = {"or": []};
			esfilter.or.forall(function(o, i){
				var k = ESFilter.normalize(o);
				if (k.or) {
					output.or.extend(k.or);
				} else {
					output.or.push(k);
				}//endif
			});
			esfilter = output;
			break;
		}//endif
	}//while
	Log.note("  to: " + convert.value2json(esfilter));

	esfilter.isNormal = true;
	return esfilter;
};//method


//REPLACE {"and":[]} AND true WITH {"match_all":{}}
//RETURN undefined FOR true
//RETURN False FOR NO MATCH POSSIBLE
ESFilter.fastAndDirtyNormalize = function(esfilter){
	if (esfilter === undefined) {
		return undefined;
	} else if (esfilter == true) {
		return undefined;
	} else if (esfilter.match_all) {
		return undefined;
	} else if (esfilter.not) {
		if (esfilter.not.or && esfilter.not.or.length == 0) {
			return undefined;  //UNLIKELY TO EVER HAPPEN, BUT JUST IN CASE
		} else {
			var inverse = ESFilter.fastAndDirtyNormalize(esfilter.not);
			if (inverse === undefined) {
				return false;
			} else if (inverse === false) {
				return undefined;
			}//endif
			return {"not": inverse};
		}//endif
	} else if (esfilter.and) {
		let conditions = esfilter.and.mapExists(ESFilter.fastAndDirtyNormalize);
		if (conditions.length == 0) {
			return undefined;
		} else if (conditions.filter(function(v){
				return v === false;
			}).length > 0) {
			return false;
		} else if (conditions.length == 1) {
			return conditions[0];
		} else {
			return {"and": conditions}
		}//endif
	} else if (esfilter.or) {
		let conditions = esfilter.or.mapExists(ESFilter.fastAndDirtyNormalize);
		if (conditions.length == 0) {
			return false;
		} else if (conditions.filter(function(v){
				return v === undefined;
			}).length > 0) {
			return undefined;
		} else if (conditions.length == 1) {
			return conditions[0];
		} else {
			return {"or": conditions}
		}//endif
	}//endif

	return esfilter;
};//method
