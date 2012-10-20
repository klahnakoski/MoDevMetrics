

//THE CONTENT FOUDN AT https://metrics.mozilla.com/bugzilla-analysis IS ACTUALLY
//A PROXY OF WHAT CAN BE FOUND AT http://people.mozilla.com/~klahnakoski/es
//THIS ALLOWS THE BROWSER TO ACCESS METRIC'S ES DOCUMENT STORE.

//OTHERWISE, YOU WILL REQUIRE VPN ACCESS TO MOZILLA-MPT TO MAKE THESE PAGES WORK

var ElasticSearchRestURL;
if (window.location.hostname=="metrics.mozilla.com"){
	//FROM Daniel Einspanjer  Oct 20, 2012 (for use on website)
	//FOR ANYONE, BUT ONLY THROUGH METRIC'S SERVERS
	ElasticSearchRestURL = "/bugzilla-analysis-es/bugs/_search";
}else{
	//FROM Mark Reid Sept 25, 2012 (for use during coding)
	//ONLY WITH MOZILLA_MPT
	ElasticSearchRestURL = "http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/_search";
}//endif
