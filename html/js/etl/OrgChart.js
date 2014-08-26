/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var OrgChart = {};

importScript("ETL.js");

(function () {
	var DEBUG = false;
	var PHONEBOOK_URL = "https://phonebook.mozilla.org";
//	var PHONEBOOK_URL="https://phonebook-dev.allizom.org/search.php";
	var JSONP_CALLBACK = "workit";


	OrgChart.BATCH_SIZE = 1000000000;		//ETL IS BUG BASED, BIG ENOUGH TO DO IN ONE BATCH
	OrgChart.destination = ESQuery.INDEXES.org_chart;
	OrgChart.newIndexName = undefined;  //CURRENT INDEX FOR INSERT
	OrgChart.oldIndexName = undefined;  //WHERE THE CURRENT ALIAS POINTS


	OrgChart.push = function*() {
		yield (ETL.newInsert(OrgChart));
	};


	OrgChart.start = function*() {
		OrgChart.oldIndexName = undefined;
		yield (null);
	};


	OrgChart.get = function*(minBug, maxBug) {

		//AFTER MUCH PAIN, I DECIDED TO TRY SUBMITTING A BUG TO THE WEB PEOPLE TO
		//SOLVE ACCESS PROBLEMS ON THE SERVER SIDE:
		//
		//https://bugzilla.mozilla.org/show_bug.cgi?id=831405
		//
		//THAT WAS FAST!  I LOVE WORKING HERE!

		var people;
//	var temp=window[OrgChart.JSONP_CALLBACK];
		{
			window[JSONP_CALLBACK] = function (json) {
				OrgChart.people = json;
			};//method

			yield (Thread.yield());  //YIELD TO ALLOW FUNCTION TO BE ASSIGNED TO window

			var url = PHONEBOOK_URL + "/search.php?format=jsonp&callback=" + JSONP_CALLBACK + "&query=*";
			var html = $("<script type=\"application/javascript;version=1.9\" src=\"" + url + "\"></script>");
			var body = $("body");
			body.append(html);

			while (!OrgChart.people) {
				yield (Thread.sleep(1000));  //YIELD TO ALLOW SCRIPT TO LOAD AND EXECUTE
			}//while

			//HERE WE JUST RETURN THE LOCAL COPY
			people = OrgChart.people.map(function (v, i) {
				return {"id": v.dn, "name": v.cn, "manager": v.manager ? v.manager.dn : null, "email": v.bugzillaemail};
			});

			Log.note(people.length + " people found")

		}
//	window[OrgChart.JSONP_CALLBACK]=temp;

		yield (people);

	};//method


	OrgChart.getLastUpdated = function*() {
		yield (Date.now());
	};


	OrgChart.makeSchema = function*() {
		//MAKE SCHEMA
		OrgChart.newIndexName = OrgChart.destination.alias + Date.now().format("yyMMdd_HHmmss");


		var setup = {
			"settings": {
				//ORG CHART IS SO SMALL, IT WILL HAVE EMPTY SHARDS IF THERE ARE TOO MANY
				"index.number_of_shards": 1,
				"index.number_of_replicas": 0,
				"index.routing.allocation.total_shards_per_node": 1
			},
			"mappings": {"person": {
				"_source": {"enabled": true},
				"_all": {"enabled": false},
				"properties": {
					"id": {"type": "string", "store": "yes", "index": "not_analyzed"},
					"name": {"type": "string", "store": "yes", "index": "not_analyzed"},
					"manager": {"type": "string", "store": "yes", "index": "not_analyzed", "null_value": "null"},
					"email": {"type": "string", "store": "yes", "index": "not_analyzed"}
				}
			}}
		};

		var data = yield (Rest.post({
			"url": OrgChart.destination.host + "/" + OrgChart.newIndexName,
			"data": setup
		}));

		OrgChart.destination.path = OrgChart.newIndexName + "/" + OrgChart.destination.path.trim("/").split("/")[1];

		Log.note(data);


		//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
		yield (ETL.removeOldIndexes(OrgChart));
	};


	OrgChart.insert = function*(people) {
		var uid = Util.GUID();
		var insert = [];
		people.forall(function (r, i) {
			insert.push(JSON.stringify({ "create": { "_id": uid + "-" + i } }));
			insert.push(JSON.stringify(r));
		});

		var a = Log.action("Push people to ES", true);
		var results = yield (ElasticSearch.bulkInsert(OrgChart.destination, insert));
		if (DEBUG) Log.note(CNV.Object2JSON(CNV.JSON2Object(results)));

		Log.actionDone(a);
	};//method


})();
