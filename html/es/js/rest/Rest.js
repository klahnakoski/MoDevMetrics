/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../../lib/jsThreads/js/thread.js");


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

	var callback=yield (Thread.Resume);	//RESUME THREAD ON RETURN

	//FILL IN THE OPTIONAL VALUES
	if (ajaxParam.type===undefined) ajaxParam.type="POST";
	ajaxParam.type=ajaxParam.type.toUpperCase();
	if (ajaxParam.dataType===undefined) ajaxParam.dataType="json";
	if (ajaxParam.error===undefined){
		ajaxParam.error=function(errorData){
			callback(new Exception("Error while calling "+ajaxParam.url+": "+errorData));
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

	request.onreadystatechange = function(){
		if (request.readyState == 4){
			if (request.status == 200){
				var response = request.responseText;
				if (ajaxParam.dataType == 'json'){
					response = CNV.JSON2Object(response);
				}//endif
				if (response === undefined){
					D.warning("Appears to have no response!!")
				}//endif
				ajaxParam.success(response);
			} else if (request.isTimeout){
				callback(new Exception("Error while calling " + ajaxParam.url, Exception.TIMEOUT));
			} else{
				ajaxParam.error("Bad response: " + CNV.String2Quote(request.responseText));
			}//endif
		} else if (request.readyState == 3){
			//RESPONSE IS ARRIVING, DISABLE TIMEOUT
			request.timeoutFunction=function(){}
		} else{
//			D.println(CNV.Object2JSON(request));
//			D.println(request.getAllResponseHeaders());
		}//endif
	};

//	if (Rest.progressListener){
//		request.addEventListener("progress",Rest.progress(Rest.progressListener),false);
//		request.upload.addEventListener("progress",Rest.progress(Rest.progressListener),false);
//	}//endif
//
//	if (ajaxParam.progress){
//		request.addEventListener("progress",Rest.progress(ajaxParam.progress),false);
//		request.upload.addEventListener("progress",Rest.progress(ajaxParam.progress),false);
//	}//endif

	request.kill=function(){
		if (request.readyState==4) return;  //TOO LATE
		ajaxParam.error=function(){};//STANDARD ERROR HANDLING DOES NOT APPLY
		try{
			request.abort();   //abort() CALLS readyStateChange() WHICH CAN CALL ajaxParam.error()
		}catch(e){
			//IGNORE
		}//try
		//WE DO NOT CALL THE CALLBACK BECAUSE THE THREAD WILL BE CALLING INTERRUPT SHORTLY
		//callback(new Exception("Aborted"));
	};

	if (ajaxParam.timeout!==undefined){
		request.timeoutFunction=function(){
			request.isTimeout=true;
			request.abort()
		};

		setTimeout(
			request.timeoutFunction,
			ajaxParam.timeout
		);
	}

	request.send(ajaxParam.data);
	yield (Thread.suspend((ajaxParam.doNotKill) ? undefined : request));
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