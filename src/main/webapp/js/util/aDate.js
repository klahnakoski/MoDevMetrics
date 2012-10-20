// ===================================================================
// Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/
//
// NOTICE: You may use this code for any purpose, commercial or
// private, without any further permission from the author. You may
// remove this notice from your final code if you wish, however it is
// appreciated by the author if at least my web site address is kept.
//
// You may *NOT* re-distribute this code in any way except through its
// use. That means, you can include it in your product, or your web
// site, or any other form where the code is actually being used. You
// may not put the plain javascript up on your site for download or
// include it in your javascript libraries for download.
// If you wish to share this code with others, please just point them
// to the URL instead.
// Please DO NOT link directly to my .js files from your site. Copy
// the files to your server and use them there. Thank you.
// ===================================================================

// HISTORY
// ------------------------------------------------------------------
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but
//                 backwards-compatability was required.

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

	var newDate = new Date(year, month - 1, date, hh, mm, ss);
	//newDate=newDate.addMinutes(new Date().getTimezoneOffset());
	return newDate;
}
;//method






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
function getDateFromFormat(val, format, isPastDate){
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
			for(var i = 0; i < MONTH_NAMES.length; i++){
				var month_name = MONTH_NAMES[i];
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
			for(var i = 0; i < DAY_NAMES.length; i++){
				var day_name = DAY_NAMES[i];
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
}
;//method

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
function parseDate(val){
	val = val.trim();
	var isPastDate = (arguments.length > 1) ? arguments[1] : true;
	var preferEuro = (arguments.length == 3) ? arguments[2] : false;

	generalFormats = new Array('EE MMM d, yyyy', 'EE MMM d, yyyy @ hh:mm a', 'y - M - d', 'MMM d, y', 'MMM d y', 'MMM d', 'y - MMM - d', 'd - MMM - y', 'd MMM y');
	monthFirst = new Array('M / d / y', 'M - d - y', 'M . d . y', 'MMM - d', 'M / d', 'M - d');
	dateFirst = new Array('d / M / y', 'd - M - y', 'd . M . y', 'd - MMM', 'd / M', 'd - M');
	var checkList = new Array('generalFormats', preferEuro ? 'dateFirst' : 'monthFirst', preferEuro ? 'monthFirst' : 'dateFirst');
	var d = null;
	for(var i = 0; i < checkList.length; i++){
		var l = window[checkList[i]];
		for(var j = 0; j < l.length; j++){
			d = getDateFromFormat(val, l[j], isPastDate);
			if (d != 0){
				return new Date(d);
			}
		}
	}
	return null;
}

Date.prototype.format = function(format){
	return formatDate(this, format);
};//method


Date.now = function(){
	var output = new Date();
	return output;//.addMinutes(-output.getTimezoneOffset());
};//method


Date.prototype.getDaysInMonth = function(){
	return new Date(this.getFullYear(), this.getMonth() + 1, 0).getDate();
};//method


Date.prototype.addMonths = function(months){
	var output = new Date(this.getFullYear(), this.getMonth() + months, 1);

	var d = this.getDate();
	if (d <= 28){
		output.setDate(d);
	} else{
		output.setDate(Math.min(this.getDate(), output.getDaysInMonth()));
	}//endif

	output.setMilliseconds(this.getTime() % 24 * 60 * 60 * 1000);

	return output;
};//method

new Date(2011, 0, 1).getDaysInMonth();


Date.prototype.addDays = function(days){
	return new Date(this.getTime() + (days * 24 * 60 * 60 * 1000));
};//method


Date.prototype.addHours = function(hours){
	return new Date(this.getTime() + (hours * 60 * 60 * 1000));
};//method


Date.prototype.addMinutes = function(min){
	return new Date(this.getTime() + (min * 60 * 1000));
};//method


//WE WANT THIS TIME SEEN AS UTC TIME, NOT A LOCAL TIME
Date.prototype.asUTC = function(){
	return Date.UTC(
		this.getFullYear(),
		this.getMonth(),
		this.getDate(),
		this.getHours(),
		this.getMinutes(),
		this.getSeconds()
	);
};//method


//ROUND THE DATE DOWN TO CLOSEST INTERVAL
// Year         | y
// Month        | M
// Day          | d
// Week  		| w
// Hour         | H or h
// Minute       | m
// Second       | s
Date.prototype.floor = function(aggSize){
	var tz = this.getTimezoneOffset();
	var GMT = this.addMinutes(-tz);

	if (aggSize == 'y') GMT = new Date(GMT.getFullYear(), 01, 01);
	else if (aggSize == 'M') GMT = new Date(GMT.getFullYear(), this.getMonth(), 01);
	else if (aggSize.toLowerCase() == 'w'){
		var output = new Date(Math.floor(GMT.getTime() / (24 * 60 * 60 * 1000), 0) * 24 * 60 * 60 * 1000);
		GMT = output.addDays(-output.getDay());
	}//endif
	else if (aggSize == 'd')			   GMT = new Date(Math.floor(GMT.getTime() / (24 * 60 * 60 * 1000), 0) * 24 * 60 * 60 * 1000);
	else if (aggSize.toLowerCase() == 'h') GMT = new Date(Math.floor(GMT.getTime() / (60 * 60 * 1000), 0) * 60 * 60 * 1000);
	else if (aggSize == 'm')			   GMT = new Date(Math.floor(GMT.getTime() / (	  60 * 1000), 0) * 60 * 1000);
	else if (aggSize == 's')			   GMT = new Date(Math.floor(GMT.getTime() / (		 1000), 0) * 1000);
	else return null;

	return GMT.addMinutes(tz);
};//method


var Locale = {
	month_name : {
		'fr' : [ 'Janvier', 'F&#233;vrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'D&#233;cembre' ],
		'en' : [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
		'sp' : [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ],
		'it' : [ 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre' ],
		'de' : [ 'Januar', 'Februar', 'M&#228;rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember' ],
		'pt' : [ 'Janeiro', 'Fevereiro', 'Mar&#231;o', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro' ],
		'hu' : [ 'Janu&#225;r', 'Febru&#225;r', 'M&#225;rcius', '&#193;prilis', 'M&#225;jus', 'J&#250;nius', 'J&#250;lius', 'Augusztus', 'Szeptember', 'Okt&#243;ber', 'November', 'December' ],
		'lt' : [ 'Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegu&#382;&#279;', 'Bir&#382;elis', 'Liepa', 'Rugj&#363;tis', 'Rus&#279;jis', 'Spalis', 'Lapkritis', 'Gruodis' ],
		'nl' : [ 'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december' ],
		'dk' : [ 'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December' ],
		'no' : [ 'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Desember' ],
		'lv' : [ 'Janv&#257;ris', 'Febru&#257;ris', 'Marts', 'Apr&#299;lis', 'Maijs', 'J&#363;nijs', 'J&#363;lijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decemberis' ],
		'ja' : [ '1&#26376;', '2&#26376;', '3&#26376;', '4&#26376;', '5&#26376;', '6&#26376;', '7&#26376;', '8&#26376;', '9&#26376;', '10&#26376;', '11&#26376;', '12&#26376;' ],
		'fi' : [ 'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kes&#228;kuu', 'Hein&#228;kuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu' ],
		'ro' : [ 'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Junie', 'Julie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie' ],
		'zh' : [ '1&#32;&#26376;', '2&#32;&#26376;', '3&#32;&#26376;', '4&#32;&#26376;', '5&#32;&#26376;', '6&#32;&#26376;', '7&#32;&#26376;', '8&#32;&#26376;', '9&#32;&#26376;', '10&#26376;', '11&#26376;', '12&#26376;'],
		'sv' : [ 'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December' ],
		'pl' : [ 'Stycze\u0144', 'Luty', 'Marzec', 'Kwiecie\u0144', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpie\u0144', 'Wrzesie\u0144','Pa\u017adziernik', 'Listopad', 'Grudzie\u0144']
	},

	month_short_name :{


	},

	day_name : {

	},

	day_short_name : {
		'fr'	: [ 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim' ],
		'en'	: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ],
		'sp'	: [ 'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'S&#224;b', 'Dom' ],
		'it'	: [ 'Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom' ],
		'de'	: [ 'Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam', 'Son' ],
		'pt'	: [ 'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S&#225;', 'Dom' ],
		'hu'	: [ 'Vas', 'H&#233;', 'Ke', 'Sze', 'Cs&#252;', 'P&#233;', 'Szo', 'Vas' ],
		'lt'	: [ 'Sek', 'Pir', 'Ant', 'Tre', 'Ket', 'Pen', '&Scaron;e&scaron;', 'Sek' ],
		'nl'	: [ 'zo', 'ma', 'di', 'wo', 'do', 'vr', 'za', 'zo' ],
		'dk'	: [ 'S&#248;n', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'L&#248;r', 'S&#248;n' ],
		'no'	: [ 'Sun', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'L&#248;r', 'Sun' ],
		'lv'	: [ 'Sv', 'P', 'O', 'T', 'C', 'Pk', 'S', 'Sv' ],
		'ja'	: [ '&#26085;', '&#26376;', '&#28779;', '&#27700;', '&#26408;', '&#37329;', '&#22303;', '&#26085;' ],
		'fi'	: [ 'Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su' ],
		'ro'	: [ 'Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam', 'Dum' ],
		'zh'	: [ '&#21608;&#26085;', '&#21608;&#19968;', '&#21608;&#20108;', '&#21608;&#19977;','&#21608;&#22235;', '&#21608;&#20116;', '&#21608;&#20845;','&#21608;&#26085;' ],
		'sv'	: [ 'S&#246;n', 'M&#229;n', 'Tis', 'Ons', 'Tor', 'Fre', 'L&#246;r', 'S&#246;n' ],
		'pl'	: [ 'Nie', 'Pon', 'Wt', '\u015ar', 'Czw', 'Pt', 'Sob', 'Nie']
	},

	word : {
		close : {
			'fr'	: 'fermer',
			'en'	: 'close',
			'sp'	: 'cierre',
			'it'	: 'fine',
			'de'	: 'schliessen',
			'pt'	: 'fim',
			'hu'	: 'bez&#225;r',
			'lt'	: 'u&#382;daryti',
			'nl'	: 'sluiten',
			'dk'	: 'luk',
			'no'	: 'lukk',
			'lv'	: 'aizv&#275;rt',
			'ja'	: '&#38281;&#12376;&#12427;',
			'fi'	: 'sulje',
			'ro'	: 'inchide',
			'zh'	: '&#20851;&#32;&#38381',
			'sv'	: 'st&#228;ng',
			'pl'	: 'zamknij'
		}
	},

	date_format : {
		'en': "dd NNN yyyy",
		'lt': "yyyy-MM-dd",
		'fr': "dd/MM/yyyy",
		'sp': "dd/MM/yyyy",
		'it': "dd/MM/yyyy",
		'de': "dd/MM/yyyy",
		'pt': "dd/MM/yyyy",
		'hu': "dd/MM/yyyy",
		'nl': "dd/MM/yyyy",
		'dk': "dd/MM/yyyy",
		'no': "dd/MM/yyyy",
		'lv': "dd/MM/yyyy",
		'ja': "yyyy-MM-dd",
		'fi': "dd.MM.yyyy",
		'ro': "dd/MM/yyyy",
		'zh': "yyyy-MM-dd",
		'sv': "dd/MM/yyyy",
		'pl': "yyyy-MM-dd"
	}
}


//TRANSPOSE THE OBJECT STRUCTURE SO WE HAVE Locale.<lang>.*
var temp = new Object();
for(var k=0;k<Locale.length;k++){
	if (!isNaN(k)) continue;
	//if (!Locale.hasAttribute(k)) continue;

	//ALL BUT WORD ARE ONE DEEP
	if (k != "word"){
		for(var l=0;l<Locale[k].length;l++){
			if (!isNaN(l)) continue;
			if (Object.isUndefined(temp[l])){
				temp[l] = new Object();
			}//endif
			temp[l][k] = Locale[k][l];
		}//for
	} else{
		for(var w=0;w<Locale[k].length;w++){
			if (!isNaN(w)) continue;

			for(var l=0;l<Locale[k][w].length;l++){
				if (!isNaN(l)) continue;

				if (Object.isUndefined(temp[l])){
					temp[l] = new Object();
				}//endif
				if (Object.isUndefined(temp[l][k])){
					temp[l][k] = new Object();
				}//endif
				if (Object.isUndefined(temp[l][k][w])){
					temp[l][k][w] = new Object();
				}//endif

				temp[l][k][w] = Locale[k][w][l];
			}//for
		}//for
	}//endif
}//for
Locale = temp;


/**
 * DatePicker widget using Prototype and Scriptaculous.
 * (c) 2007-2008 Mathieu Jondet <mathieu@eulerian.com>
 * Eulerian Technologies
 * (c) 2009 Titi Ala'ilima <tigre@pobox.com>
 * (c) 2011 Kyle Lahnakoski <kyle@arcavia.com>
 *
 * DatePicker is freely distributable under the same terms as Prototype.
 *
 * v2.0.0
 */

var DatePicker = Class.create();

DatePicker.prototype = {

	Version	   : '2.0.0',
	_div		  : null,



	//ANY OF THESE MAY BE OVERRODE
	defaults : {
		id	 : null,
		zindex	   : 1,
		keepFieldEmpty: false,
		dateFormat   : null,
		language			: 'en',

		externalControl : null,

		/* date manipulation */
		clickCallback		: Prototype.emptyFunction,
		cellCallback			: Prototype.emptyFunction,
		dateFilter				: function(date){
			return false;
		},
		id_datepicker			: null,

		/* positionning */
		position			: {right: 0},

		/* Effects Adjustment */
		showEffect		   : null, //function(item){Effect.Appear(item, {duration: 0.2});},
		closeEffect		  : null, //function(item){Effect.Fade(item, {duration: 0.2});},
		closeTimer		   : null,
		enableCloseOnBlur	: false,

		/* afterClose : called when the close function is executed */
		afterClose		   : Prototype.emptyFunction
	},

	_currentDate		: null,
	_currentMonth		:null,




	_initCurrentDate : function (){
		if (!this.args.dateFormat) this.args.dateFormat = Locale[this.args.language].date_format;

		/* check if value in field is proper, if not set to today */
		var d = getDateFromFormat($F(this.args.id), this.args.dateFormat, true);
		this._currentDate = d.floor('d');

		//DEFAULT TO TODAY
		if (d == 0){
			d = Date.now().floor('d');
			this._currentDate = d;
			/* set the field value ? */
			if (!this.args.keepFieldEmpty) $(this.args.id).value = d.format(this.args.dateFormat);
		}//endif

		this._currentMonth = d.floor("M");
	},



	/* init */
	initialize : function (args){
		this.args = new Object();
		for(var k=0;k<this.defaults.length;k++){
			if (!isNaN(k)) continue;
			this.args[k] = this.defaults[k];
		}//for

		for(var k=0;k<args.length;k++){
			if (!isNaN(k)) continue;
			this.args[k] = args[k];
		}//for


		this.id_datepicker = 'datepicker-' + this.args.id;
		this._id_datepicker_prev = this.id_datepicker + '-prev';
		this._id_datepicker_next = this.id_datepicker + '-next';
		this._id_datepicker_hdr = this.id_datepicker + '-header';
		this._id_datepicker_ftr = this.id_datepicker + '-footer';

		/* build up calendar skeleton */
		this._div = new Element('div', {
			id : this.id_datepicker,
			className : 'datepicker',
			style : 'display: none; position:absolute; z-index:' + this.args.zindex });
		this._div.innerHTML =
			'<table class="calendar"><thead>' +
				'<tr>' +
				'<th width="10px" id="' + this._id_datepicker_prev + '" style="cursor: pointer;">&nbsp;&lt;&lt;&nbsp;</th>' +
				'<th id="' + this._id_datepicker_hdr + '" colspan="5"></th>' +
				'<th width="10px" id="' + this._id_datepicker_next + '" style="cursor: pointer;">&nbsp;&gt;&gt;&nbsp;</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody id="' + this.id_datepicker + '-tbody">' +
				'</tbody>' +
				'<tfoot>' +
				'<tr><td class="wday"  style="cursor: pointer;" colspan="7" id="' + this._id_datepicker_ftr + '"></td></tr>' +
				'</tfoot>' +
				'</table>';
		/* finally declare the event listener on input field */
		Event.observe(this.args.id, 'click', this.click.bindAsEventListener(this), false);
		/* need to append on body when doc is loaded for IE */
		document.observe('dom:loaded', this.load.bindAsEventListener(this), false);
		/* automatically close when blur event is triggered */
		if (this.args.enableCloseOnBlur){
			Event.observe(this.args.id, 'blur', function (e){
				if (!this.args.closeTimer) this.args.closeTimer = this.close.bind(this).delay(1);
			}.bindAsEventListener(this));
			Event.observe(this._div, 'click', function (e){
				Field.focus(this.args.id);
				this.checkClose.bind(this).delay(0.1);
			}.bindAsEventListener(this));
		}
	},

	/**
	 * load	   : called when document is fully-loaded to append datepicker
	 *			  to main object.
	 */
	load : function (){
		/* if externalControl defined set the observer on it */
		if (this.args.externalControl) Event.observe(this.args.externalControl, 'click', this.click.bindAsEventListener(this), false);


		var body = document.getElementsByTagName("body").item(0);
		if (body){
			this._div.innerHTML = this._wrap_in_iframe(this._div.innerHTML);
			body.appendChild(this._div);
		}//endif

		$(this._id_datepicker_ftr).innerHTML = Locale[this.args.language].word.close;

		/* declare the observers for UI control */
		Event.observe($(this._id_datepicker_prev), 'click', this.prevMonth.bindAsEventListener(this), false);
		Event.observe($(this._id_datepicker_next), 'click', this.nextMonth.bindAsEventListener(this), false);
		Event.observe($(this._id_datepicker_ftr), 'click', this.close.bindAsEventListener(this), false);
		Event.observe($(document), 'click', this.documentClick.bindAsEventListener(this), false);
	},


	//SET THE POSITOIN OF THIS CALENDAR RELATIVE TO GIVEN FORM ELEMENT
	_setPosition : function(formElement){
		var div_d = Element.getDimensions(this._div);
		if (div_d.height == 0) return;

		var form_p = Element.cumulativeOffset(formElement);
		var form_d = Element.getDimensions(formElement);
		//DEFAULT TO CENTER
		var top = form_p.top + ((form_d.height - div_d.height) / 2);
		var left = form_p.left + ((form_d.width - div_d.width) / 2);
		//HORIZONTAL POSITION
		if (!Object.isUndefined(this.args.position["left"])){
			left = form_p.left - Number(this.args.position.left) - div_d.width;
		} else if (!Object.isUndefined(this.args.position["right"])){
			left = form_p.left + form_d.width + Number(this.args.position.right);
		}//endif
		//VERTICAL POSITION
		if (!Object.isUndefined(this.args.position["top"])){
			top = form_p.top - div_d.height - Number(this.args.position.top);
		} else if (!Object.isUndefined(this.args.position["bottom"])){
			top = form_p.top + form_d.height + Number(this.args.position.bottom);
		}//endif

		$(this.id_datepicker).setStyle({ 'top' : top + 'px', 'left' : left + 'px' });
	},

	/* hack for buggy form elements layering in IE */
	_wrap_in_iframe : function (content){
		return	  ( Prototype.Browser.IE ) ?
			"<div style='height:167px;width:185px;background-color:white;align:left'><iframe width='100%' height='100%' marginwidth='0' marginheight='0' frameborder='0' src='about:blank' style='filter:alpha(Opacity=50);'></iframe><div style='position:absolute;background-color:white;top:2px;left:2px;width:180px'>" + content + "</div></div>" : content;
	},


	/**
	 * visible	: return the visibility status of the datepicker.
	 */
	visible	   : function (){
		return	  $(this.id_datepicker).visible();
	},


	/**
	 * click	  : called when input element is clicked
	 */
	click : function(){
		/* init the datepicker if it doesn't exists */
		if ($(this.id_datepicker) == null) this.load();


		if (!this.visible()){
			this._initCurrentDate();
			this._redrawCalendar();
		}//endif

		eval(this.args.clickCallback());

		if (this.args.showEffect != null){
			this.args.showEffect(this.args.id_datepicker);
		} else{
			$(this.id_datepicker).show();
		}//endif

		this._setPosition($(this.args.id));
	},


	/**
	 * close	  : called when the datepicker is closed
	 */
	close : function (){
		// ignore requests to close if already closed:
		if (!this.visible()) return;
		this.checkClose();

		if (this.args.closeEffect != null){
			this.args.closeEffect(this.args.id_datepicker);
		} else{
			$(this.id_datepicker).hide();
		}//endif
		eval(this.afterClose());
	},

	/**
	 * checkClose : called to check whether datepicker is set to close when it's clicked (due to enableCloseOnBlur)
	 * Thanks to firetech87
	 */
	checkClose  : function (){
		if (this.args.closeTimer){
			window.clearTimeout(this.args.closeTimer);
			this.args.closeTimer = null;
		}
	},

	/**
	 * documentClick  : called when user clicked anywhere in the document
	 */
	documentClick : function (event){
		var source = event.element();
		if (source != this._div && source != $(this.args.id) && source != $(this.args.externalControl) && !source.descendantOf(this._div))
			this.close();
	},





	/**
	 * _buildCalendar	 : draw the days array for current date
	 */
	_buildCalendar : function (){
		var tbody = $(this.id_datepicker + '-tbody');

		try{
			while(tbody.hasChildNodes()) tbody.removeChild(tbody.childNodes[0]);
		} catch (e){
		}//try


		/* generate day headers */
		var trDay = new Element('tr');
		for(var j = 0; j < 7; j++){
			var item = Locale[this.args.language].day_short_name[j];
			var td = new Element('td');
			td.innerHTML = item;
			td.className = 'wday';
			trDay.appendChild(td);
		}
		;
		tbody.appendChild(trDay);


		var today = Date.now().floor('d');
		var currentMonth = this._currentMonth.getMonth();

		/* GENERATE DATE CELLS*/
		/* GET FIRST DATE IN THE CALENDAR, WITH AT LEAST 1 DAY OF PREVIOUS MONTH SHOWING */
		var firstDate = this._currentMonth.addDays(-1).floor('w');
		for(var i = 0; i < 6; i++){
			var tr = new Element('tr');
			for(var j = 0; j < 7; j++){
				var d = firstDate.addDays(i * 7 + j);
				var td = new Element('td');
				td.setAttribute('title', d.format("yyyy-MM-dd"));

				//CLASSNAME
				if (d.getMonth() != currentMonth || this.args.dateFilter(d))
					td.className = 'outbound';
				if (d - today == 0)
					td.className = 'today';
				if (d - this._currentDate == 0)
					td.className = 'selected';

				this._bindCellOnClick(td, d.getMonth() != currentMonth || this.args.dateFilter(d));
				td.innerHTML = d.getDate();
				tr.appendChild(td);
			}//for
			tbody.appendChild(tr);
		}//for
		return tbody;
	},

	/**
	 * _bindCellOnClick   : bind the cell onclick depending on status.
	 */
	_bindCellOnClick	  : function (td, badDateP){
		if (!badDateP){
			/* Create a closure so we have access to the DatePicker object */
			var _self = this;
			td.onclick = function (){
				var title = $(this).readAttribute("title");
				var d = getDateFromFormat(title, "yyyy-MM-dd", true);
				$(_self.args.id).value = d.format(_self.args.dateFormat);

				/* if we have a cellCallback defined call it and pass it the cell */
				if (_self.cellCallback) _self.cellCallback(this);
				_self.close();
			};
		}//endif
	},




	nextMonth : function (){
		this._currentMonth = this._currentMonth.addMonths(1);
		this._redrawCalendar();
	},


	prevMonth : function (){
		this._currentMonth = this._currentMonth.addMonths(-1);
		this._redrawCalendar();
	},

	_redrawCalendar : function (){
		this._setLocaleHdr();
		this._buildCalendar();
	},

	_setLocaleHdr : function (){
		/* next link */
		$(this._id_datepicker_next).setAttribute('title', this._currentMonth.addMonths(1).format("NNN dd"));
		/* prev link */
		$(this._id_datepicker_prev).setAttribute('title', this._currentMonth.addMonths(-1).format("NNN dd"));
		/* header */
		$(this._id_datepicker_hdr).update('&nbsp;&nbsp;&nbsp;' + Locale[this.args.language].month_name[this._currentMonth.getMonth()] + '&nbsp;' + this._currentMonth.getFullYear() + '&nbsp;&nbsp;&nbsp;');
	}
};


var DateInputSetup = function(){
	$$('input.date').each(function(item){
		try{
			var id = item.getAttribute("id");
			if (id == null) alert("All input.date tags must have a unique id");

			new DatePicker({
				id : id
			});
		} catch(e){
			alert("All input.date tags must have a unique id");
		}//try
	});
};//method


if (window.onload){
	var curronload = window.onload;
	var newonload = function(){
		curronload();
		DateInputSetup();
	};
	window.onload = newonload;
} else{
	window.onload = DateInputSetup;
}//endif
