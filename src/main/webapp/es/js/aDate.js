/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("util.js");


Date.now = function(){
	return new Date();
};//method

Date.eod=function(){
	return new Date().ceilingDay();
};//method

Date.today=function(){
	return new Date().floorDay();
};//method



Date.newInstance = function(value){
	if (value === undefined || value == null) return null;
	if (typeof(value)=="string") return Date.tryParse(value);
	return new Date(value);
};//method



Date.prototype.getMilli = Date.prototype.getTime;




Date.prototype.add = function(interval){
	if (interval===undefined || interval==null){
		D.error("expecting an interval to add");
	}//endif

	var i = Duration.newInstance(interval);

	var addMilli = i.milli - (Duration.MILLI_VALUES.month * i.month);
	return this.addMonth(i.month).addMilli(addMilli);
};//method



Date.prototype.subtract=function(time, interval){
	if (typeof(time)=="string") D.error("expecting to subtract a Duration or Date object, not a string");

	if (interval===undefined || interval.month==0){
		if (time.getMilli){
			//SUBTRACT TIME
			return Duration.newInstance(this.getMilli()-time.getMilli());
		}else{
			//SUBTRACT DURATION
			var residue = time.milli - (Duration.MILLI_VALUES.month * time.month);
			return this.addMonth(-time.month).addMilli(-residue);
		}//endif
	}else{
		if (time.getMilli){
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
	while (test.getMilli()>endTime.getMilli()){
		numMonths--;
		test= startTime.addMonth(numMonths);
	}//while


	////////////////////////////////////////////////////////////////////////////
	// TEST
	var testMonth=0;
	while(startTime.addMonth(testMonth).getMilli()<=endTime.getMilli()){
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
//	if (output.milli>=Duration.MILLI_VALUES.day*31)
//		D.error("problem");
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
	if (value==0) return this;	//WHOA! SETTING MONTH IS CRAZY EXPENSIVE!!
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
	output.setUTCDate(this.getUTCDate() - this.getUTCDay());
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


Date.prototype.ceilingWeek = function(){
	return this.floorWeek().addWeek(1);
};//method


Date.prototype.ceilingMonth = function(){
	return this.floorMonth().addMonth(1);
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
	var minFormat=0; //SECONDS
	if (interval.milli>=Duration.MILLI_VALUES.minute) minFormat=1;
	if (interval.milli>=Duration.MILLI_VALUES.hour) minFormat=2;
	if (interval.milli>=Duration.MILLI_VALUES.day) minFormat=3;
	if (interval.milli>=Duration.MILLI_VALUES.month) minFormat=4;
	if (interval.month>=Duration.MONTH_VALUES.month) minFormat=4;
	if (interval.month>=Duration.MONTH_VALUES.year) minFormat=5;

	var maxFormat=5;//year
	var span=maxDate.subtract(minDate, interval);
	if (span.month<Duration.MONTH_VALUES.year && span.milli<Duration.MILLI_VALUES.day*365) maxFormat=4; //month
	if (span.month<Duration.MONTH_VALUES.month && span.milli<Duration.MILLI_VALUES.day*31) maxFormat=3; //day
	if (span.milli<Duration.MILLI_VALUES.day) maxFormat=2;
	if (span.milli<Duration.MILLI_VALUES.hour) maxFormat=1;
	if (span.milli<Duration.MILLI_VALUES.minute) maxFormat=0;

	if (maxFormat<=minFormat) maxFormat=minFormat;

	//INDEX BY [minFormat][maxFormat]
	return [
	["ss.000", "mm:ss", "HH:mm:ss", "NNN dd, HH:mm:ss", "NNN dd, HH:mm:ss", "dd-NNN-yyyy HH:mm:ss"],
	[      "", "HH:mm", "HH:mm"   ,   "E dd, HH:mm"   , "NNN dd, HH:mm"   , "dd-NNN-yyyy HH:mm"   ],
	[      "",      "", "HH:mm"   ,   "E dd, HH:mm"   , "NNN dd, HH:mm"   , "dd-NNN-yyyy HH:mm"   ],
	[      "",      "",         "",   "E dd"          , "NNN dd"          , "dd-NNN-yyyy"         ],
	[      "",      "",         "", ""                , "NNN"             ,    "NNN yyyy"         ],
	[      "",      "",         "", ""                , ""                ,        "yyyy"         ]
	][minFormat][maxFormat];
};//method


// ------------------------------------------------------------------
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
function _isInteger(val){
	var digits = "1234567890";
	for(var i = 0; i < val.length; i++){
		if (digits.indexOf(val.charAt(i)) == -1){
			return false;
		}
	}
	return true;
}
function _getInt(str, i, minlength, maxlength){
	for(var x = maxlength; x >= minlength; x--){
		var token = str.substring(i, i + x);
		if (token.length < minlength){
			return null;
		}
		if (_isInteger(token)){
			return token;
		}
	}
	return null;
}


function internalChecks(year, month, date, hh, mm, ss, ampm){
	// Is date valid for month?
	if (month == 2){
		//LEAP YEAR
		if (((year % 4 == 0) && (year % 100 != 0) ) || (year % 400 == 0)){
			if (date > 29) return 0;
		} else{
			if (date > 28) return 0;
		}//endif
	}//endif
	if ((month == 4) || (month == 6) || (month == 9) || (month == 11)){
		if (date > 30) return 0;
	}//endif

	// Correct hours value
	if (hh < 12 && ampm == "PM"){
		hh = hh - 0 + 12;
	} else if (hh > 11 && ampm == "AM"){
		hh -= 12;
	}//endif

	var newDate = new Date(Date.UTC(year, month - 1, date, hh, mm, ss));
	//newDate=newDate.addMinutes(new Date().getTimezoneOffset());
	return newDate;
}//method






// ------------------------------------------------------------------
// getDateFromFormat( date_string , format_string, isPastDate )
//
// This function takes a date string and a format string. It matches
// If the date string matches the format string, it returns the
// getTime() of the date. If it does not match, it returns 0.
// isPastDate ALLOWS DATES WITHOUT YEAR TO GUESS THE RIGHT YEAR
// THE DATE IS EITHER EXPECTED TO BE IN THE PAST (true) WHEN FILLING
// OUT A TIMESHEET (FOR EXAMPLE) OR IN THE FUTURE (false) WHEN
// SETTING AN APPOINTMENT DATE
// ------------------------------------------------------------------
Date.getDateFromFormat=function(val, format, isPastDate){
	val = val + "";
	format = format + "";
	var valueIndex = 0;
	var formatIndex = 0;
	var token = "";
	var token2 = "";
	var x, y;
	var now = new Date();

	//DATE BUILDING VARIABLES
	var year = null;
	var month = now.getMonth() + 1;
	var dayOfMonth = 1;
	var hh = 0;
	var mm = 0;
	var ss = 0;
	var ampm = "";

	while(formatIndex < format.length){
		// Get next token from format string
		token = "";
		var c = format.charAt(formatIndex);
		while((format.charAt(formatIndex) == c) && (formatIndex < format.length)){
			token += format.charAt(formatIndex++);
		}//while

		// Extract contents of value based on format token
		if (token == "yyyy" || token == "yy" || token == "y"){
			if (token == "yyyy"){
				x = 4;
				y = 4;
			}
			if (token == "yy"){
				x = 2;
				y = 2;
			}
			if (token == "y"){
				x = 2;
				y = 4;
			}
			year = _getInt(val, valueIndex, x, y);
			if (year == null) return 0;
			valueIndex += year.length;
			if (year.length == 2){
				if (year > 70){
					year = 1900 + (year - 0);
				} else{
					year = 2000 + (year - 0);
				}
			}

		} else if (token == "MMM" || token == "NNN"){
			month = 0;
			for(var i = 0; i < Date.MONTH_NAMES.length; i++){
				var month_name = Date.MONTH_NAMES[i];
				var prefixLength = 0;
				while(val.charAt(valueIndex + prefixLength).toLowerCase() == month_name.charAt(prefixLength).toLowerCase()){
					prefixLength++;
				}//while
				if (prefixLength >= 3){
					if (token == "MMM" || (token == "NNN" && i > 11)){
						month = i + 1;
						if (month > 12){
							month -= 12;
						}
						valueIndex += prefixLength;
						break;
					}
				}
			}
			if ((month < 1) || (month > 12)){
				return 0;
			}

		} else if (token == "EE" || token == "E"){
			for(var i = 0; i < Date.DAY_NAMES.length; i++){
				var day_name = Date.DAY_NAMES[i];
				if (val.substring(valueIndex, valueIndex + day_name.length).toLowerCase() == day_name.toLowerCase()){
					valueIndex += day_name.length;
					break;
				}
			}

		} else if (token == "MM" || token == "M"){
			month = _getInt(val, valueIndex, token.length, 2);
			if (month == null || (month < 1) || (month > 12)){
				return 0;
			}
			valueIndex += month.length;
		} else if (token == "dd" || token == "d"){
			dayOfMonth = _getInt(val, valueIndex, token.length, 2);
			if (dayOfMonth == null || (dayOfMonth < 1) || (dayOfMonth > 31)){
				return 0;
			}
			valueIndex += dayOfMonth.length;
		} else if (token == "hh" || token == "h"){
			hh = _getInt(val, valueIndex, token.length, 2);
			if (hh == null || (hh < 1) || (hh > 12)){
				return 0;
			}
			valueIndex += hh.length;
		} else if (token == "HH" || token == "H"){
			hh = _getInt(val, valueIndex, token.length, 2);
			if (hh == null || (hh < 0) || (hh > 23)){
				return 0;
			}
			valueIndex += hh.length;
		} else if (token == "KK" || token == "K"){
			hh = _getInt(val, valueIndex, token.length, 2);
			if (hh == null || (hh < 0) || (hh > 11)){
				return 0;
			}
			valueIndex += hh.length;
		} else if (token == "kk" || token == "k"){
			hh = _getInt(val, valueIndex, token.length, 2);
			if (hh == null || (hh < 1) || (hh > 24)){
				return 0;
			}
			valueIndex += hh.length;
			hh--;
		} else if (token == "mm" || token == "m"){
			mm = _getInt(val, valueIndex, token.length, 2);
			if (mm == null || (mm < 0) || (mm > 59)){
				return 0;
			}
			valueIndex += mm.length;
		} else if (token == "ss" || token == "s"){
			ss = _getInt(val, valueIndex, token.length, 2);
			if (ss == null || (ss < 0) || (ss > 59)){
				return 0;
			}
			valueIndex += ss.length;
		} else if (token == "a"){
			if (val.substring(valueIndex, valueIndex + 2).toLowerCase() == "am"){
				ampm = "AM";
			} else if (val.substring(valueIndex, valueIndex + 2).toLowerCase() == "pm"){
				ampm = "PM";
			} else{
				return 0;
			}
			valueIndex += 2;
		} else if (token.trim() == ""){
			while(val.charCodeAt(valueIndex) <= 32) valueIndex++;
		} else{
			if (val.substring(valueIndex, valueIndex + token.length) != token){
				return 0;
			} else{
				valueIndex += token.length;
			}
		}//endif
	}
	// If there are any trailing characters left in the value, it doesn't match
	if (valueIndex != val.length) return 0;

	if (year == null){
		//WE HAVE TO GUESS THE YEAR
		year = now.getFullYear();
		var oldDate = (now.getTime()) - 86400000;
		var newDate = internalChecks(year, month, dayOfMonth, hh, mm, ss, ampm);
		if (isPastDate){
			if (newDate != 0 && (newDate + "") < (oldDate + "")) return newDate;
			return internalChecks(year - 1, month, dayOfMonth, hh, mm, ss, ampm);
		} else{
			if (newDate != 0 && (newDate + "") > (oldDate + "")) return newDate;
			return internalChecks(year + 1, month, dayOfMonth, hh, mm, ss, ampm);
		}//endif
	}//endif

	return internalChecks(year, month, dayOfMonth, hh, mm, ss, ampm);
};//method

// ------------------------------------------------------------------
// parseDate( date_string [,isPastDate] [, prefer_euro_format] )
//
// This function takes a date string and tries to match it to a
// number of possible date formats to get the value. It will try to
// match against the following international formats, in this order:
// y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
// M/d/y   M-d-y      M.d.y     MMM-d     M/d      M-d
// d/M/y   d-M-y      d.M.y     d-MMM     d/M      d-M
// A second argument may be passed to instruct the method to search
// for formats like d/M/y (european format) before M/d/y (American).
// Returns a Date object or null if no patterns match.
// ------------------------------------------------------------------
{
	var generalFormats = ['EE MMM d, yyyy', 'EE MMM d, yyyy @ hh:mm a', 'y - M - d', 'MMM d, y', 'MMM d y', 'MMM d', 'y - MMM - d', 'd - MMM - y', 'd MMM y'];
	var monthFirst = ['M / d / y', 'M - d - y', 'M . d . y', 'MMM - d', 'M / d', 'M - d'];
	var dateFirst = ['d / M / y', 'd - M - y', 'd . M . y', 'd - MMM', 'd / M', 'd - M'];

	Date.CheckList = [].appendArray(generalFormats).appendArray(dateFirst).appendArray(monthFirst);
}



Date.tryParse=function(val, isFutureDate){
	val = val.trim();

	var d = null;
	for(var i = 0; i < Date.CheckList.length; i++){
		d = Date.getDateFromFormat(val, Date.CheckList[i], !Util.coalesce(isFutureDate, false));
		if (d != 0){
			var temp=Date.CheckList[i];
			Date.CheckList.splice(i, 1);
			Date.CheckList.prepend(temp);
			return d;
		}//endif
	}//for
	return null;
};//method


Date.max=function(a, b){
	if (a.getMilli()<b.getMilli()) return b;
	return a;
};













var Duration = function(){
	this.milli = 0;	//INCLUDES THE MONTH VALUE AS MILLISECONDS
	this.month = 0;
};


Duration.DOMAIN={
	"type":"duration",
	"compare":function(a, b){
		return a.milli-b.milli;
	}

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
Duration.MONTH_SKEW = Duration.MILLI_VALUES["year"] / 12 - Duration.MILLI_VALUES.month;

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
		output.milli = amount * Duration.MONTH_VALUES[interval] * Duration.MILLI_VALUES.month;
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
//	if (output.milli==Duration.MILLI_VALUES.day*31)
//		D.error("problem");
	output.month=this.month*amount;
	return output;
};//method

Duration.prototype.divideBy=function(amount){
	if (amount.month!==undefined && amount.month!=0){
		var m=this.month;
		var r=this.milli;

		//DO NOT CONSIDER TIME OF DAY
		var tod=r%Duration.MILLI_VALUES.day;
		r=r-tod;

		if (m==0 && r>(Duration.MILLI_VALUES.year/3)){
			m=Math.floor(12 * this.milli / Duration.MILLI_VALUES.year);
			r-=(m/12)*Duration.MILLI_VALUES.year;
		}else{
			r=(r-(this.month*Duration.MILLI_VALUES.month));
			if (r>=Duration.MILLI_VALUES.day*31)
				D.error("Do not know how to handle");
		}//endif
		r=Math.min(29/30, (r+tod)/(Duration.MILLI_VALUES.day*30));


		var output=(m/amount.month)+r;
		return output
	}else if (amount.milli===undefined){
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
			output.month = Math.floor(this.month/interval.month)*interval.month;
//			var rest=(this.milli - (Duration.MILLI_VALUES.month * output.month));
//			if (rest>Duration.MILLI_VALUES.day*31){	//WE HOPE THIS BIGGER VALUE WILL STILL CATCH POSSIBLE LOGIC PROBLEMS
//				D.error("This duration has more than a month's worth of millis, can not handle this rounding");
//			}//endif
//			while (rest<0){
//				output.month-=interval.month;
//				rest=(this.milli - (Duration.MILLI_VALUES.month * output.month));
//			}//while
////			if (rest>Duration.MILLI_VALUES.month){ //WHEN FLOORING xmonth-1day, THE rest CAN BE 4week+1day, OR MORE.
			output.milli = output.month * Duration.MILLI_VALUES.month;
			return output;
		}//endif

		//A MONTH OF DURATION IS BIGGER THAN A CANONICAL MONTH
		output.month = Math.floor(this.milli * 12 / Duration.MILLI_VALUES["year"] / interval.month)*interval.month;
		output.milli = output.month * Duration.MILLI_VALUES.month;
	} else{
		output.milli = Math.floor(this.milli / (interval.milli)) * (interval.milli);
	}//endif
	return output;
};//method


Duration.prototype.toString = function(){
	if (this.milli == 0) return "zero";


	var output = "";
	var rest = (this.milli - (Duration.MILLI_VALUES.month * this.month)); //DO NOT INCLUDE THE MONTH'S MILLIS
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
	if (rest<11 && rest!=7){
		rem = rest;
		rest = 0;
	}else{
		rem = rest % 7;
		rest = Math.floor(rest / 7);
	}//endif
	if (rem != 0) output = "+" + rem + "day" + output;

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

Duration.ZERO=Duration.newInstance(0);
Duration.SECOND=Duration.newInstance("second");
Duration.MINUTE=Duration.newInstance("minute");
Duration.HOUR=Duration.newInstance("hour");
Duration.DAY=Duration.newInstance("day");
Duration.WEEK=Duration.newInstance("week");
Duration.MONTH=Duration.newInstance("month");
Duration.QUARTER=Duration.newInstance("quarter");
Duration.YEAR=Duration.newInstance("year");
