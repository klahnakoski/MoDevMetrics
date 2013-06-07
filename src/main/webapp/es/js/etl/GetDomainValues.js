/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


//EXTRACT ALL DOMAIN VALUES TO CHARACTERIZE THE ES STORE

//ALL IMMEDIATE FIELDS
var indexes=["bugs", "bugs.flags", "bugs.attachments", "bug.attachments.flags"];

//ALL ATTACHMENTS
//ALL FLAGS
indexes.forall(function(index, i){
	var columns=ESQuery.INDEXES[index];
	columns.forall(function(col, j){
		if (col.name=="status_whiteboard"){
			//DO NOTHING
		}else if (col.name.startsWith("keyword")){
			//DO NOTHING
		}else if (col.type=="string"){
			var query={
				"from":index,
				"select":{"value":col.name}
			};
			var result=yield (ESQuery.run(query));

			var result2=yield (CUBE.calc2List({
				"from":result,
				"edges":[
					col.name
				]
			}));

			D.println(index+"."+col.name+"="+result2.list.map(function(v){return v[col.name];}));

		}else if (["boolean", "integer", "date", "long"].contains(col.type)){
			var query={
				"from":index,
				"select":[
					{"name":"min", "value":col.name, "aggregate":"minimum"},
					{"name":"max", "value":col.name, "aggregate":"maximum"}
				]
			};
			Thread.run(function(){
				var result=yield (ESQuery.run(query));
				D.println(index+"."+col.name+"={min:"+result.min+",max:"+result.max+"}");
			});
		}else{
			D.error("do not know what to do here");
		}//endif



	});

});
//GET MIN/MAX ON LINEAR FIELDS
//GET SPECIFIC VALUES ON VALUE FIELDS
