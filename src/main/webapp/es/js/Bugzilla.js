/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Bugzilla={};

Bugzilla.showBugs=function(bugList){
	window.open(Bugzilla.searchBugsURL(bugList));
};//method


Bugzilla.searchBugsURL=function(bugList){
	return "https://bugzilla.mozilla.org/buglist.cgi?quicksearch="+bugList.join('%2C');
};//method
