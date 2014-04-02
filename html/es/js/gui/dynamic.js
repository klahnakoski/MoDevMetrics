////////////////////////////////////////////////////////////////////////////////
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
////////////////////////////////////////////////////////////////////////////////
// Author: Kyle Lahnakoski  (kyle@lahnakoski.com)
////////////////////////////////////////////////////////////////////////////////

importScript("../../lib/jquery.js");

//ADD DYNAMIC STYLING TO NODES!
//dynamicStyle="<add some css styles>"
//
//EVERY NODE IS GIVEN AN ID (IF NONE EXIST) AND
//A NEW STYLES ARE MADE FOR EACH ID BY PREFIXING EACH SELECTOR WITH "#<id>"
//
// $().dynamicStyle() ADDED IN THE EVENT MORE NODES ARE CREATED USING THIS MARKUP

$(document).ready(function () {
	var UID = 0;
	var UID_PREFIX = "_dynamic_";
	var INDICATOR_CLASS = "dynamic";

	function uid() {
		return UID++;
	}//method

	//RETURN LIST OF {"selector":<selector>, "style":<style>}
	function parseCSS(css) {
		return css.split("}").map(function (rule) {
			var info = rule.split("{");
			return {"selector": info[0].trim(), "style": info[1].trim()};
		});
	}//method

	function dynamicStyle() {
		var styles = [];
		$(this).find("." + INDICATOR_CLASS).each(function () {
			var self = $(this);
			var css = self.attr("dynamicStyle");
			var defaultStyle = self.attr("style").trim().rtrim(";") + ";";
			var rules = parseCSS(css);
			var id = self.attr("id");
			if (id == undefined) {
				id = UID_PREFIX + uid();
				self.attr("id", id);
			}//endif

			rules.forall(function (rule) {
				styles.append("#" + id + rule.selector + "{" + defaultStyle + rule.style + "}\n");
			});
			self.removeClass(INDICATOR_CLASS);
		});
		$("head").append("<style>" + styles.join("\n") + "</style>");
	}

	$.fn.dynamicUpdate = dynamicStyle;
	dynamicStyle.apply($("body"));
});


