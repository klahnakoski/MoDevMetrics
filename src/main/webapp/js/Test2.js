function Status(channel){
	this.lastMessage = "";
	this.channel = channel;
}
;

Status.prototype.message = function(message){
	document.getElementById(this.channel).innerHTML = message;
	this.lastMessage = message;
};

Status.prototype.addMessage = function(message){
	this.lastMessage = this.lastMessage + "</br>" + message;
	document.getElementById(this.channel).innerHTML = this.lastMessage;
};

function DataSet(){
	this.bugzilla = {};
	this.elastic = {};
}
;

function IntegrityTest(){
	this.dataSet = new DataSet();
	this.dataSet.bugzilla = { "found" : 0 };
	this.dataSet.elastic = { "found" : 0, "missing" : [] };

	this.testConfig = null;
	this.first = true;
}
;


IntegrityTest.prototype.run = function(testConfig){
	this.testConfig = testConfig;
	this.first = true;

	this.nextQuery();
};

IntegrityTest.prototype.nextQuery = function(){
	if (this.first){
		this.sendBugzillaRequest(this.testConfig.Compare.Bugzilla);
	}
	else{
		this.sendElasticRequest(this.testConfig.Compare.ElasticSearch);
	}
};

IntegrityTest.prototype.sendElasticRequest = function(query){
	var localObject = this;

	$.ajax({
//		url: "http://node24.generic.metrics.scl3.mozilla.com:9200/_search", //MTP VPN required
		url: window.ElasticSearchRestURL, // LDAP required
		type: "POST",
//		contentType: "application/json",
		data: JSON.stringify(query),
		dataType: "json",
//		traditional: true,
//		processData: false,
//		timeout: 100000,

		success: function(data){
			localObject.success(data);
		},

		error: function (errorData, errorMsg, errorThrown){
			localObject.error(errorData, errorMsg, errorThrown);
		},
	});
};

IntegrityTest.prototype.sendBugzillaRequest = function(query){
	var localObject = this;

	$.ajax({
		url: query + "&username=sieth%40mysix.com&password=Thetester",
		type: "GET",
//		contentType: "application/json",
//		data: queryString,
//		dataType: "json",
//		traditional: true,
//		processData: false,
//		timeout: 100000,

		success: function(data){
			localObject.success(data);
		},

		error: function (errorData, errorMsg, errorThrown){
			localObject.error(errorData, errorMsg, errorThrown);
		},
	});
};


IntegrityTest.prototype.success = function(data){

	if (this.first){
		this.successBugzilla(data);
		this.first = false;
		this.nextQuery();
	}
	else{
		this.successElastic(data);
		this.statusUpdate();
	}
};

IntegrityTest.prototype.successBugzilla = function(data){
//	info.addMessage( "Bugzilla Result: " + JSON.stringify( data ) );
	this.dataSet.bugzilla.raw = data;


	if (!isEmpty(data)){
		this.dataSet.bugzilla.found = data.bugs.length;
		this.dataSet.first = false;
	}
};

IntegrityTest.prototype.successElastic = function(data){
//	info.addMessage( "Elastic Result: " + JSON.stringify( data ) );

	this.dataSet.elastic.raw = data;
	this.dataSet.elastic.found = data.hits.total;
};

IntegrityTest.prototype.error = function(errorData, errorMsg, errorThrown){
	info.addMessage(errorMsg + ": " + JSON.stringify(errorData) + ", " + errorThrown);
};

IntegrityTest.prototype.statusUpdate = function(){
	if (this.dataSet.elastic.found >= this.dataSet.bugzilla.found)
		testMessage.addMessage('<div style="color: #009900; font:10px arial,sans-serif;">' + this.testConfig.name + " Passed.</div>");
	else{
		testMessage.addMessage('<div style="color: #990000; font:10px arial,sans-serif;">' + this.testConfig.name + " Failed.</div>");
		this.Compare();
	}

}

IntegrityTest.prototype.Compare = function(){
	this.ParseIDs();

	var a = arr_diff(this.dataSet.bugzilla.ids, this.dataSet.elastic.ids)
	var m = "";

	if (this.dataSet.bugzilla.found > this.dataSet.elastic.found)
		testMessage.addMessage("Elastic Search DB is missing: ");
	else
		testMessage.addMessage("Bugzilla is missing: ");


	for(var i = 0; i < a.length; i++){
		m += a[i] + ", ";
	}
	testMessage.addMessage(m);
}

IntegrityTest.prototype.ParseIDs = function(){
	this.ParseBugzillaIDs();
	this.ParseElasticIDs();

}

IntegrityTest.prototype.ParseBugzillaIDs = function(){
	var ids = this.dataSet.bugzilla.raw.bugs;
	this.dataSet.bugzilla.ids = []

	for(var i = 0; i < ids.length; i++){
		this.dataSet.bugzilla.ids.push(ids[i].id);
	}

	this.dataSet.bugzilla.raw = {};
//	console.info( JSON.stringify(this.dataSet))
}

IntegrityTest.prototype.ParseElasticIDs = function(){
	var ids = this.dataSet.elastic.raw.hits.hits;
	this.dataSet.elastic.ids = []

	for(var i = 0; i < ids.length; i++){
		this.dataSet.elastic.ids.push(ids[i].fields.bug_id);
	}

	this.dataSet.elastic.raw = {};
	console.info(JSON.stringify(this.dataSet))
}

function arr_diff(a1, a2){
	var a = [], diff = [];
	for(var i = 0; i < a1.length; i++)
		a[a1[i]] = true;
	for(var i = 0; i < a2.length; i++)
		if (a[a2[i]]) delete a[a2[i]];
		else a[a2[i]] = true;
	for(var k = 0; k < a.length; k++)
		diff.push(k);
	return diff;
}


var isEmpty = function(obj){
	return Object.keys(obj).length === 0;
}

var twoDec = function(value){
	return Math.round(value * 100) / 100
}

testMessage = new Status("testMessage");
info = new Status("info");


