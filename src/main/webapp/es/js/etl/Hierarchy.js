/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("ETL.js");


var OneToMany=function(){
	this.map={};
};

OneToMany.prototype.add=function(from, to){
	if (!this.map[from]) this.map[from]={};
	this.map[from][to]=1;
};

//RETURN AN ARRAY OF OBJECTS THAT from MAPS TO
OneToMany.prototype.get=function(from){
	var o=this.map[from];
	if (!(o instanceof Array)){
		o=Object.keys(o);
		this.map[from]=o;
	}//endif
	return o;
};

OneToMany.prototype.forall=function(func){
	var keys=Object.keys(this.map);
	for(var i=0;i<keys.length;i++){
		func(keys[i], this.get(keys[i]), i);
	}//for
};









var HIERARCHY={};
HIERARCHY_BATCH_SIZE=20000;
HIERARCHY.aliasName="bug_hierarchy";
HIERARCHY.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
HIERARCHY.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
HIERARCHY.typeName="bug_hierarchy";


HIERARCHY.allPrograms = CNV.Table2List(MozillaPrograms);


HIERARCHY.getLastUpdated=function(){
	var data=yield (ESQuery.run({
		"from":HIERARCHY.aliasName,
		"select":[
			{"name":"last_request", "value":"modified_time", "aggregate":"maximum"}
		]
	}));
	yield (new Date(data.cube.last_request));
};


HIERARCHY.makeSchema=function(){
	//MAKE SCHEMA
	HIERARCHY.newIndexName=HIERARCHY.aliasName+Date.now().format("yyMMdd_HHmmss");

	var setup={
		"settings":{
			"index.number_of_shards": 1,
			"index.number_of_replicas": 1,
			"index.routing.allocation.total_shards_per_node": 1
		},
		"mappings":
			Map.newInstance(HIERARCHY.typeName, {
				"_source":{"enabled": true},
				"_all" : {"enabled" : false},
				"properties":{
					"bug_id":{"type":"integer", "store":"yes"},
					"children":{"type":"integer", "store":"yes", "index":"not_analyzed"},
					"parents":{"type":"integer", "store":"yes", "index":"not_analyzed"},
					"descendants":{"type":"integer", "store":"yes", "index":"not_analyzed"}
				}
			})
	};

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+HIERARCHY.newIndexName,
		"data":setup
	}));
	D.println(data);


//		var lastAlias;  		//THE VERSION CURRENTLY IN USE

	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	D.println(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(HIERARCHY.aliasName)) continue;
		if (name==HIERARCHY.newIndexName) continue;

		if (HIERARCHY.newIndexName===undefined || name>HIERARCHY.newIndexName){
			HIERARCHY.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			HIERARCHY.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for

};





HIERARCHY.get=function(minBug, maxBug){


	//DETERMINE IF WE ARE LOOKING AT A RANGE, OR A SPECIFIC SET, OF BUGS
	var esfilter;
	if (maxBug===undefined || maxBug==null){
		esfilter={"terms":{"bug_id":minBug}};
	}else{
		esfilter={"range":{"bug_id":{"gte":minBug, "lt":maxBug}}};
	}//endif


	var a=D.action("Get largest bug_id", true);
	var maxBugID=yield (ESQuery.run({
		"from":"tor_bugs",
		"select":{"value":"bug_id", "aggregate":"maximum"}
	}));
	maxBugID=maxBugID.cube.bug_id;
	D.actionDone(a);

	var connections=new OneToMany();  //SET TO STORE <parent> "-" <child> PAIRS

	var BLOCK_SIZE=10000;
	for(var i= 0;i<maxBugID+1;i+=BLOCK_SIZE){
		esfilter={"and":[
			{"range":{"bug_id":{"gte":i, "lt":i+BLOCK_SIZE}}},
//			{"not":{"term":{"bug_id":41273}}}
			{"not":{"term":{"bug_id":28424}}}  // WILL CAUSE OUT OF MEMORY EXCEPTION
		]};

		a=D.action("Get Current Bug Info between "+i+" and "+(i+BLOCK_SIZE), true);
		var currentData=yield (ESQuery.run({
			"from":"tor_bugs",
			"select":["bug_id","blocked"],
			"esfilter":{"and":[
				{"exists":{"field":"blocked"}},
				esfilter,
				{"or":[
					{"term":{"changes.field_name":"blocked"}},
					{"term":{"bug_version_num":1}}
				]}
			]}
		}));

		D.println("Num hierarchy records from "+i+" to "+(i+BLOCK_SIZE)+": "+currentData.list.length);

		//UPDATE THE MAP OF ALL EDGES
		for (var k=currentData.list.length;k--;){
			var c=currentData.list[k];
			var blocked=c.blocked;
			if (blocked.length){
				for (var j=blocked.length;j--;) connections.add(c, blocked[j]);
			}else{
				connections.add(c, blocked);
			}//endif
		}//for

		D.actionDone(a);
	}//for

	D.println("Number of edges: "+Object.keys(connections).length);

	yield (connections);
};//method



HIERARCHY.insertBatches=function(){
	//GET ALL CHILDREN
	var children=yield(HIERARCHY.get(0,1000000000));

	//REVERSE POINTERS
	var allParents=new OneToMany();
	var descendants=new OneToMany();
	children.forall(function(p, children){
		descendants.add(p,p);
		for(var i=children.length;i--;){
			allParents.add(children[i], p);
			descendants.add(p, children[i]);
		}//for
	});

	//FIND DESCENDANTS
	var workQueue=new aQueue(Object.keys(children.map));


	var share=aThread.share(500,100);
	while(workQueue.length>0){      //KEEP WORKING WHILE THERE ARE CHANGES
		if (share.yield()) yield (aThread.Yield);
		var node=workQueue.pop();
		var desc=descendants.get(node);

		var parents=allParents.get(node);
		for(var i=parents.length;i--;){
			var parent=parents[i];

			var original=descendants.get(parent);
			var more=original.union(desc);

			if (more.subtract(original).length>0){
				descendants.put(parent, more);
				workQueue.add(parent);
			}//endif
		}//for
	}//while

	D.println(CNV.Object2JSON(descendants));



};//method





HIERARCHY.insert=function(hierarchy){
	var uid=Util.UID();
	var insert=[];
	hierarchy.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : r.bug_id } }));
		insert.push(JSON.stringify(r));
	});
	var a=D.action("Push bug summary to ES", true);
	yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+HIERARCHY.newIndexName+"/"+HIERARCHY.typeName+"/_bulk",
		"data":insert.join("\n")+"\n",
		dataType: "text"
	}));
	D.actionDone(a);
};//method


