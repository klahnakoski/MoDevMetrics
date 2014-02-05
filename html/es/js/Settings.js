/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



var Settings={};
window.Settings=Settings;

if (window.location.hostname=="metrics.mozilla.com"){
	Settings.basePath="es";
}else if (window.location.hostname=="people.mozilla.com"){
	Settings.basePath="http://people.mozilla.com/~klahnakoski/test/es/";
}else{
	var find="html/es";
	Settings.basePath=window.location.pathname.substring(0, window.location.pathname.indexOf(find)+find.length);
}//endif


Settings.imagePath=Settings.basePath+"/images";

