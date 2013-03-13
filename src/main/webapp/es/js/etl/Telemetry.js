/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var Telemetry={};

importScript("ETL.js");

if (!TelemetrySchema) TelemetrySchema={};

//Telemetry.URL="https://phonebook-dev.allizom.org/search.php";
Telemetry.BATCH_SIZE=1000;		//ETL IS BUG BASED, BIG ENOUGH TO DO IN ONE BATCH
Telemetry.aliasName="telemetry_copy";
Telemetry.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
Telemetry.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
Telemetry.typeName="data";



Telemetry.push=function(){
	yield (ETL.newInsert(Telemetry));
};



Telemetry.get=function(minBug, maxBug){

	//AFTER MUCH PAIN, I DECIDED TO TRY SUBMITTING A BUG TO THE WEB PEOPLE TO
	//SOLVE ACCESS PROBLEMS ON THE SERVER SIDE:
	//
	//https://bugzilla.mozilla.org/show_bug.cgi?id=831405
	//
	//THAT WAS FAST!  I LOVE WORKING HERE!

	var people;
//	var temp=window[Telemetry.JSONP_CALLBACK];
	{
		window[Telemetry.JSONP_CALLBACK]=function(json){
			Telemetry.people=json;
		};//method

		yield (aThread.yield());  //YIELD TO ALLOW FUNCTION TO BE ASSIGNED TO window

		var url=Telemetry.URL+"/search.php?format=jsonp&callback="+Telemetry.JSONP_CALLBACK+"&query=*";
		var html=$("<script type=\"application/javascript;version=1.9\" src=\""+url+"\"></script>");
		var body=$("body");
		body.append(html);

		while(!Telemetry.people){
			yield (aThread.sleep(1000));  //YIELD TO ALLOW SCRIPT TO LOAD AND EXECUTE
		}//while
		
		//HERE WE JUST RETURN THE LOCAL COPY
		people=Telemetry.people.map(function(v, i){
			return {"id":v.dn, "name":v.cn, "manager":v.manager ? v.manager.dn : null, "email":v.bugzillaemail};
		});

		D.println(people.length+" people found")

	}
//	window[Telemetry.JSONP_CALLBACK]=temp;

	yield (people);

};//method


Telemetry.getLastUpdated=function(){
	yield (Date.now());
};


Telemetry.makeSchema=function(){
	//MAKE SCHEMA
	Telemetry.newIndexName=Telemetry.aliasName+Date.now().format("yyMMdd_HHmmss");

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+Telemetry.newIndexName,
		"data":{"mappings":{"data":TelemetrySchema}}
	}));
	D.println(data);


	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	D.println(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(Telemetry.aliasName)) continue;
		if (name==Telemetry.newIndexName) continue;

		if (Telemetry.newIndexName===undefined || name>Telemetry.newIndexName){
			Telemetry.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			Telemetry.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for

};


Telemetry.insert=function(people){
	var uid=Util.UID();
	var insert=[];
	people.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : uid+"-"+i } }));
		insert.push(JSON.stringify(r));
	});

	var a=D.action("Push people to ES", true);
	var results=yield (Rest.post({
		"url":ElasticSearch.pushURL + "/" + Telemetry.newIndexName + "/" + Telemetry.typeName + "/_bulk",
		"data":insert.join("\n")+"\n",
		"dataType":"text"
	}));
	D.println(CNV.Object2JSON(CNV.JSON2Object(results)));

	D.actionDone(a);
};//method

{
   "histogram_names" :
      [
         "MEMORY_RESIDENT",
         "GLUESTARTUP_READ_OPS",
         "CYCLE_COLLECTOR",
         "SIMPLE_MEASURES_MAIN",
         "ZIPARCHIVE_CRC",
         "SIMPLE_MEASURES_SESSIONRESTORED",
         "MEMORY_LAYOUT_ALL",
         "EARLY_GLUESTARTUP_READ_TRANSFER",
         "SIMPLE_MEASURES_UPTIME",
         "SIMPLE_MEASURES_FIRSTPAINT",
         "GLUESTARTUP_READ_TRANSFER",
         "EARLY_GLUESTARTUP_READ_OPS",
         "MEMORY_JS_GC_HEAP"
      ],
   "date" : "20130302",
   "histograms" :
      {
         "MEMORY_RESIDENT" :
            {
               "bucket_count" : 10,
               "histogram_type" : 0,
               "values" :
                  [
                     [
                        285870,
                        0
                     ],
                     [
                        185364,
                        2
                     ],
                     [
                        77936,
                        0
                     ],
                     [
                        120194,
                        1
                     ]
                  ],
               "range" :
                  [
                     32768,
                     1048576
                  ],
               "count" : 1,
               "sum" : 539420
            },
         "SIMPLE_MEASURES_SESSIONRESTORED" :
            {
               "bucket_count" : 31,
               "histogram_type" : 1,
               "values" :
                  [
                     [
                        0,
                        1
                     ]
                  ],
               "range" :
                  [
                     0,
                     30001
                  ],
               "count" : 1,
               "sum" : 43161
            },
         "GLUESTARTUP_READ_OPS" :
            {
               "bucket_count" : 12,
               "histogram_type" : 1,
               "values" :
                  [
                     [
                        90,
                        0
                     ],
                     [
                        100,
                        1
                     ]
                  ],
               "range" :
                  [
                     1,
                     100
                  ],
               "count" : 1,
               "sum" : 407
            },
         "CYCLE_COLLECTOR" :
            {
               "bucket_count" : 50,
               "histogram_type" : 0,
               "values" :
                  [
                     [
                        10,
                        1
                     ],
                     [
                        6,
                        1
                     ],
                     [
                        12,
                        0
                     ],
                     [
                        8,
                        1
                     ],
                     [
                        7,
                        3
                     ],
                     [
                        2,
                        0
                     ],
                     [
                        4,
                        1
                     ],
                     [
                        3,
                        1
                     ]
                  ],
               "range" :
                  [
                     1,
                     10000
                  ],
               "count" : 1,
               "sum" : 53
            },
         "EARLY_GLUESTARTUP_READ_TRANSFER" :
            {
               "bucket_count" : 12,
               "histogram_type" : 0,
               "values" :
                  [
                     [
                        1,
                        0
                     ],
                     [
                        0,
                        1
                     ]
                  ],
               "range" :
                  [
                     1,
                     51200
                  ],
               "count" : 1,
               "sum" : 0
            },
      },
   "info" :
      {
         "appName" : "Firefox",
         "valid" : true,
         "platformBuildID" : "20110625030239",
         "arch" : "x86-64",
         "appVersion" : "7.0a1",
         "reason" : "idle-daily",
         "OS" : "WINNT",
         "appUpdateChannel" : "NA",
         "appBuildID" : "20110625030239",
         "version" : "6.1"
      }
}