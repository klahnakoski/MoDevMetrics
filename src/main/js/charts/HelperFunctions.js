/**
 * 
 */

///
/// EXPECTING AN OBJECT WITH KEY VALUE PAIRS
String.prototype.replaceAll=function(values){
    var output=clone(this);

    while(true){
        var s=output.indexOf('{');
        if (s<0) return output;
        var e=output.indexOf('}', s);
        if (e<0) return output;
        var key=output.substring(s+1, e);
        if (output.substring(s+1, e) in values){
            output=output.replace(output.substring(s, e+1), values[key]);
        }//endif
    }//while
}//method


function convertDateToString( date ) 
{
	var dateString = date.getUTCFullYear();

	dateString += "-";
	dateString += addLeadingZero(date.getUTCMonth() + 1);
	dateString += "-"
	dateString += addLeadingZero(date.getUTCDate());
	dateString += "T";
	dateString += addLeadingZero(date.getUTCHours());
	dateString += ":";
	dateString += addLeadingZero(date.getUTCMinutes());
	dateString += ":";
	dateString += addLeadingZero(date.getUTCSeconds());
	dateString += ".000Z";
	
	return dateString;
};

function insureMustAndMustNot( queryObj )
{	
	if( !("query" in queryObj.query) )
		queryObj.query = {};

	if( !("filtered" in queryObj.query))
		queryObj.query.filtered = {};
	
	if( !("query" in queryObj.query.filtered) )
		queryObj.query.filtered.query = {};
	
	if( !("bool" in queryObj.query.filtered.query) )
		queryObj.query.filtered.query.bool = {};
	
	if( !("must" in queryObj.query.filtered.query.bool) )
		queryObj.query.filtered.query.bool.must = [];
	
	if( !("must_not" in queryObj.query.filtered.query.bool) )
		queryObj.query.filtered.query.bool.must_not = [];
}

function insureShould( queryObj )
{	
	if( !("query" in queryObj) )
		queryObj.query = {};

	if( !("filtered" in queryObj.query))
		queryObj.query.filtered = {};

	if( !("query" in queryObj.query.filtered) )
		queryObj.query.filtered.query = {};
	
	if( !("bool" in queryObj.query.filtered.query) )
		queryObj.query.filtered.query.bool = {};
	
	if( !("should" in queryObj.query.filtered.query.bool) )
		queryObj.query.filtered.query.bool.should = [];
	
	if( !("minimum_number_should_match" in queryObj.query.filtered.query.bool) )
		queryObj.query.filtered.query.bool.minimum_number_should_match = 1;
	
}

function insureFilterAnd( query )
{
		if ("query" in query){
            if ("filtered" in query.query){
                //ALREADY ENCAPSULATED, DO NOTHING
            }else{
                var newQuery={};
                newQuery.filtered={};
                newQuery.filtered.query=query.query;
                newQuery.filtered.filter=query.filter;

                query.query=newQuery;
            }//endif
        }else{
            throw D.error("Expecting a query in request");
        }//endif

		if( !("filter" in query.query.filtered) )
			query.query.filtered.filter = {};

		var temp = null;
		
		if( !jQuery.isEmptyObject( query.query.filtered.filter ) )
		{
			if( !("and" in query.query.filtered.filter) )
			{			
				temp = clone(query.query.filtered.filter);
				query.query.filtered.filter = {};
				query.query.filtered.filter.and = [];
			}
		} 
		else 
		{
			query.query.filtered.filter.and = [];
		}
		
		if( temp != null)
			query.query.filtered.filter.and.push(temp);
}

function insertDateIntoQuery( query, dateString )
{
	insureFilterAnd( query );
		
	query.query.filtered.filter.and.push({ "range" : { "modified_ts" : { "lt" : dateString } } });
	query.query.filtered.filter.and.push({ "not" : { "range" : { "expires_on" : { "lt" : dateString } } } });
};

function getTomorrowsUTC()
{
	var currentDate = new Date();
	var d = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth()+1, currentDate.getUTCDay()) + 24*60*60*1000;

	return d;
}

function insertIndexIntoQuery( queryObj, iterateField, index )
{
	insureMustAndMustNot( queryObj );
	
	var term = {};
	term['term'] = {}
	term['term'][iterateField] = index;
	
	queryObj.query.filtered.query.bool.must.push( term );
};

function convertStringToDate( dateString )
{
	var date = new Date();

	date.setUTCFullYear(dateString.slice(0,4));
	date.setUTCMonth(dateString.slice(5,7) - 1);
	date.setUTCDate(dateString.slice(8,10));
	date.setUTCHours(dateString.slice(11,13));
	date.setUTCMinutes(dateString.slice(14,16));
	date.setUTCSeconds(dateString.slice(17,19));
	return date;
};

function addLeadingZero(number) 
{
	var numberString = "" + number;
	if( number < 10 )
		numberString = "0" + number;
	
	return numberString;		
};

function getNumberOfDays(startDate, endDate) {
	var difference = endDate - startDate;
	return Math.floor(difference / (1000*60*60*24));
};

function clone( obj ) {	
	return JSON.parse(JSON.stringify(obj));;
};

function include(arr, obj) {
    for(var i=0; i<arr.length; i++) {
        if (arr[i] == obj) return true;
    }
}

var isEven = function(someNumber){
	return (someNumber%2 == 0) ? true : false;
};

/*Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
};

Function.method('swiss', function (parent) {
    for (var i = 1; i < arguments.length; i += 1) {
        var name = arguments[i];
        this.prototype[name] = parent.prototype[name];
    }
    return this;
});

Function.method('inherits', function (parent) {
    var d = {}, p = (this.prototype = new parent());
    this.method('uber', function uber(name) {
        if (!(name in d)) {
            d[name] = 0;
        }        
        var f, r, t = d[name], v = parent.prototype;
        if (t) {
            while (t) {
                v = v.constructor.prototype;
                t -= 1;
            }
            f = v[name];
        } else {
            f = p[name];
            if (f == this[name]) {
                f = v[name];
            }
        }
        d[name] += 1;
        r = f.apply(this, Array.prototype.slice.apply(arguments, [1]));
        d[name] -= 1;
        return r;
    });
    return this;
});*/
