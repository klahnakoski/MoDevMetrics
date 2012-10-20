Status = function(channel){
	this.lastMessage = "";
	this.channel = channel;
};

Status.prototype.message = function (message){
	document.getElementById(this.channel).innerHTML = message;
};

Status.prototype.addMessage = function(message){
	this.lastMessage = message + "</br>" + this.lastMessage;
	document.getElementById(this.channel).innerHTML = this.lastMessage;
};
