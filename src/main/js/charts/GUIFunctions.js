var state = {};
today = new Date();
todayString = convertDateToString(today).slice(0,10);

threeMonths = new Date()
threeMonths.setMonth(threeMonths.getMonth()-3);
threeMonthsString = convertDateToString(threeMonths).slice(0,10);

state["startDate"] = threeMonthsString;
state["endDate"] = todayString;

var UpdateURL = function() {
	jQuery.bbq.pushState( state );
}

var GetURLState = function() {
	var urlState = jQuery.bbq.getState();
	for (var k in urlState)
	{
		state[k] = urlState[k];
	}
};

var UpdateStateElement = function( elementName )
{
	if( state[elementName] != $("#" + elementName).val() )
	{
		state[elementName] = $("#" + elementName).val();
		return true;
	}

	return false;
}

var UpdateState = function()
{			
    if( UpdateStateElement( "startDate" ) || 
    	UpdateStateElement( "endDate" ) )
    	return true;

    return false;
}

var dateField = function(elementName) {
	$( "#"+elementName ).datepicker({ maxDate: "-1D" });
	$( "#"+elementName ).datepicker( "option", "dateFormat", "yy-mm-dd" );
	$( "#"+elementName ).val( state[elementName] );
	
	$( "#"+elementName ).change( function() {
		if( UpdateState() )
		{
			UpdateURL();
		    createChart();
		}
	});
}

$(function() {
	$( "#progressbar" ).progressbar({
		value: 0
	});

	dateField("startDate");
	dateField("endDate");
});

var UpdateTextField = function( elementName )
{
	if( state[elementName] != $("#" + elementName).val() )
	{
		$("#" + elementName).val(state[elementName]);
		return true;
	}

	return false;
}

var UpdateTextFields = function ()
{
    if( UpdateTextField( "startDate" ) || 
    	UpdateTextField( "endDate" ) )
    	return true;

    return false;
}

