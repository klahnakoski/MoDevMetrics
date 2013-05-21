importScript("aDate.js");
importScript("aDuration.js");
importScript("aDebug.js");


var aTimer=function(){};

aTimer.start=function(name){
	var t=new aTimer();
	t.name=name;
	t.start=window.performance.now();
	return t;
};//method

aTimer.prototype.end=function(){
	var end=window.performance.now();
	D.println(this.name+" ("+Duration.newInstance(end-this.start).toString()+")");
};//method

aTimer.prototype.stop=aTimer.prototype.end;