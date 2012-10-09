

Date.now = function(){
    return new Date();
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

//CONVERT THIS GMT DATE TO LOCAL DATE
Date.prototype.addTimezone=function(){
	return this.addMinute(-new Date().getTimezoneOffset());
};

Date.prototype.addMinute=function(value){
	var output=new Date(this);
	output.setUTCMinutes(this.getUTCMinutes()+value);
	return output;
};//method



Date.prototype.addHour=function(value){
	var output=new Date(this);
	output.setUTCHours(this.getUTCHours()+value);
	return output;
};//method


Date.prototype.addDay=function(value){
	var output=new Date(this);
	output.setUTCDate(this.getUTCDate()+value);
	return output;
};//method

Date.prototype.addWeek=function(value){
	var output=new Date(this);
	output.setUTCDate(this.getUTCDate()+(value*7));
	return output;
};//method

Date.prototype.addMonth=function(value){
	var output=new Date(this);
	output.setUTCMonth(this.getUTCMonth()+value);
	return output;
};//method

Date.prototype.addYear=function(value){
	var output=new Date(this);
	output.setUTCFullYear(this.getUTCFullYear()+value);
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
	output.setUTCMonth(0,1);
	output.setUTCHours(0,0,0,0);
	return output;
};//method

Date.prototype.floorMonth=function(){
	var output=new Date(this);
	output.setUTCDate(1);
	output.setUTCHours(0,0,0,0);
	return output;
};//method

Date.prototype.floorWeek=function(){
	var output=new Date(this);
	output.setUTCDate(this.getDate()-this.getDay());
	output.setUTCHours(0,0,0,0);
	return output;
};//method

Date.prototype.floorDay=function(){
	var output=new Date(this);
	output.setUTCHours(0,0,0,0);
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
	var y=this.getUTCFullYear()+"";
	var M=this.getUTCMonth()+1;
	var d=this.getUTCDate();
	var E=this.getUTCDay();
	var H=this.getUTCHours();
	var m=this.getUTCMinutes();
	var s=this.getUTCSeconds();

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



Date.Timezones={
	"GMT":0,
	"EST":-5,
	"CST":-6,
	"MST":-7,
	"PST":-8
};


Date.getTimezone=function(){
	var offset=new Date().getTimezoneOffset();

	//CHEAT AND SIMPLY GUESS
	if (offset==240 || offset==300) return "EDT";
	if (offset==420 || offset==480) return "PDT";
	return "("+Math.round(offset/60)+"GMT)"

};











var Duration=function(){
	this.milli=0;
};


Duration.parse=function(value){
	var output=new Duration();

	//EXPECTING CONCAT OF <sign><integer><type>
	var plist=value.split("+");
	for(var p in plist){
		var mlist=plist[p].split("-");
		output.milli+=Duration.text2milli(mlist[0]);
		for(var m=1;m<mlist.length;m++){
			output.milli-=Duration.text2milli(mlist[m]);
		}//for
	}//for
	return output;
};//method


Duration.TYPE={
	"year":52*7*24*60*60*1000,		//52weeks
	"quarter":13*7*24*60*60*1000,	//13weeks
	"month":28*24*60*60*1000,		//4weeks
	"week":7*24*60*60*1000,
	"day":24*60*60*1000,
	"hour":60*60*1000,
	"minute":60*1000,
	"second":1000
};

Duration.text2milli=function(text){
	var s=0;
	while (text.charAt(s)<='9') s++;

	if (s==0) return Duration.TYPE[text.rightBut(s)];

	return CNV.String2Integer(text.left(s))*Duration.TYPE[text.rightBut(s)];
};//method

Duration.newInstance=function(obj){
	if (obj===undefined) return undefined;
	if (obj==null) return null;
	if (Math.isNumeric(obj)){
		var output=new Duration();
		output.milli=obj;
		return output;
	}else if (typeof(obj)=="string"){
		return Duration.parse(obj);
	}else if (!(obj.milli===undefined)){
		var output=new Duration();
		output.milli=obj.milli;
		return output;
	}else if (isNaN(obj)){
		return null;
	}else{
		D.error("Do not know type of object ("+CNV.Object2JSON(obj)+")of to make a Duration");
	}//endif
};//method


Duration.prototype.add=function(duration){
	return Duration.newInstance(this.milli+duration.milli);
};//method


Duration.prototype.floor=function(interval){
	if (interval.milli===undefined) D.error("Expecting an interval as a Duration object");
	var output=new Duration();
	output.milli=Math.floor(this.milli/interval.milli)*interval.milli;
	return output;
};//method


Duration.prototype.toString=function(){
	if (this.milli==0) return "zero";


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