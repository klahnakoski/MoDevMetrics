function rcmp(a, b){
	return b - a;
}
function age(date){
	var t = date.match(/(....)-(..)-(..) (..)/);
	return Math.round((Date.now() - (new Date(t[1], t[2] - 1, t[3], t[4]))) / 86400000);
}
function median(a){
	var mid = Math.floor(a.length / 2);
	return(a.length % 2) ? a[mid] : Math.floor((a[mid] + a[mid - 1]) / 2);
}
function agecalc(buglist){
	var bugs = buglist.split('\n');
	if (!bugs[0].match('^bug_id,\"opendate\",\"changeddate')){
		alert('wrong columns! ' + bugs[0]);
		throw 'oops';
	}
	bugs.shift();
	bugs.forEach(function(v, i, a){
		a[i] = v.split(',')
	});
	var dopen = bugs.map(function(v, i, a){
		return age(a[i][1])
	});
	var dmod = bugs.map(function(v, i, a){
		return age(a[i][2])
	});
	dopen.sort(rcmp);
	dmod.sort(rcmp);
	return'total: ' + bugs.length + '\nmedian age: ' + median(dopen) + ' days\noldest: ' + dopen[0] + ' days\nmedian last touched: ' + median(dmod) + ' days\nleast active untouched for ' + dmod[0] + ' days';
}
function getlist(){
	var url = 'view-source:' + document.location + ';columnlist=opendate,changeddate;ctype=csv';
	var req = new XMLHttpRequest();
	req.open('GET', url, false);
	req.send();
	return req.responseText;
}
var bugage = document.createElement("pre");
bugage.textContent = agecalc(getlist());
document.body.appendChild(bugage);
alert(bugage.textContent);

