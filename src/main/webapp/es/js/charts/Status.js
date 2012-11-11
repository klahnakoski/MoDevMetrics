Status = function(channel){
	this.ID = channel;
};

Status.prototype.message = function (message){
	if (message.toLowerCase()=="done" && $('.loading')!==undefined) $('.loading').hide();
	
	document.getElementById(this.ID).innerHTML = message;
};

status = new Status("status");
