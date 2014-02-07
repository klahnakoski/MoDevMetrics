/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("ETL.js");


var HIERARCHY = {};

(function(){
	var DEBUG = false;
	var DEBUG_MIN = 1000000;


	

	HIERARCHY.BATCH_SIZE = 10000;
	HIERARCHY.aliasName = "bug_hierarchy";
	HIERARCHY.newIndexName = undefined;  //CURRENT INDEX FOR INSERT
	HIERARCHY.oldIndexName = undefined;  //WHERE THE CURENT ALIAS POINTS
	HIERARCHY.typeName = "bug_hierarchy";


	HIERARCHY.allPrograms = CNV.Table2List(MozillaPrograms);


	HIERARCHY.getLastUpdated = function(){
		var data = yield(ESQuery.run({
			"from":HIERARCHY.aliasName,
			"select":[
				{"name":"last_request", "value":"modified_ts", "aggregate":"maximum"}
			]
		}));
		yield (new Date(data.cube.last_request).addDay(-1));
	};


	HIERARCHY.makeSchema = function(){
		//MAKE SCHEMA
		HIERARCHY.newIndexName = HIERARCHY.aliasName + Date.now().format("yyMMdd_HHmmss");

		var setup = {
			"settings":{
				"index.number_of_shards": 1,
				"index.number_of_replicas": 1,
				"index.routing.allocation.total_shards_per_node": 1
			},
			"mappings":
				Map.newInstance(HIERARCHY.typeName, {
					"_source":{"enabled": true},
					"_all":{"enabled" : false},
					"_id":{"path" : "bug_id"},
					"properties":{
						"bug_id":{"type":"integer", "store":"yes"},
						"children.count":{"type":"integer", "store":"yes", "index":"not_analyzed"},
						"children":{"type":"integer", "store":"yes", "index":"no"},
						"parents.count":{"type":"integer", "store":"yes", "index":"not_analyzed"},
						"parents":{"type":"integer", "store":"yes", "index":"no"},
						"descendants.count":{"type":"integer", "store":"yes", "index":"not_analyzed"},
						"descendants":{"type":"integer", "store":"yes", "index":"no"}
					}
				})
		};

		var data = yield(Rest.post({
			"url":ElasticSearch.pushURL + "/" + HIERARCHY.newIndexName,
			"data":setup
		}));
		Log.note(data);
	};

	var DATA;   //MUST KEEP THE ACCUMULATED STATE OVER MANY CALLS

	HIERARCHY.start=function(){
		DATA={
			"allParents":new aRelation(),
			"allDescendants":new aRelation(),
			"allChildren":new aRelation()
		};
		HIERARCHY.DATA=DATA;

		yield (null);
	};


	HIERARCHY.resume=function(){
		DATA=yield (getCurrentTree());
		yield (null);
	};



	HIERARCHY.get = function(minBug, maxBug){
		var esfilter;
		if (minBug instanceof Array && maxBug==null){
			esfilter={"terms":{"bug_id":minBug}};
		}else{
			esfilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
		}//endif



		if (DATA===undefined) Log.error("Expecting start() or resume() to be called first");

		var newChildren=yield (getAllChildren(esfilter));

		yield (toFixPoint(newChildren, DATA));

		yield (DATA);
	};//method


	HIERARCHY.incremental=function(minTime, maxTime){
		if (DATA===undefined) Log.error("Expecting resume() to be called first");

		var newChildren = yield(getAllChildren({"range":{"modified_ts":{"gte":minTime.getMilli(), "lt":maxTime.getMilli()}}}));

		yield (toFixPoint(newChildren, DATA));

		yield (DATA);
	};


	HIERARCHY.insertBatches = function(minTime, maxTime){
		//GET ALL CHILDREN
//	var allChildren=yield(HIERARCHY.get(831997,831998));


		var allParents = new aRelation();
		var allDescendants = new aRelation();
		var allChildren = yield(getAllChildren(minTime, maxTime));

		//TEMP STORAGE
		yield (HIERARCHY.makeSchema());
		yield (ETL.removeOldIndexes(HIERARCHY));
		yield (insert(allParents, allChildren, allDescendants));

		yield (toFixPoint(allParents, allChildren, allDescendants));

		yield (HIERARCHY.insert(allParents, allChildren, allDescendants));
		yield (ETL.updateAlias(HIERARCHY));

	};//method


	
	function getAllChildren(esfilter){
		var a = Log.action("Get largest bug_id", true);
		var maxBugID = yield(ESQuery.run({
			"from":"bugs",
			"select":{"value":"bug_id", "aggregate":"maximum"}
		}));
		maxBugID = maxBugID.cube.bug_id;
		Log.actionDone(a);

		var allChildren = new aRelation();  //SET TO STORE <parent> "-" <child> PAIRS

		a = Log.action("Get Current Bug Info "+CNV.Object2JSON(esfilter), true);
		var currentData = yield(ESQuery.run({
			"from":"bugs",
			"select":[
				"bug_id",
				"dependson"
			],
			"esfilter":{"and":[
				{"exists":{"field":"dependson"}},
//				{"range":{"dependson.count":{"gt":0}}},
				esfilter
			]}
		}));

		if (DEBUG) Log.note("Num hierarchy records using "+CNV.Object2JSON(esfilter)+" ("+ currentData.list.length+" records)");

		//UPDATE THE MAP OF ALL EDGES
		for(var k = currentData.list.length; k--;){
			var c = currentData.list[k];
//if ([852643, 862970].contains(c.bug_id-0)){
//	Log.note();
//}
			allChildren.addArray(c.bug_id, Array.newInstance(c.dependson));


		}//for

		Log.actionDone(a);

		if (DEBUG) Log.note("Number of edges: " + Object.keys(allChildren).length);

		yield (allChildren);
	}//method


//ADDS TO allDescendants UNTIL NO MORE CAN BE ADDED
	function toFixPoint(newChildren, // **ADDITIONAL** CHILDREN TO BE ADDED TO allParents
						data
		){

		var now=Date.now();
		
		var allParents=data.allParents;
		var allChildren=data.allChildren;
		var allDescendants=data.allDescendants;
		var allTimes={};  data.allTimes=allTimes;

		//ADD TO THE KNOWN PARENTS AND DESCENDANTS
		newChildren.forall(function(p, children){
			for(var i = children.length; i--;){
				allParents.add(children[i], p);
				allChildren.add(p, children[i]);
				if (allDescendants.testAndAdd(p, children[i])){
					allTimes[p]=now;
				}//endif
			}//for
		});



		//FIND DESCENDANTS
		//PLAN IS TO LOOK AT PARENT'S DESCENDANTS, IF SELF HAS ANY NEW DESCENDANTS
		//TO ADD, THEN ADD THEM AND ADD PARENT TO THE workQueue
		var a = Log.action("Find Descendants", true);
		yield (Thread.sleep(100));
		var workQueue = new aQueue(Object.keys(allParents.map));

		while(!workQueue.isEmpty()){      //KEEP WORKING WHILE THERE ARE CHANGES
			yield (Thread.yield());
			if (DEBUG){
				if (DEBUG_MIN > workQueue.length() && workQueue.length() % Math.pow(10, Math.round(Math.log(workQueue.length()) / Math.log(10)) - 1) == 0){

					Log.actionDone(a);
					a = Log.action("Work queue remaining: " + workQueue.length(), true);
					DEBUG_MIN = workQueue.length();
				}//endif
			}//endif

			var node = workQueue.pop();
			var desc = allDescendants.get(node);
			if (desc.length==0)
				continue;

			
			var parents = allParents.get(node);
			for(var i = parents.length; i--;){
				var parent = parents[i];
//if ([852643, 862970].contains(node-0)){
//	Log.note();
//}

				var added = false;
				var original = allDescendants.getMap(parent);

				if (original === undefined){
					for(var d = desc.length; d--;){
						allDescendants.add(parent, desc[d]);
						added = true;
					}//for
				} else{
					for(var d = desc.length; d--;){
						if (original[desc[d]]) continue;
						allDescendants.add(parent, desc[d]);
						added = true;
					}//for
				}//endif

				if (added){
					workQueue.add(parent);
					allTimes[parent]=now;
				}//endif
			}//for

		}//while
		Log.actionDone(a);
		yield (null);
	}//method


	if (DEBUG){

		Thread.run(function*(){
			yield (HIERARCHY.start());
			yield (toFixPoint(new aRelation().addArray("12", [45, 46, 47]).addArray(45, [1,2,3]), DATA));
			if (DATA.allDescendants.get(12).length!=6) Log.error();
		});
	}



	function getCurrentTree(){
		//TURN ON INDEXING TO GET DATA PULLED
		yield (ElasticSearch.setRefreshInterval(HIERARCHY.newIndexName, "1s"));

		//GET ALL RECORDS FROM
		var a=Log.action("Get current hierarchy", true);
		var all = yield(ESQuery.run({
			"url":ElasticSearch.pushURL+"/"+HIERARCHY.newIndexName+"/"+HIERARCHY.typeName,
			"from":"bug_hierarchy",
			"select":[
				"bug_id",
				"children",
				"parents",
				"descendants"
			]
		}));

		//LOAD DATA STRUCTURES
		var allChildren = new aRelation();
		var allParents = new aRelation();
		var allDescendants = new aRelation();

		all.list.forall(function(bug){
			allChildren.addArray(bug.bug_id, Array.newInstance(bug.children));
			allParents.addArray(bug.bug_id, Array.newInstance(bug.parents));
			allDescendants.addArray(bug.bug_id, Array.newInstance(bug.descendants));
		});
		Log.actionDone(a);

		yield ({"allParents":allParents, "allChildren":allChildren, "allDescendants":allDescendants});
	}//method


//EXPECT A LIST OF LINES TTO ADD


	HIERARCHY.insert=function(data){
		var BLOCK_SIZE = 10000;

		var now=Date.now();
		var minBug=null;
		var maxBug=null;
		
		var insert = [];
		var bug_ids = Object.keys(data.allDescendants.map);
		for(var i = bug_ids.length; i--;){
			var bug_id = bug_ids[i];
			var desc = data.allDescendants.get(bug_id);
			var parents = data.allParents.get(bug_id);
			var children = data.allChildren.get(bug_id);
			var time=data.allTimes[bug_id];


			if (time!==undefined){
				minBug=aMath.min(minBug, bug_id-0);
				maxBug=aMath.max(maxBug, bug_id-0);

				insert.push(JSON.stringify({ "create":{ "_id" : bug_id } }));
				insert.push(JSON.stringify({
					"bug_id":bug_id,
					"modified_ts":time.getMilli(),
					"descendants":desc,
					"descendants.count":desc.length,
					"parents":parents,
					"parents.count":parents.length,
					"children":children,
					"children.count":children.length
				}));
			}//endif

			if (insert.length >= BLOCK_SIZE){
				var a = Log.action("Push " + insert.length + "(min="+minBug+", max="+maxBug+") descendants to ES", true);
				yield (ElasticSearch.bulkInsert(HIERARCHY.newIndexName, HIERARCHY.typeName, insert));
				Log.actionDone(a);
				insert = [];
			}//endif
		}//for

		if (insert.length>0){
			var a = Log.action("Push last " + insert.length + "(min="+minBug+", max="+maxBug+") descendants to ES", true);
			yield (ElasticSearch.bulkInsert(HIERARCHY.newIndexName, HIERARCHY.typeName, insert));
			Log.actionDone(a);
		}//endif
	}//method


})();