/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("rest/BugzillaClient.js");


Bugzilla={};
//Bugzilla.JSON_URL="https://api-dev.bugzilla.mozilla.org/latest";
Bugzilla.URL="https://bugzilla.mozilla.org/buglist.cgi";
//Bugzilla.JSONP_CALLBACK="bz_callback";
//Bugzilla.numCallback=0;

Bugzilla.showBugs=function(bugList){
	var url=Bugzilla.searchBugsURL(bugList);
	window.open(url);
};//method


Bugzilla.searchBugsURL=function(bugList){
	if (bugList instanceof Array){
		return Bugzilla.URL+"?quicksearch="+bugList.join('%2C');
	}else if (typeof(buglist)=="string"){
		return Bugzilla.URL+"?quicksearch="+bugList.replaceAll(", ", "%2C");
	}else{
		return Bugzilla.URL+"?quicksearch="+bugList;
	}//endif
};//method

Bugzilla.linkToBug=function(bugList){
	return "<a href='"+Bugzilla.searchBugsURL(bugList)+"'>"+bugList+"</a>";
};//method




Bugzilla.search=function(bugList, fields){
	var BLOCK_SIZE=100;

	var resume=yield (aThread.Resume);
	var result=[];
	var numCalls=aMath.floor((bugList.length+BLOCK_SIZE-1)/BLOCK_SIZE);

	for(let i=0;i<numCalls;i++){
		new BugzillaClient({}).searchBugs({
			"id":bugList.substring(i*BLOCK_SIZE, aMath.min(bugList.length, i*BLOCK_SIZE+BLOCK_SIZE)),
			"include_fields":fields.join(",")
		}, function(status, data){
			if (status=="error"){
				numCalls--;
				throw new Exception("can not get bugs!");
			}//endif
			numCalls--;
			D.println(result.length+"+"+data.length);
			result.appendArray(data);
			if (numCalls==0) resume(result);
		});

	}//for
	yield (aThread.Suspend);
	yield (result);
};//method




