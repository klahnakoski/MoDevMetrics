FilterManager = function( htmlID ) {

	this.htmlID = htmlID;
	this.filters = [];
	this.isLoaded = false;
	this.isUIBuilt = false;
	
}

FilterManager.prototype.AddFilter = function( filterObj ) {
	var isValid = FilterManager.ValidateFilter( filterObj );
	
	if( isValid )
	{
		this.isLoaded = false;
		length = this.filters.length;
		this.filters[ length ] = filterObj;
		filterObj.manager = this;
	}
	
	return false;
}

FilterManager.prototype.FetchFilters = function()
{
	var stillLoading = false;
	
	for(var i=0; i<this.filters.length; i++)
	{
		if( !this.filters[i].isLoaded )
		{
			stillLoading = true;
			if( this.DependanciesReady(i))
			{
				this.filters[i].FetchList();
			}
		}
	}
	
	if( !stillLoading )
	{
		this.isLoaded = true;
		this.BuildUI();
	}
}

FilterManager.prototype.DependanciesReady = function( index )
{
	var deps = this.filters[index].dependancies;
	
	if( deps.length == 0)
		return true;

	for(var i = 0; i < this.filters.length; i++){
		for(var x = 0; x < deps.length; x++){
			if (this.filters[i].name == deps[x]){
				if (!this.filters[i].isLoaded)
					return false;
			}
		}
	}
	
	return true;		
}

FilterManager.prototype.BuildUI = function() {	
	if( !document.getElementById( this.htmlID ))
	{
		console.error("FilterManager.BuildUI can't find a DOM element with the name " + this.htmlID );
		return false;
	}
	
	if( !this.isLoaded )
	{
		this.FetchFilters();
		return;
	}
		
	if( !this.isUIBuilt )
	{
		var html = "";
	
		html += '<h3><a href="#">Summary</a></h3>';
		html += '<div id="filterSummary"></div>';
	
		for(var i=0; i<this.filters.length; i++)
		{
			html += '<h3><a href="#">'+ this.filters[i].displayName +'</a></h3>';
			html += '<div id="'+ this.filters[i].name +'"></div>';
		}
			
			
	    $( "#" + this.htmlID ).html(html);
	
	    $( "#" + this.htmlID ).accordion({
			autoHeight: false,
			navigation: true
		});
	
		if( this.filters.length == 0 )
			 $("#filterSummary").html("No filters registered.");
	}

	this.isUIBuilt = true;
	
	for(var i=0; i<this.filters.length; i++)
	{
		this.filters[i].BuildUI();
	}
	
	return true;
}

FilterManager.prototype.OnChange = function ( filter ) {
	
	UpdateURL();
	this.UpdateDepedancies(filter);
	//UpdateSummary();
	createChart();
}

FilterManager.prototype.UpdateDepedancies = function( filter ) {

	for(var i=0; i<this.filters.length; i++)
	{
		for( var x=0; x<this.filters[i].dependancies.length; x++)
		{
			if( filter.name == this.filters[i].dependancies[x] )
			{
				this.filters[i].isLoaded = false;
				this.filters[i].isUIBuilt = false;
			}
		}
	}
	
	this.FetchFilters();
}

FilterManager.prototype.InjectFiltersIntoRequests = function( requestObj ) 
{
	for(var i=0;i<this.filters.length;i++)
	{
		for(var x=0;x<requestObj.length;x++)			
			this.filters[i].InjectFilters( requestObj[x].query )
	}
}

FilterManager.ValidateFilter = function( filterObj ) {
	if( typeof filterObj == 'undefined')
	{
		console.error("FilterManager.AddFilter has been passed a filter that is not valid.  Type is undefined.");
		return false;	
	}
	
	if( filterObj == undefined)
	{
		console.error("FilterManager.AddFilter has been passed a filter that is not valid.  Object is undefined.");
		return false;	
	}
	
	return true;
}