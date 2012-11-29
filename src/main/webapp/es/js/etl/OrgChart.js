

var OrgChart={};

importScript("ETL.js");


OrgChart.URL="https://phonebook.mozilla.org"
OrgChart.BATCH_SIZE=1000000000;		//ETL IS BUG BASED, BIG ENOUGH TO DO IN ONE BATCH
OrgChart.aliasName="org_chart";
OrgChart.newIndexName=undefined;  //CURRENT INDEX FOR INSERT
OrgChart.oldIndexName=undefined;  //WHERE THE CURENT ALIAS POINTS
OrgChart.typeName="person";





OrgChart.get=function(minBug, maxBug){
//	OrgChart.USERNAME=$("#username").val();
//	OrgChart.PASSWORD=$("#password").val();

//	var html=yield(Rest.get({
//		"url":OrgChart.URL+"/tree.php",
//		"username":"klahnakoski",
//		"password":"password"
//	}));


	var people=OrgChart.people.map(function(v, i){
		return {"id":v.dn, "name":v.cn, "manager":v.manager ? v.manager.dn : null, "email":v.bugzillaemail};
	});
	yield people;


//LOAD ALL USERS (SEE NETWORK RESPONSES IN DEBUG MODE)
	var url=OrgChart.URL+"/search.php?format=json&query=*";
	var html=$("<script type=\"application/javascript;version=1.9\" src=\""+url+"\"></script>");
	var body=$("body");
	body.append(html);




//JAVASCRIPT DOES NOT LOAD
//	var html=OrgChart.html;
//	var list=$(html).find("#orgchart").find("li").find("a").map(function(i){
//		var email=$(this).attr("href").substring(8);
//		return email;
//	});
//
//	for(var i=list.length;i--;){
//		OrgChart.addPerson(list[i]);
//	}//for
//
//
//	yield (aThread.sleep(4000));
//
//	$("body").find("script").each(function(i){
//		if ($(this).attr("id")){
//			var content=$(this).html();
//			D.println(content);
//		}//endif
//	});

};//method



OrgChart.addPerson=function(email){
	//I CAN NOT GET THE DATA OUT OF THE SCRIPT ELEMENT (NOT JAVASCRIPT, SO NO LOAD)
	//RUN IN DEBUG MODE, AND SEE THE RESPONSE WILL HAVE *ALL* PEOPLE
	var id=email;
	var url=OrgChart.URL+"/search.php?format=json&query=";
//	var url=OrgChart.URL+"/search.php?format=json&query="+email;

	var html=$("<script id=\""+id+"\" type=\"application/javascript;version=1.9\" src=\""+url+"\"></script>");
	var body=$("body");
	body.append(html);

//WORKS, BUT ORG CHART DOES NOT SERVE JSONP
//	var data2=$.ajax({
//		"type":"get",
//		"url":OrgChart.URL+"/search.php?callback=?",
//		"dataType":"jsonp",
//		"data":{"format":"json", "query":email},
//		"success": function() {
//			  console.log(arguments);
//			  var temp=data.length;
//			  D.println(CNV.Object2JSON(data));
//		},
//		"error":function(data){
//			console.log(arguments);
//		}
//  });



//	$.getJSON({
//		url:OrgChart.URL+"/search.php?jsoncallback=?",
//		data:{"format":"json", "query":email},
//		success:function(data){
//			D.println(data);
//
//		},
//		error:function(data){
//			D.println(data);
//		}
//
//	});
//

//
//	var html=yield(Rest.get({
//		"url":OrgChart.URL+"/tree.php"+url,
//		"dataType":"jsonp",
//		"username":OrgChart.USERNAME,
//		"password":OrgChart.PASSWORD
//	}));
//
//	D.println(html);

//	yield (null);
};




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

	status.message("Push people to ES");
	
	yield (Rest.post({
		"url":ElasticSearch.pushURL + "/" + OrgChart.newIndexName + "/" + OrgChart.typeName + "/_bulk",
		"data":insert.join("\n")+"\n",
		"dataType":"text"
	}));
};//method



