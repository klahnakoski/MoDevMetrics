Date.now = function(){
	return new Date();
};//method

Date.newInstance = function(value){
	if (value === undefined || value == null) return null;
	return new Date(value);
};//method

Date.prototype.getMilli = Date.prototype.getTime;




Date.prototype.add = function(interval){
	if (interval===undefined || interval==null){
		D.error("expecting an interval to add");
	}//endif

	var i = Duration.newInstance(interval);

	var addMilli = i.milli - (Duration.MILLI_VALUES["month"] * i.month);
	return this.addMonth(i.month).addMilli(addMilli);
};//method



Date.prototype.subtract=function(time, interval){
	if (interval===undefined || interval.month==0){
		if (time.getMilli!==undefined){
			//SUBTRACT TIME
			return Duration.newInstance(this.getMilli()-time.getMilli());
		}else{
			//SUBTRACT DURATION
			var residue = time.milli - (Duration.MILLI_VALUES["month"] * time.month);
			return this.addMonth(-time.month).addMilli(-residue);
		}//endif
	}else{
		if (time.getMilli!==undefined){
			//SUBTRACT TIME
			return Date.diffMonth(this, time);
		}else{
			//SUBTRACT DURATION
			return this.addMilli(-time.milli);
		}//endif
	}//endif
};//method



Date.diffMonth=function(endTime, startTime){
	//MAKE SURE WE HAVE numMonths THAT IS TOO BIG;
	var numMonths=Math.floor((endTime.getMilli()-startTime.getMilli()+(Duration.MILLI_VALUES.day*31))/Duration.MILLI_VALUES.year*12);

	var test = startTime.addMonth(numMonths);
	while (test.getMilli()>=endTime.getMilli()){
		numMonths--;
		test= startTime.addMonth(numMonths);
	}//while


	////////////////////////////////////////////////////////////////////////////
	// TEST
	var testMonth=0;
	while(startTime.addMonth(testMonth).getMilli()<endTime.getMilli()){
		testMonth++;
	}//while
	testMonth--;
	if (testMonth!=numMonths)
		D.error("Error calculating number of months between ("+startTime.format("yy-MM-dd HH:mm:ss")+") and ("+endTime.format("yy-MM-dd HH:mm:ss")+")");
	// DONE TEST
	////////////////////////////////////////////////////////////////////////////

	var output=new Duration();
	output.month=numMonths;
	output.milli=endTime.getMilli()-startTime.addMonth(numMonths).getMilli()+(numMonths*Duration.MILLI_VALUES.month);
	return output;
};//method






//CONVERT THIS GMT DATE TO LOCAL DATE
Date.prototype.addTimezone = function(){
	return this.addMinute(-new Date().getTimezoneOffset());
};

Date.prototype.addMilli = function(value){
	return new Date(this.getMilli() + value);
};//method


Date.prototype.addSecond = function(value){
	var output = new Date(this);
	output.setUTCSeconds(this.getUTCSeconds() + value);
	return output;
};//method

Date.prototype.addMinute = function(value){
	var output = new Date(this);
	output.setUTCMinutes(this.getUTCMinutes() + value);
	return output;
};//method


Date.prototype.addHour = function(value){
	var output = new Date(this);
	output.setUTCHours(this.getUTCHours() + value);
	return output;
};//method


Date.prototype.addDay = function(value){
	var output = new Date(this);
	output.setUTCDate(this.getUTCDate() + value);
	return output;
};//method

Date.prototype.addWeek = function(value){
	var output = new Date(this);
	output.setUTCDate(this.getUTCDate() + (value * 7));
	return output;
};//method

Date.prototype.addMonth = function(value){
	var output = new Date(this);
	output.setUTCMonth(this.getUTCMonth() + value);
	return output;
};//method

Date.prototype.addYear = function(value){
	var output = new Date(this);
	output.setUTCFullYear(this.getUTCFullYear() + value);
	return output;
};//method

//RETURN A DATE ROUNDED DOWN TO THE CLOSEST FULL INTERVAL
//
Date.prototype.floor = function(interval, minDate){
	if (minDate===undefined){
		if (interval.milli!=undefined) interval=interval.toString();

		if (interval.indexOf("year")>=0) return this.floorYear();
		if (interval.indexOf("month")>=0) return this.floorMonth();
		if (interval.indexOf("week")>=0) return this.floorWeek();
		if (interval.indexOf("day")>=0) return this.floorDay();
		if (interval.indexOf("hour")>=0) return this.floorHour();
		D.error("Can not floor interval '" + interval + "'");
	}//endif

	return minDate.add(this.subtract(minDate).floor(interval));
};//method


Date.prototype.floorYear = function(){
	var output = new Date(this);
	output.setUTCMonth(0, 1);
	output.setUTCHours(0, 0, 0, 0);
	return output;
};//method


Date.prototype.floorMonth = function(){
	var output = new Date(this);
	output.setUTCDate(1);
	output.setUTCHours(0, 0, 0, 0);
	return output;
};//method


Date.prototype.floorWeek = function(){
	var output = new Date(this);
	output.setUTCDate(this.getDate() - this.getDay());
	output.setUTCHours(0, 0, 0, 0);
	return output;
};//method


Date.prototype.floorDay = function(){
	var output = new Date(this);
	output.setUTCHours(0, 0, 0, 0);
	return output;
};//method


Date.prototype.floorHour = function(){
	var output = new Date(this);
	output.setUTCMinutes(0);
	return output;
};//method




Date.prototype.ceilingDay = function(){
	return this.floorDay().addDay(1);
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

Date.MONTH_NAMES = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
Date.DAY_NAMES = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
Date.LZ = function(x){
	return(x < 0 || x > 9 ? "" : "0") + x
};


// ------------------------------------------------------------------
// formatDate (date_object, format)
// Returns a date in the output format specified.
// The format string uses the same abbreviations as in getDateFromFormat()
// ------------------------------------------------------------------
Date.prototype.format = function(format){
	var y = this.getUTCFullYear() + "";
	var M = this.getUTCMonth() + 1;
	var d = this.getUTCDate();
	var E = this.getUTCDay();
	var H = this.getUTCHours();
	var m = this.getUTCMinutes();
	var s = this.getUTCSeconds();

	var v = {};
	v["y"] = y;
	v["yyyy"] = y;
	v["yy"] = y.substring(2, 4);
	v["M"] = M;
	v["MM"] = Date.LZ(M);
	v["MMM"] = Date.MONTH_NAMES[M - 1];
	v["NNN"] = Date.MONTH_NAMES[M + 11];
	v["d"] = d;
	v["dd"] = Date.LZ(d);
	v["E"] = Date.DAY_NAMES[E + 7];
	v["EE"] = Date.DAY_NAMES[E];
	v["H"] = H;
	v["HH"] = Date.LZ(H);
	v["h"] = ((H + 11) % 12) + 1;
	v["hh"] = Date.LZ(v["h"]);
	v["K"] = H % 12;
	v["KK"] = Date.LZ(v["K"]);
	v["k"] = H + 1;
	v["kk"] = Date.LZ(v["k"]);
	v["a"] = ["AM","PM"][Math.floor(H / 12)];
	v["m"] = m;
	v["mm"] = Date.LZ(m);
	v["s"] = s;
	v["ss"] = Date.LZ(s);


	var output = "";
	var formatIndex = 0;
	while(formatIndex < format.length){
		var c = format.charAt(formatIndex);
		var token = "";
		while((format.charAt(formatIndex) == c) && (formatIndex < format.length)){
			token += format.charAt(formatIndex++);
		}//while

		if (v[token] != null){
			output = output + v[token];
		} else{
			output = output + token;
		}//endif
	}
	return output;
};


Date.Timezones = {
	"GMT":0,
	"EST":-5,
	"CST":-6,
	"MST":-7,
	"PST":-8
};



Date.getTimezone = function(){
	D.warning("Date.getTimezone is incomplete!");
	Date.getTimezone=function(){
		var offset = new Date().getTimezoneOffset();

		//CHEAT AND SIMPLY GUESS
		if (offset == 240 || offset == 300) return "EDT";
		if (offset == 420 || offset == 480) return "PDT";
		return "(" + Math.round(offset / 60) + "GMT)"
	};
	return Date.getTimezone();
};

////////////////////////////////////////////////////////////////////////////////
// WHAT IS THE MOST COMPACT DATE FORMAT TO DISTINGUISH THE RANGE
////////////////////////////////////////////////////////////////////////////////
Date.getBestFormat=function(minDate, maxDate, interval){
	var minFormat=5; //SECONDS
	if (interval.milli>=Duration.MILLI_VALUES.minute) minFormat=4;
	if (interval.milli>=Duration.MILLI_VALUES.hour) minFormat=3;
	if (interval.milli>=Duration.MILLI_VALUES.day) minFormat=2;
	if (interval.milli>=Duration.MILLI_VALUES.month) minFormat=1;
	if (interval.month>=Duration.MONTH_VALUES.month) minFormat=1;
	if (interval.month>=Duration.MONTH_VALUES.year) minFormat=0;

	var maxFormat=0;
	var span=maxDate.subtract(minDate, interval);
	if (span.month<Duration.MONTH_VALUES.year && span.milli<Duration.MILLI_VALUES.day*365) maxFormat=1;
	if (span.month<Duration.MONTH_VALUES.month && span.milli<Duration.MILLI_VALUES.day*31) maxFormat=2;
	if (span.milli<Duration.MILLI_VALUES.day) maxFormat=3;
	if (span.milli<Duration.MILLI_VALUES.hour) maxFormat=4;
	if (span.milli<Duration.MILLI_VALUES.minute) maxFormat=5;

	if (maxFormat>=minFormat) maxFormat=Math.max(0, minFormat-1);	//SOME CONTEXT IS GOOD

	//INDEX BY [minFormat][maxFormat]
//	var formats=[
//	["yyyy", "yyyy", "yyyy", "yyyy", "yyyy", "yyyy"],
//	["yyyy", "NNN yyyy", "NNN yyyy", "NNN yyyy", "NNN yyyy", "NNN yyyy"],
//	["yyyy", "NNN yyyy", "dd-NNN-yyyy", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:ss"],
//	["yyyy", "NNN yyyy", "dd-NNN-yyyy", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:ss"],
//	["yyyy", "NNN yyyy", "dd-NNN-yyyy", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:ss"],
//	["yyyy", "NNN yyyy", "dd-NNN-yyyy", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:mm", "yyyy-NNN-dd HH:ss"],
//	];	

	var output="";
	for(var i=maxFormat; i<=minFormat; i++){
		if (i!=maxFormat) output+=Date.getBestFormat.SEPERATOR[i];
		output+=Date.getBestFormat.ORDERED[i];
	}//for
	return output;
};//method
//                               0      1      2     3     4     5
Date.getBestFormat.ORDERED  =["yyyy", "NNN", "dd", "HH", "mm", "ss"];
Date.getBestFormat.SEPERATOR=[    "",   "-",  "-",  " ",  ":",  ":"];



var Duration = function(){
	this.milli = 0;	//INCLUDES THE MONTH VALUE AS MILLISECONDS
	this.month = 0;
};




Duration.MILLI_VALUES = {
	"year":52 * 7 * 24 * 60 * 60 * 1000,		//52weeks
	"quarter":13 * 7 * 24 * 60 * 60 * 1000,	//13weeks
	"month":28 * 24 * 60 * 60 * 1000,		//4weeks
	"week":7 * 24 * 60 * 60 * 1000,
	"day":24 * 60 * 60 * 1000,
	"hour":60 * 60 * 1000,
	"minute":60 * 1000,
	"second":1000
};

Duration.MONTH_VALUES = {
	"year":12,
	"quarter":3,
	"month":1,
	"week":0,
	"day":0,
	"hour":0,
	"minute":0,
	"second":0
};

//A REAL MONTH IS LARGER THAN THE CANONICAL MONTH
Duration.MONTH_SKEW = Duration.MILLI_VALUES["year"] / 12 - Duration.MILLI_VALUES["month"];

////////////////////////////////////////////////////////////////////////////////
// CONVERT SIMPLE <float><type> TO A DURATION OBJECT
////////////////////////////////////////////////////////////////////////////////
Duration.String2Duration = function(text){
	if (text == "" || text=="zero") return new Duration();

	var s = 0;
	while(s < text.length && (text.charAt(s) <= '9' || text.charAt(s) == ".")) s++;

	var output = new Duration();
	var interval = text.rightBut(s);
	var amount = (s == 0 ? 1 : CNV.String2Integer(text.left(s)));

	if (Duration.MILLI_VALUES[interval] === undefined)
		D.error(interval + " is not a recognized duration type (did you use the pural form by mistake?");
	if (Duration.MONTH_VALUES[interval] == 0){
		output.milli = amount * Duration.MILLI_VALUES[interval];
	} else{
		output.milli = amount * Duration.MONTH_VALUES[interval] * Duration.MILLI_VALUES["month"];
		output.month = amount * Duration.MONTH_VALUES[interval];
	}//endif


	return output;
};//method


Duration.parse = function(value){
	var output = new Duration();

	//EXPECTING CONCAT OF <sign><integer><type>
	var plist = value.split("+");
	for(var p = 0; p < plist.length; p++){
		var mlist = plist[p].split("-");
		output = output.add(Duration.String2Duration(mlist[0]));
		for(var m = 1; m < mlist.length; m++){
			output = output.subtract(Duration.String2Duration(mlist[m]));
		}//for
	}//for
	return output;
};//method


Duration.newInstance = function(obj){
	if (obj === undefined) return undefined;
	if (obj == null) return null;
	var output = null;
	if (Math.isNumeric(obj)){
		output = new Duration();
		output.milli = obj;
	} else if (typeof(obj) == "string"){
		return Duration.parse(obj);
	} else if (!(obj.milli === undefined)){
		output = new Duration();
		output.milli = obj.milli;
		output.month = obj.month;
	} else if (isNaN(obj)){
		//return null;
	} else{
		D.error("Do not know type of object (" + CNV.Object2JSON(obj) + ")of to make a Duration");
	}//endif
	return output;
};//method


Duration.prototype.add = function(duration){
	var output = new Duration();
	output.milli = this.milli + duration.milli;
	output.month = this.month + duration.month;
	return output;
};//method


Duration.prototype.multiply=function(amount){
	var output=new Duration();
	output.milli=this.milli*amount;
	output.month=this.month*amount;
	return output;
};//method

Duration.prototype.divideBy=function(amount){
	if (amount.milli===undefined){
		var output=new Duration();
		output.milli=this.milli/amount;
		output.month=this.month/amount;
		return output;
	}else{
		return this.milli/amount.milli;
	}//endif
};//method


Duration.prototype.subtract = function(duration){
	var output = new Duration();
	output.milli = this.milli - duration.milli;
	output.month = this.month - duration.month;
	return output;
};//method

Duration.prototype.floor = function(interval){
	if (interval===undefined || interval.milli === undefined)
		D.error("Expecting an interval as a Duration object");
	var output = new Duration();

	if (interval.month != 0){
		if (this.month!=0){
			output.month = Math.round(this.month/interval.month)*interval.month;
			var rest=(this.milli - (Duration.MILLI_VALUES.month * output.month));
			if (rest>Duration.MILLI_VALUES.day*31){	//WE HOPE THIS BIGGER VALUE WILL STILL CATCH POSSIBLE LOGIC PROBLEMS
				D.error("This duration has more than a month's worth of millis, can not handle this rounding");
			}//endif
			while (rest<0){
				output.month-=interval.month;
				rest=(this.milli - (Duration.MILLI_VALUES.month * output.month));
			}//while
//			if (rest>Duration.MILLI_VALUES["month"]){ //WHEN FLOORING xmonth-1day, THE rest CAN BE 4week+1day, OR MORE.
			output.milli = output.month * Duration.MILLI_VALUES["month"];
			return output;
		}//endif

		//A MONTH OF DURATION IS BIGGER THAN A CANONICAL MONTH
		output.month = Math.floor(this.milli * 12 / Duration.MILLI_VALUES["year"] / interval.month)*interval.month;
		output.milli = output.month * Duration.MILLI_VALUES["month"];
	} else{
		output.milli = Math.floor(this.milli / (interval.milli)) * (interval.milli);
	}//endif
	return output;
};//method


Duration.prototype.toString = function(){
	if (this.milli == 0) return "zero";


	var output = "";
	var rest = (this.milli - (Duration.MILLI_VALUES["month"] * this.month)); //DO NOT INCLUDE THE MONTH'S MILLIS
	var isNegative = (rest < 0);
	rest=Math.abs(rest);

	//MILLI
	var rem = rest % 1000;
	if (rem != 0) output = "+" + rem + "milli" + output;
	rest = Math.floor(rest / 1000);

	//SECOND
	rem = rest % 60;
	if (rem != 0) output = "+" + rem + "second" + output;
	rest = Math.floor(rest / 60);

	//MINUTE
	rem = rest % 60;
	if (rem != 0) output = "+" + rem + "minute" + output;
	rest = Math.floor(rest / 60);

	//HOUR
	rem = rest % 24;
	if (rem != 0) output = "+" + rem + "hour" + output;
	rest = Math.floor(rest / 24);

	//DAY
	if (rest<11){
		rem = rest;
		rest = 0;
	}else{
		rem = rest % 7;
		rest = Math.floor(rest / 7);
	}//endif
	if (rem != 0) output = "+" + rem + "day" + output;


	rem = rest % 7;
	if (rem != 0) output = "+" + rem + "day" + output;
	rest = Math.floor(rest / 7);

	//WEEK
	if (rest != 0) output = "+" + rest + "week" + output;

	if (isNegative) output = output.replace("+", "-");


	//MONTH AND YEAR
	if (this.month != 0){
		var sign=(this.month<0 ? "-" : "+");
		var month=Math.abs(this.month);

		if (month <= 18 && month != 12){
			output = sign + month + "month" + output;
		} else{
			var m = month % 12;
			if (m != 0) output = sign + m + "month" + output;
			var y = Math.floor(month / 12);
			output = sign + y + "year" + output;
		}//endif
	}//endif


	if (output.charAt(0)=="+") output=output.rightBut(1);
	return output;
};//method


Duration.prototype.format=function(interval, rounding){
	if (rounding===undefined) rounding=0;
	var output=this.divideBy(Duration.newInstance(interval));
	output=Math.round(output, rounding);
	return output+interval;
};//method


