

Date.now = function(){
    var temp = new Date();
    return new Date(temp.getUTCFullYear(), temp.getUTCMonth(), temp.getUTCDate(),  temp.getUTCHours(), temp.getUTCMinutes(), temp.getUTCSeconds());
}//method

Date.newInstance=function(value){
	if (value===undefined || value==null) return null;
	return new Date(value);
}//method

Date.prototype.getMilli=Date.prototype.getTime;




Date.prototype.add=function(amount, interval){
	if (interval=="day") return this.addDay(amount);
	if (interval=="month") return this.addMonth(amount);
	if (interval=="week") return this.addWeek(amount);
	if (interval=="year") return this.addYear(amount);
	D.error("Can not add '"+interval+"'");
}//method

Date.prototype.addHour=function(value){
	var output=new Date(this);
	output.setHours(this.getHours()+value);
	return output;
}//method


Date.prototype.addDay=function(value){
	var output=new Date(this);
	output.setDate(this.getDate()+value);
	return output;
}//method

Date.prototype.addWeek=function(value){
	var output=new Date(this);
	output.setDate(this.getDate()+(value*7));
	return output;
}//method

Date.prototype.addMonth=function(value){
	var output=new Date(this);
	output.setMonth(this.getMonth()+value);
	return output;
}//method

Date.prototype.addYear=function(value){
	var output=new Date(this);
	output.setYear(this.getYear()+value);
	return output;
}//method


Date.prototype.floor=function(interval){
	if (interval=="day") return this.floorDay();
	if (interval=="month") return this.floorMonth();
	if (interval=="week") return this.floorWeek();
	if (interval=="year") return this.floorYear();
	D.error("Can not floor interval '"+interval+"'");
}//method



Date.prototype.floorYear=function(){
	var output=new Date(this);
	output.setMonth(0,1);
	output.setHours(0,0,0,0);
	return output;
}//method

Date.prototype.floorMonth=function(){
	var output=new Date(this);
	output.setDate(1);
	output.setHours(0,0,0,0);
	return output;
}//method

Date.prototype.floorWeek=function(){
	var output=new Date(this);
	output.setDate(this.getDate()-this.getDay());
	output.setHours(0,0,0,0);
	return output;
}//method

Date.prototype.floorDay=function(){
	var output=new Date(this);
	output.setHours(0,0,0,0);
	return output;
}//method



var Duration=function(){};

Duration.newInstance=function(milli){
	if (milli==null) return null;
	var output=new Duration();
	output.milli=milli;
	return output;
}//method


Duration.prototype.value=function(){
	var output="";
	var rest=Math.abs(this.milli);
	var isNegative=(this.milli<0);

	//MILLI
	var rem=rest%1000;
	if (rem!=0) output="+"+rem+"milli"+output;
	rest=Math.floor(rest/1000);

	//SECOND
	rem=rest%60;
	if (rem!=0) output="+"+rem+"second"+output;
	rest=Math.floor(rest/60);

	//MINUTE
	rem=rest%60;
	if (rem!=0) output="+"+rem+"minute"+output;
	rest=Math.floor(rest/60);

	//HOUR
	rem=rest%24;
	if (rem!=0) output="+"+rem+"hour"+output;
	rest=Math.floor(rest/24);

	//DAY
	rem=rest%7;
	if (rem!=0) output="+"+rem+"day"+output;
	rest=Math.floor(rest/7);

	//DAY
	if (rest!=0) output="+"+rest+"week"+output;

	if (isNegative) output=output.replace("+", "-");
	return output;
}//method