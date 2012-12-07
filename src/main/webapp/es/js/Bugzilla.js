Bugzilla={};

Bugzilla.showBugs=function(bugList){
	window.open(Bugzilla.searchBugsURL(bugList));
};//method


Bugzilla.searchBugsURL=function(bugList){
	return "https://bugzilla.mozilla.org/buglist.cgi?quicksearch="+bugList.join('%2C');
};//method
