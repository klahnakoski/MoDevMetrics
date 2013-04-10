/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../aThread.js");


var Rest={};

Rest.addProgressListener=function(callback){
	if (Rest.progressListener){
		//CHAIN LISTENERS
		Rest.progressListener=function(progress){
			callback(progress);
			Rest.progressListener(progress);
		};//method
	}else{
		Rest.progressListener=callback;
	}//endif
};


Rest.send=function(ajaxParam){
	if (ajaxParam.query!==undefined) D.error("Do not set the query parameter, use 'data'");
	if (ajaxParam.success!==undefined) D.error("This function will return data, it does not accept the success function");

	var callback=yield (aThread.Resume);	//RESUME THREAD ON RETURN

	//FILL IN THE OPTIONAL VALUES
	if (ajaxParam.type===undefined) ajaxParam.type="POST";
	ajaxParam.type=ajaxParam.type.toUpperCase();
	if (ajaxParam.dataType===undefined) ajaxParam.dataType="json";
	if (ajaxParam.error===undefined){
		ajaxParam.error=function(errorData){
			callback(new Exception(errorData));
		};
	}//endif
	if (typeof(ajaxParam.data)!="string") ajaxParam.data=CNV.Object2JSON(ajaxParam.data);
	if (!ajaxParam.async) ajaxParam.async=true;
	ajaxParam.success=callback;

	//MAKE THE CALL (WHY NOT jQuery?  jQuery WILL SOMETIMES CONVERT post TO A
	//get WHEN URL DOES NOT MATCH CURRENT SITE.  jQuery ALSO FOLLOWS SPEC, AND
	//DOES NOT ALLOW BODY CONTENT ON delete, ES DEMANDS IT  >:|  )
	var request=new XMLHttpRequest();

	if (ajaxParam.username){
		request.withCredentials = true;
		request.open(ajaxParam.type,ajaxParam.url,ajaxParam.async, ajaxParam.username, ajaxParam.password);
	}else{
		request.open(ajaxParam.type,ajaxParam.url,ajaxParam.async);
	}//endif

	//SET HEADERS
	if (ajaxParam.headers!==undefined){
		var headers=Object.keys(ajaxParam.headers);
		for(var h=0;h<headers.length;h++){
			request.setRequestHeader(headers[h], ajaxParam.headers[headers[h]]);
		}//for
	}//endif

	request.onreadystatechange=function(){
  		if (request.readyState==4){
			if (request.status==200){
				var response=request.responseText;
				if (ajaxParam.dataType=='json'){
					response=CNV.JSON2Object(response);
				}//endif
				ajaxParam.success(response);
			}else{
				ajaxParam.error(request.responseText);
			}//endif
		}else{
//			D.println(CNV.Object2JSON(request));
//			D.println(request.getAllResponseHeaders());
		}//endif
	};

	if (Rest.progressListener){
		request.addEventListener("progress",Rest.progress(Rest.progressListener),false);
		request.upload.addEventListener("progress",Rest.progress(Rest.progressListener),false);
	}//endif

	if (ajaxParam.progress){
		request.addEventListener("progress",Rest.progress(ajaxParam.progress),false);
		request.upload.addEventListener("progress",Rest.progress(ajaxParam.progress),false);
	}//endif

// progress on transfers from the server to the client (downloads)

	request.kill=function(){
		if (request.readyState==4) return;  //TOO LATE
		request.abort();
		callback(ajaxParam.error("Aborted"));
	};

	request.send(ajaxParam.data);
	yield( new aThread.Suspend(request));
};//method


Rest.get=function(ajaxParam){
	ajaxParam.type="GET";
	return Rest.send(ajaxParam);
};

Rest.put=function(ajaxParam){
	ajaxParam.type="PUT";
	return Rest.send(ajaxParam);
};

Rest.post=function(ajaxParam){
	ajaxParam.type="POST";
	return Rest.send(ajaxParam);
};//method

Rest["delete"]=function(ajaxParam){
//	D.warning("DISABLED DELETE OF "+ajaxParam.url);
//	yield (null);
	ajaxParam.type="DELETE";
	return Rest.send(ajaxParam);
};//method


Rest.progress=function(listener) {
	return function(evt){
		if (evt.lengthComputable) {
			var percentComplete = evt.loaded / evt.total;
			listener(percentComplete);
		} else {
			listener(NaN);
		}//endif
	};
};//method