
import("../trampoline.js");


var Rest={};


Rest.send=function(ajaxParam){
	if (ajaxParam.success!==undefined) D.error("This function will return data, it does not accept the success function");

	//FILL IN THE OPTIONAL VALUES
	if (ajaxParam.type===undefined) ajaxParam.type="post";
	if (ajaxParam.dataType===undefined) ajaxParam.dataType="json";
	if (ajaxParam.error===undefined){
		ajaxParam.error=function(errorData, errorMsg, errorThrown){
			D.error(errorMsg, errorThrown);
		};
	}//endif
	if (typeof(ajaxParam.data)!="string") ajaxParam.data=JSON.stringify(ajaxParam.data);
	ajaxParam=(yield aThread.Continuation);

	$.ajax(ajaxParam);
	yield aThread.Suspend;
};//method


Rest.get=function(ajaxParam){
	ajaxParam.type="GET";
	yield Rest.send(ajaxParam);
};

Rest.post=function(ajaxParam){
	ajaxParam.type="POST";
	yield Rest.send(ajaxParam);
};//method