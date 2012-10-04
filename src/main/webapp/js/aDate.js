

Date.now = function(){
    var temp = new Date();
    return new Date(temp.getUTCFullYear(), temp.getUTCMonth(), temp.getUTCDate(),  temp.getUTCHours(), temp.getUTCMinutes(), temp.getUTCSeconds());
};//method

Date.newInstance=function(value){
	if (value===undefined || value==null) return null;
	return new Date(value);
};//method

Date.prototype.getMilli=Date.prototype.getTime;




Date.prototype.add=function(amount, interval){
	if (interval=="day") return this.addDay(amount);
	if (interval=="month") return this.addMonth(amount);
	if (interval=="week") return this.addWeek(amount);
	if (interval=="year") return this.addYear(amount);
	D.error("Can not add '"+interval+"'");
};//method

Date.prototype.addHour=function(value){
	var output=new Date(this);
	output.setHours(this.getHours()+value);
	return output;
};//method


Date.prototype.addDay=function(value){
	var output=new Date(this);
	output.setDate(this.getDate()+value);
	return output;
};//method

Date.prototype.addWeek=function(value){
	var output=new Date(this);
	output.setDate(this.getDate()+(value*7));
	return output;
};//method

Date.prototype.addMonth=function(value){
	var output=new Date(this);
	output.setMonth(this.getMonth()+value);
	return output;
};//method

Date.prototype.addYear=function(value){
	var output=new Date(this);
	output.setYear(this.getYear()+value);
	return output;
};//method


Date.prototype.floor=function(interval){
	if (interval=="day") return this.floorDay();
	if (interval=="month") return this.floorMonth();
	if (interval=="week") return this.floorWeek();
	if (interval=="year") return this.floorYear();
	D.error("Can not floor interval '"+interval+"'");
};//method



Date.prototype.floorYear=function(){
	var output=new Date(this);
	output.setMonth(0,1);
	output.setHours(0,0,0,0);
	return output;
};//method

Date.prototype.floorMonth=function(){
	var output=new Date(this);
	output.setDate(1);
	output.setHours(0,0,0,0);
	return output;
};//method

Date.prototype.floorWeek=function(){
	var output=new Date(this);
	output.setDate(this.getDate()-this.getDay());
	output.setHours(0,0,0,0);
	return output;
};//method

Date.prototype.floorDay=function(){
	var output=new Date(this);
	output.setHours(0,0,0,0);
	return output;
};//method





// ------------------------------------------------------------------
// These functions use the same 'format' strings as the
// java.text.SimpleDateFormat class, with minor exceptions.
// The format string consists of the following abbreviations:
//
// Field        | Full Form          | Short Form
// -------------+--------------------+-----------------------
// Year         | yyyy (4 digits)    | yy (2 digits), y (2 or 4 digits)
// Month        | MMM (name or abbr.)| MM (2 digits), M (1 or 2 digits)
//              | NNN (abbr.)        |
// Day of Month | dd (2 digits)      | d (1 or 2 digits)
// Day of Week  | EE (name)          | E (abbr)
// Hour (1-12)  | hh (2 digits)      | h (1 or 2 digits)
// Hour (0-23)  | HH (2 digits)      | H (1 or 2 digits)
// Hour (0-11)  | KK (2 digits)      | K (1 or 2 digits)
// Hour (1-24)  | kk (2 digits)      | k (1 or 2 digits)
// Minute       | mm (2 digits)      | m (1 or 2 digits)
// Second       | ss (2 digits)      | s (1 or 2 digits)
// AM/PM        | a                  |
//
// NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM, not mm!
// Examples:
//  "MMM d, y" matches: January 01, 2000
//                      Dec 1, 1900
//                      Nov 20, 00
//  "M/d/yy"   matches: 01/20/00
//                      9/2/00
//  "MMM dd, yyyy hh:mm:ssa" matches: "January 01, 2000 12:30:45AM"
// ------------------------------------------------------------------

Date.MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
Date.DAY_NAMES=new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat');
Date.LZ=function(x) {return(x<0||x>9?"":"0")+x};


// ------------------------------------------------------------------
// formatDate (date_object, format)
// Returns a date in the output format specified.
// The format string uses the same abbreviations as in getDateFromFormat()
// ------------------------------------------------------------------
Date.prototype.format=function(format){
	var y=this.getFullYear()+"";
	var M=this.getMonth()+1;
	var d=this.getDate();
	var E=this.getDay();
	var H=this.getHours();
	var m=this.getMinutes();
	var s=this.getSeconds();

	var v={};
	v["y"]=y;
	v["yyyy"]=y;
	v["yy"]=y.substring(2,4);
	v["M"]=M;
	v["MM"]=Date.LZ(M);
	v["MMM"]=Date.MONTH_NAMES[M-1];
	v["NNN"]=Date.MONTH_NAMES[M+11];
	v["d"]=d;
	v["dd"]=Date.LZ(d);
	v["E"]=Date.DAY_NAMES[E+7];
	v["EE"]=Date.DAY_NAMES[E];
	v["H"]=H;
	v["HH"]=Date.LZ(H);
	v["h"]=((H+11)%12)+1;
	v["hh"]=Date.LZ(v["h"]);
	v["K"]=H%12;
	v["KK"]=Date.LZ(v["K"]);
	v["k"]=H+1;
	v["kk"]=Date.LZ(v["k"]);
	v["a"]=["AM","PM"][Math.floor(H/12)];
	v["m"]=m;
	v["mm"]=Date.LZ(m);
	v["s"]=s;
	v["ss"]=Date.LZ(s);


	var output="";
	var formatIndex=0;
	while (formatIndex < format.length) {
		var c=format.charAt(formatIndex);
		var token="";
		while ((format.charAt(formatIndex)==c) && (formatIndex < format.length)) {
			token += format.charAt(formatIndex++);
		}//while

		if (v[token] != null) {
			output=output + v[token];
		}else{
			output=output + token;
		}//endif
	}
	return output;
};















var Duration=function(){};

Duration.newInstance=function(milli){
	if (milli==null) return null;
	var output=new Duration();
	output.milli=milli;
	return output;
};//method


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
};//method