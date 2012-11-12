

////////////////////////////////////////////////////////////////////////////////
// REDIRECT alias TO POINT FROM oldIndexName TO newIndexName
////////////////////////////////////////////////////////////////////////////////
ETL.updateAlias=function(alias, oldIndexName, newIndexName, successFunction){
	status.message("Done bulk load, change alias pointer");
	//MAKE ALIAS FROM reviews
	var rename={
		"actions":[
			{"add":{"index":newIndexName, "alias":alias}}
		]
	};
	if (oldIndexName!==undefined){
		rename.actions.push({"remove":{"index":oldIndexName, "alias":alias}});
	}//endif

	ElasticSearch.post(ElasticSearch.baseURL+"/_aliases", rename, successFunction);
};
