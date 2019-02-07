/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("util/aHTML.js");
importScript("aLibrary.js");
importScript("rest/BugzillaClient.js");


Bugzilla = {};
(function () {
	Bugzilla.URL = "https://bugzilla.mozilla.org/buglist.cgi";

	Bugzilla.showBugs = function (bugList, columnList) {
		var url = Bugzilla.searchBugsURL(bugList, columnList);
		window.open(url);
	};//method


	Bugzilla.searchBugsURL = function (bugList, columnList) {
		var url = "";
		if (bugList instanceof Array) {
			url += Bugzilla.URL + "?quicksearch=" + bugList.join('%2C');
		} else if (isString(bugList)) {
			url += Bugzilla.URL + "?quicksearch=" + bugList.replaceAll(", ", "%2C");
		} else {
			url += Bugzilla.URL + "?quicksearch=" + bugList;
		}//endif

		if (columnList) {
			url += "&columnlist=" + Array.newInstance(columnList).join('%2C')
		}//endif

		return url;
	};//method


	Bugzilla.linkToBug = function (bugList) {
		return new HTML("<a href='" + Bugzilla.searchBugsURL(bugList) + "'>" + bugList + "</a>");
	};//method


	Bugzilla.search = function* (bugList, fields) {
		var BLOCK_SIZE = 100;

		var resume = yield (Thread.Resume);
		var result = [];
		var numCalls = aMath.floor((bugList.length + BLOCK_SIZE - 1) / BLOCK_SIZE);
		if (!fields.contains("id")) fields.prepend("id");

		for (i = 0; i < numCalls; i++) {
			var subList = bugList.substring(i * BLOCK_SIZE, aMath.min(bugList.length, i * BLOCK_SIZE + BLOCK_SIZE));

			new BugzillaClient({}).searchBugs({
				"id": subList,
				"include_fields": fields.join(","),
			}, function (status, data) {
				if (status == "error") {
					numCalls--;
					Log.error("can not get bugs!");
				}//endif
				numCalls--;
				Log.note(result.length + "+" + data.length);

				for (var r = data.length; r--;) {
					var b = data[r];
					for (var c = fields.length; c--;) {
						var f = fields[c];
						b[f] = coalesce(b[f], null);
					}
				}

				result.extend(data);
				if (numCalls == 0) {
					var missing = bugList.subtract(result.mapExists(function (b) {
						return b.id;
					}));
					result.extend(missing.mapExists(function (m) {
						var output = {};
						for (var c = fields.length; c--;) output[fields[c]] = null;
						output.id = m;
						return output;
					}));
					resume(result);
				}
			});

		}//for
		yield (Thread.suspend());
	};//method


	function readOp(expr) {
		const [[op, params]] = Object.entries(expr);
		[[fld, val]] = Object.entries(params);
		return [op, fld, val];
	}

	const expressionLookup = {
		and: function (expr) {
			return Array.extend(
				{f: "OP", j: "AND"},
				expr.and.map(jx2rest),
				{f: "CP"},
			);
		},
		or: function (expr) {
			return Array.extend(
				{f: "OP", j: "OR"},
				expr.or.map(jx2rest),
				{f: "CP"},
			);
		},
		eq: function (expr) {
			const [po, fld, val] = readOp(expr);
			return [{
				f: fld,
				o: "equals",
				v: val,
			}];
		},
		"in": function (expr) {
			const [op, fld, vals] = readOp(expr);
			return Array.extend(
				{f: "OP", j: "OR"},
				vals.map(function (v) {
					return jx2rest({eq: Map.newInstance(fld, v)})
				}),
				{f: "CP"},
			);
		},
		find: function (expr) {
			const [op, fld, val] = readOp(expr);
			return [{
				f: fld,
				o: "contains",
				v: val,
			}];
		},
		not: function (expr) {
			return jx2rest(expr.not).forall(function (e) {
				e.n = 1
			});
		},
		missing: function (expr) {
			const fld = expr.exists;
			return [{
				f: fld,
				o: "isempty",
			}]
		},
		regex: function (expr) {
			const [op, fld, val] = readOp(expr);
			return [{
				f: fld,
				o: "regex",
				v: val,
			}];
		},
	};
	expressionLookup.term = expressionLookup.eq;
	expressionLookup.terms = expressionLookup['in'];

	function jx2rest(expr) {
		let ops = Object.keys(expressionLookup);
		for (const [op, restful] of Object.entries(expressionLookup)) {
			if (expr[op]) {
				return restful(expr);
			}
		}
		Log.error("Can not find operator for " + convert.value2json(expr))
	}

	Bugzilla.jx2rest = function(expr){
		const output = {};
		Map.zip(jx2rest(expr).map(function(e, i){
			Map.map(e, function(k, v){
				return [k+i, v];
			}));
		}));

	};

})();

