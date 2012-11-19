
importScript("../trampoline.js");


var Rest={};

Rest.send=function(ajaxParam){
	if (ajaxParam.query!==undefined) D.error("Do not set the query parameter, use 'data'");
	if (ajaxParam.success!==undefined) D.error("This function will return data, it does not accept the success function");

	var callback=yield (aThread.Resume);	//RESUME THREAD ON RETURN

	//FILL IN THE OPTIONAL VALUES
	if (ajaxParam.type===undefined) ajaxParam.type="post";
	if (ajaxParam.dataType===undefined) ajaxParam.dataType="json";
	if (ajaxParam.error===undefined){
		ajaxParam.error=function(errorData, errorMsg, errorThrown){
			callback(new Exception(errorMsg, errorData));
		};
	}//endif
	if (typeof(ajaxParam.data)!="string") ajaxParam.data=JSON.stringify(ajaxParam.data);
	ajaxParam.success=callback;

	var request=$.ajax(ajaxParam);
	request.kill=function(){request.abort();};
	yield( new aThread.Suspend(request));
};//method


Rest.get=function(ajaxParam){
	ajaxParam.type="GET";
	return Rest.send(ajaxParam);
};

Rest.post=function(ajaxParam){
	ajaxParam.type="POST";
	return Rest.send(ajaxParam);
};//method

Rest["delete"]=function(ajaxParam){
	D.warning("DISABLED DELETE OF "+ajaxParam.url);
	yield (null);
//	ajaxParam.type="DELETE";
//	return Rest.send(ajaxParam);
};//method