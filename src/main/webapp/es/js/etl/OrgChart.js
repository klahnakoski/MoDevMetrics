

var OrgChart={};

importScript("ETL.js");


OrgChart.URL="https://phonebook.mozilla.org";
//OrgChart.URL="https://phonebook-dev.allizom.org/search.php";
OrgChart.JSONP_CALLBACK="workit";
OrgChart.BATCH_SIZE=1000000000;		//ETL IS BUG BASED, BIG ENOUGH TO DO IN ONE BATCH
OrgChart.aliasName="org_chart";
OrgChart.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
OrgChart.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
OrgChart.typeName="person";



OrgChart.push=function(){
	yield (ETL.newInsert(OrgChart));
};



OrgChart.get=function(minBug, maxBug){

	//AFTER MUCH PAIN, I DECIDED TO TRY SUBMITTING A BUG TO THE WEB PEOPLE TO
	//SOLVE ACCESS PROBLEMS ON THE SERVER SIDE:
	//
	//https://bugzilla.mozilla.org/show_bug.cgi?id=831405
	//
	//THAT WAS FAST!  I LOVE WORKING HERE!

	var people;
//	var temp=window[OrgChart.JSONP_CALLBACK];
	{
		window[OrgChart.JSONP_CALLBACK]=function(json){
			OrgChart.people=json;
		};//method

		yield (aThread.yield());  //YIELD TO ALLOW FUNCTION TO BE ASSIGNED TO window

		var url=OrgChart.URL+"/search.php?format=jsonp&callback="+OrgChart.JSONP_CALLBACK+"&query=*";
		var html=$("<script type=\"application/javascript;version=1.9\" src=\""+url+"\"></script>");
		var body=$("body");
		body.append(html);

		yield (aThread.sleep(1000));  //YIELD TO ALLOW SCRIPT TO LOAD AND EXECUTE

		//HERE WE JUST RETURN THE LOCAL COPY
		people=OrgChart.people.map(function(v, i){
			return {"id":v.dn, "name":v.cn, "manager":v.manager ? v.manager.dn : null, "email":v.bugzillaemail};
		});

		D.println(people.length+" people found")

	}
//	window[OrgChart.JSONP_CALLBACK]=temp;

	yield (people);

};//method


OrgChart.getLastUpdated=function(){
	yield (Date.now());
};


OrgChart.makeSchema=function(){
	//MAKE SCHEMA
	OrgChart.newIndexName=OrgChart.aliasName+Date.now().format("yyMMdd_HHmmss");

	var config={
		"_source":{"enabled": true},
		"_all" : {"enabled" : false},
		"properties":{
			"id":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"name":{"type":"string", "store":"yes", "index":"not_analyzed"},
			"manager":{"type":"string", "store":"yes", "index":"not_analyzed", "null_value":"null"},
			"email":{"type":"string", "store":"yes", "index":"not_analyzed"}
		}
	};

	var setup={
		"mappings":{
		}
	};
	setup.mappings[OrgChart.typeName]=config;

	var data=yield (Rest.post({
		"url":ElasticSearch.pushURL+"/"+OrgChart.newIndexName,
		"data":setup
	}));
	D.println(data);


	//GET ALL INDEXES, AND REMOVE OLD ONES, FIND MOST RECENT
	data=yield (Rest.get({url: ElasticSearch.pushURL+"/_aliases"}));
	D.println(data);

	var keys=Object.keys(data);
	for(var k=keys.length;k--;){
		var name=keys[k];
		if (!name.startsWith(OrgChart.aliasName)) continue;
		if (name==OrgChart.newIndexName) continue;

		if (OrgChart.newIndexName===undefined || name>OrgChart.newIndexName){
			OrgChart.newIndexName=name;
		}//endif

		if (Object.keys(data[name].aliases).length>0){
			OrgChart.oldIndexName=name;
			continue;
		}//endif

		//OLD, REMOVE IT
		yield (Rest["delete"]({url: ElasticSearch.pushURL+"/"+name}));
	}//for

};


OrgChart.insert=function(people){
	var uid=Util.UID();
	var insert=[];
	people.forall(function(r, i){
		insert.push(JSON.stringify({ "create" : { "_id" : uid+"-"+i } }));
		insert.push(JSON.stringify(r));
	});

	var a=D.action("Push people to ES", true);
	yield (Rest.post({
		"url":ElasticSearch.pushURL + "/" + OrgChart.newIndexName + "/" + OrgChart.typeName + "/_bulk",
		"data":insert.join("\n")+"\n",
		"dataType":"text"
	}));
	D.actionDone(a);
};//method



