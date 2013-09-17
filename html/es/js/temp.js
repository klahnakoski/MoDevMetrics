var Value2Pipe = function(value){
	if (value==null){ "0" }else if (value is ArrayList || value is org.elasticsearch.common.mvel2.util.FastList){
		var out = "";
		foreach (v : value)
		out = (out=="") ? v : out + "|" + Value2Pipe(v);
		'a'+Value2Pipe(out);
	}else if (value is Long || value is Integer){
		'n'+value;
	}else if (!(value is String)){
		's'+value.getClass().getName();
	}else
		"s"+value.replace("\\\\", "\\\\\\\\").replace("|", "\\\\p")
	;
};

var get = function(hash, key){
	if (hash==null) null; else hash[key];
};

var getFlagValue = function(name){
	if (doc[name]!=null && doc[name].value!=null)
		" "+name+doc[name].stringValue.trim();
	else
		""
	;
};

var getDocValue = function(name){
	var out = [];
	var v = doc[name];
	if (v==null || v.value==null) {
		null;
	} else if (v.values.length<=1){
		v.value;
	} else {
		for(k : v.values) out.add(k);
		out;
	}
};

var _1000 = function(bugs){
	var status_whiteboard = getDocValue("status_whiteboard");
	var product = getDocValue("product");
	var modified_ts = getDocValue("modified_ts");
	var keyword = getDocValue("keyword");
	var id = getDocValue("id");
	var created_by = getDocValue("created_by");
	var component = getDocValue("component");
	var cf_tracking_thunderbird_esr17 = getDocValue("cf_tracking_thunderbird_esr17");
	var cf_tracking_thunderbird_esr10 = getDocValue("cf_tracking_thunderbird_esr10");
	var cf_tracking_thunderbird9 = getDocValue("cf_tracking_thunderbird9");
	var cf_tracking_thunderbird8 = getDocValue("cf_tracking_thunderbird8");
	var cf_tracking_thunderbird7 = getDocValue("cf_tracking_thunderbird7");
	var cf_tracking_thunderbird6 = getDocValue("cf_tracking_thunderbird6");
	var cf_tracking_thunderbird26 = getDocValue("cf_tracking_thunderbird26");
	var cf_tracking_thunderbird25 = getDocValue("cf_tracking_thunderbird25");
	var cf_tracking_thunderbird24 = getDocValue("cf_tracking_thunderbird24");
	var cf_tracking_thunderbird23 = getDocValue("cf_tracking_thunderbird23");
	var cf_tracking_thunderbird22 = getDocValue("cf_tracking_thunderbird22");
	var cf_tracking_thunderbird21 = getDocValue("cf_tracking_thunderbird21");
	var cf_tracking_thunderbird20 = getDocValue("cf_tracking_thunderbird20");
	var cf_tracking_thunderbird19 = getDocValue("cf_tracking_thunderbird19");
	var cf_tracking_thunderbird18 = getDocValue("cf_tracking_thunderbird18");
	var cf_tracking_thunderbird17 = getDocValue("cf_tracking_thunderbird17");
	var cf_tracking_thunderbird16 = getDocValue("cf_tracking_thunderbird16");
	var cf_tracking_thunderbird15 = getDocValue("cf_tracking_thunderbird15");
	var cf_tracking_thunderbird14 = getDocValue("cf_tracking_thunderbird14");
	var cf_tracking_thunderbird13 = getDocValue("cf_tracking_thunderbird13");
	var cf_tracking_thunderbird12 = getDocValue("cf_tracking_thunderbird12");
	var cf_tracking_thunderbird11 = getDocValue("cf_tracking_thunderbird11");
	var cf_tracking_thunderbird10 = getDocValue("cf_tracking_thunderbird10");
	var cf_tracking_seamonkey29 = getDocValue("cf_tracking_seamonkey29");
	var cf_tracking_seamonkey28 = getDocValue("cf_tracking_seamonkey28");
	var cf_tracking_seamonkey27 = getDocValue("cf_tracking_seamonkey27");
	var cf_tracking_seamonkey26 = getDocValue("cf_tracking_seamonkey26");
	var cf_tracking_seamonkey25 = getDocValue("cf_tracking_seamonkey25");
	var cf_tracking_seamonkey24 = getDocValue("cf_tracking_seamonkey24");
	var cf_tracking_seamonkey23 = getDocValue("cf_tracking_seamonkey23");
	var cf_tracking_seamonkey223 = getDocValue("cf_tracking_seamonkey223");
	var cf_tracking_seamonkey222 = getDocValue("cf_tracking_seamonkey222");
	var cf_tracking_seamonkey221 = getDocValue("cf_tracking_seamonkey221");
	var cf_tracking_seamonkey220 = getDocValue("cf_tracking_seamonkey220");
	var cf_tracking_seamonkey22 = getDocValue("cf_tracking_seamonkey22");
	var cf_tracking_seamonkey219 = getDocValue("cf_tracking_seamonkey219");
	var cf_tracking_seamonkey218 = getDocValue("cf_tracking_seamonkey218");
	var cf_tracking_seamonkey217 = getDocValue("cf_tracking_seamonkey217");
	var cf_tracking_seamonkey216 = getDocValue("cf_tracking_seamonkey216");
	var cf_tracking_seamonkey215 = getDocValue("cf_tracking_seamonkey215");
	var cf_tracking_seamonkey214 = getDocValue("cf_tracking_seamonkey214");
	var cf_tracking_seamonkey213 = getDocValue("cf_tracking_seamonkey213");
	var cf_tracking_seamonkey212 = getDocValue("cf_tracking_seamonkey212");
	var cf_tracking_seamonkey211 = getDocValue("cf_tracking_seamonkey211");
	var cf_tracking_seamonkey210 = getDocValue("cf_tracking_seamonkey210");
	var cf_tracking_relnote_b2g = getDocValue("cf_tracking_relnote_b2g");
	var cf_tracking_firefox_relnote = getDocValue("cf_tracking_firefox_relnote");
	var cf_tracking_firefox_esr24 = getDocValue("cf_tracking_firefox_esr24");
	var cf_tracking_firefox_esr17 = getDocValue("cf_tracking_firefox_esr17");
	var cf_tracking_firefox9 = getDocValue("cf_tracking_firefox9");
	var cf_tracking_firefox8 = getDocValue("cf_tracking_firefox8");
	var cf_tracking_firefox7 = getDocValue("cf_tracking_firefox7");
	var cf_tracking_firefox6 = getDocValue("cf_tracking_firefox6");
	var cf_tracking_firefox5 = getDocValue("cf_tracking_firefox5");
	var cf_tracking_firefox26 = getDocValue("cf_tracking_firefox26");
	var cf_tracking_firefox25 = getDocValue("cf_tracking_firefox25");
	var cf_tracking_firefox24 = getDocValue("cf_tracking_firefox24");
	var cf_tracking_firefox23 = getDocValue("cf_tracking_firefox23");
	var cf_tracking_firefox22 = getDocValue("cf_tracking_firefox22");
	var cf_tracking_firefox21 = getDocValue("cf_tracking_firefox21");
	var cf_tracking_firefox20 = getDocValue("cf_tracking_firefox20");
	var cf_tracking_firefox19 = getDocValue("cf_tracking_firefox19");
	var cf_tracking_firefox18 = getDocValue("cf_tracking_firefox18");
	var cf_tracking_firefox17 = getDocValue("cf_tracking_firefox17");
	var cf_tracking_firefox16 = getDocValue("cf_tracking_firefox16");
	var cf_tracking_firefox15 = getDocValue("cf_tracking_firefox15");
	var cf_tracking_firefox14 = getDocValue("cf_tracking_firefox14");
	var cf_tracking_firefox13 = getDocValue("cf_tracking_firefox13");
	var cf_tracking_firefox12 = getDocValue("cf_tracking_firefox12");
	var cf_tracking_firefox11 = getDocValue("cf_tracking_firefox11");
	var cf_tracking_firefox10 = getDocValue("cf_tracking_firefox10");
	var cf_tracking_esr10 = getDocValue("cf_tracking_esr10");
	var cf_tracking_b2g18 = getDocValue("cf_tracking_b2g18");
	var cf_status_thunderbird_esr17 = getDocValue("cf_status_thunderbird_esr17");
	var cf_status_thunderbird_esr10 = getDocValue("cf_status_thunderbird_esr10");
	var cf_status_thunderbird9 = getDocValue("cf_status_thunderbird9");
	var cf_status_thunderbird8 = getDocValue("cf_status_thunderbird8");
	var cf_status_thunderbird7 = getDocValue("cf_status_thunderbird7");
	var cf_status_thunderbird6 = getDocValue("cf_status_thunderbird6");
	var cf_status_thunderbird33 = getDocValue("cf_status_thunderbird33");
	var cf_status_thunderbird32 = getDocValue("cf_status_thunderbird32");
	var cf_status_thunderbird31 = getDocValue("cf_status_thunderbird31");
	var cf_status_thunderbird30 = getDocValue("cf_status_thunderbird30");
	var cf_status_thunderbird26 = getDocValue("cf_status_thunderbird26");
	var cf_status_thunderbird25 = getDocValue("cf_status_thunderbird25");
	var cf_status_thunderbird24 = getDocValue("cf_status_thunderbird24");
	var cf_status_thunderbird23 = getDocValue("cf_status_thunderbird23");
	var cf_status_thunderbird22 = getDocValue("cf_status_thunderbird22");
	var cf_status_thunderbird21 = getDocValue("cf_status_thunderbird21");
	var cf_status_thunderbird20 = getDocValue("cf_status_thunderbird20");
	var cf_status_thunderbird19 = getDocValue("cf_status_thunderbird19");
	var cf_status_thunderbird18 = getDocValue("cf_status_thunderbird18");
	var cf_status_thunderbird17 = getDocValue("cf_status_thunderbird17");
	var cf_status_thunderbird16 = getDocValue("cf_status_thunderbird16");
	var cf_status_thunderbird15 = getDocValue("cf_status_thunderbird15");
	var cf_status_thunderbird14 = getDocValue("cf_status_thunderbird14");
	var cf_status_thunderbird13 = getDocValue("cf_status_thunderbird13");
	var cf_status_thunderbird12 = getDocValue("cf_status_thunderbird12");
	var cf_status_thunderbird11 = getDocValue("cf_status_thunderbird11");
	var cf_status_thunderbird10 = getDocValue("cf_status_thunderbird10");
	var cf_status_seamonkey29 = getDocValue("cf_status_seamonkey29");
	var cf_status_seamonkey28 = getDocValue("cf_status_seamonkey28");
	var cf_status_seamonkey27 = getDocValue("cf_status_seamonkey27");
	var cf_status_seamonkey26 = getDocValue("cf_status_seamonkey26");
	var cf_status_seamonkey25 = getDocValue("cf_status_seamonkey25");
	var cf_status_seamonkey24 = getDocValue("cf_status_seamonkey24");
	var cf_status_seamonkey23 = getDocValue("cf_status_seamonkey23");
	var cf_status_seamonkey223 = getDocValue("cf_status_seamonkey223");
	var cf_status_seamonkey222 = getDocValue("cf_status_seamonkey222");
	var cf_status_seamonkey221 = getDocValue("cf_status_seamonkey221");
	var cf_status_seamonkey220 = getDocValue("cf_status_seamonkey220");
	var cf_status_seamonkey22 = getDocValue("cf_status_seamonkey22");
	var cf_status_seamonkey219 = getDocValue("cf_status_seamonkey219");
	var cf_status_seamonkey218 = getDocValue("cf_status_seamonkey218");
	var cf_status_seamonkey217 = getDocValue("cf_status_seamonkey217");
	var cf_status_seamonkey216 = getDocValue("cf_status_seamonkey216");
	var cf_status_seamonkey215 = getDocValue("cf_status_seamonkey215");
	var cf_status_seamonkey214 = getDocValue("cf_status_seamonkey214");
	var cf_status_seamonkey213 = getDocValue("cf_status_seamonkey213");
	var cf_status_seamonkey212 = getDocValue("cf_status_seamonkey212");
	var cf_status_seamonkey211 = getDocValue("cf_status_seamonkey211");
	var cf_status_seamonkey210 = getDocValue("cf_status_seamonkey210");
	var cf_status_seamonkey21 = getDocValue("cf_status_seamonkey21");
	var cf_status_firefox_esr24 = getDocValue("cf_status_firefox_esr24");
	var cf_status_firefox_esr17 = getDocValue("cf_status_firefox_esr17");
	var cf_status_firefox9 = getDocValue("cf_status_firefox9");
	var cf_status_firefox8 = getDocValue("cf_status_firefox8");
	var cf_status_firefox7 = getDocValue("cf_status_firefox7");
	var cf_status_firefox6 = getDocValue("cf_status_firefox6");
	var cf_status_firefox5 = getDocValue("cf_status_firefox5");
	var cf_status_firefox26 = getDocValue("cf_status_firefox26");
	var cf_status_firefox25 = getDocValue("cf_status_firefox25");
	var cf_status_firefox24 = getDocValue("cf_status_firefox24");
	var cf_status_firefox23 = getDocValue("cf_status_firefox23");
	var cf_status_firefox22 = getDocValue("cf_status_firefox22");
	var cf_status_firefox21 = getDocValue("cf_status_firefox21");
	var cf_status_firefox20 = getDocValue("cf_status_firefox20");
	var cf_status_firefox19 = getDocValue("cf_status_firefox19");
	var cf_status_firefox18 = getDocValue("cf_status_firefox18");
	var cf_status_firefox17 = getDocValue("cf_status_firefox17");
	var cf_status_firefox16 = getDocValue("cf_status_firefox16");
	var cf_status_firefox15 = getDocValue("cf_status_firefox15");
	var cf_status_firefox14 = getDocValue("cf_status_firefox14");
	var cf_status_firefox13 = getDocValue("cf_status_firefox13");
	var cf_status_firefox12 = getDocValue("cf_status_firefox12");
	var cf_status_firefox11 = getDocValue("cf_status_firefox11");
	var cf_status_firefox10 = getDocValue("cf_status_firefox10");
	var cf_status_esr10 = getDocValue("cf_status_esr10");
	var cf_status_b2g_1_1_hd = getDocValue("cf_status_b2g_1_1_hd");
	var cf_status_b2g18_1_0_1 = getDocValue("cf_status_b2g18_1_0_1");
	var cf_status_b2g18_1_0_0 = getDocValue("cf_status_b2g18_1_0_0");
	var cf_status_b2g18 = getDocValue("cf_status_b2g18");
	var cf_status_20 = getDocValue("cf_status_20");
	var cf_status_192 = getDocValue("cf_status_192");
	var cf_status_191 = getDocValue("cf_status_191");
	var cf_shadow_bug = getDocValue("cf_shadow_bug");
	var cf_partner_leo_zte = getDocValue("cf_partner_leo_zte");
	var cf_partner_koi_zte = getDocValue("cf_partner_koi_zte");
	var cf_partner_helix_zte = getDocValue("cf_partner_helix_zte");
	var cf_office = getDocValue("cf_office");
	var cf_locale = getDocValue("cf_locale");
	var cf_last_resolved = getDocValue("cf_last_resolved");
	var cf_due_date = getDocValue("cf_due_date");
	var cf_crash_signature = getDocValue("cf_crash_signature");
	var cf_colo_site = getDocValue("cf_colo_site");
	var cf_blocking_thunderbird33 = getDocValue("cf_blocking_thunderbird33");
	var cf_blocking_thunderbird32 = getDocValue("cf_blocking_thunderbird32");
	var cf_blocking_thunderbird31 = getDocValue("cf_blocking_thunderbird31");
	var cf_blocking_thunderbird30 = getDocValue("cf_blocking_thunderbird30");
	var cf_blocking_seamonkey21 = getDocValue("cf_blocking_seamonkey21");
	var cf_blocking_kilimanjaro = getDocValue("cf_blocking_kilimanjaro");
	var cf_blocking_fx = getDocValue("cf_blocking_fx");
	var cf_blocking_fennec10 = getDocValue("cf_blocking_fennec10");
	var cf_blocking_fennec = getDocValue("cf_blocking_fennec");
	var cf_blocking_basecamp = getDocValue("cf_blocking_basecamp");
	var cf_blocking_b2g = getDocValue("cf_blocking_b2g");
	var cf_blocking_20 = getDocValue("cf_blocking_20");
	var cf_blocking_192 = getDocValue("cf_blocking_192");
	var cf_blocking_191 = getDocValue("cf_blocking_191");
	var bug_status = getDocValue("bug_status");
	var status = getDocValue("status");
	var bug_id = getDocValue("bug_id");
	output="";
	if (bugs.?attachments!=null){
		for(bugs1 : bugs.?attachments){
			if (bugs1.?flags!=null){
				for(bugs2 : bugs1.?flags){
					if ((bugs2.?request_status=="?") &&
						((bugs2.?request_type=="review") || (bugs2.?request_type=="superreview")) &&
						(bugs2.?modified_ts==bugs.?modified_ts) &&
						(bugs1["attachments.isobsolete"]==0))
					{
						if (output!="") output+="|";
						output+=Value2Pipe(bugs.?bug_id)
						+"|"+Value2Pipe(bugs1.?attach_id)
						+"|"+Value2Pipe(bugs.?modified_ts)
						+"|"+Value2Pipe(bugs2.?requestee)
						+"|"+Value2Pipe(bugs1.?created_by)
						+"|"+Value2Pipe(bugs.?product)
						+"|"+Value2Pipe(bugs.?component)
						+"|"+Value2Pipe((bugs.?bug_status=='resolved'||bugs.?bug_status=='verified'||bugs.?bug_status=='closed') ? 'closed':'open')
						+"|"+Value2Pipe(doc["keywords"].value)
						+"|"+Value2Pipe(bugs.?status_whiteboard)
						+"|"+Value2Pipe(
						var _cf_ = "";
						_cf_+=getFlagValue("cf_tracking_thunderbird_esr17");
						_cf_+=getFlagValue("cf_tracking_thunderbird_esr10");
						_cf_+=getFlagValue("cf_tracking_thunderbird9");
						_cf_+=getFlagValue("cf_tracking_thunderbird8");
						_cf_+=getFlagValue("cf_tracking_thunderbird7");
						_cf_+=getFlagValue("cf_tracking_thunderbird6");
						_cf_+=getFlagValue("cf_tracking_thunderbird26");
						_cf_+=getFlagValue("cf_tracking_thunderbird25");
						_cf_+=getFlagValue("cf_tracking_thunderbird24");
						_cf_+=getFlagValue("cf_tracking_thunderbird23");
						_cf_+=getFlagValue("cf_tracking_thunderbird22");
						_cf_+=getFlagValue("cf_tracking_thunderbird21");
						_cf_+=getFlagValue("cf_tracking_thunderbird20");
						_cf_+=getFlagValue("cf_tracking_thunderbird19");
						_cf_+=getFlagValue("cf_tracking_thunderbird18");
						_cf_+=getFlagValue("cf_tracking_thunderbird17");
						_cf_+=getFlagValue("cf_tracking_thunderbird16");
						_cf_+=getFlagValue("cf_tracking_thunderbird15");
						_cf_+=getFlagValue("cf_tracking_thunderbird14");
						_cf_+=getFlagValue("cf_tracking_thunderbird13");
						_cf_+=getFlagValue("cf_tracking_thunderbird12");
						_cf_+=getFlagValue("cf_tracking_thunderbird11");
						_cf_+=getFlagValue("cf_tracking_thunderbird10");
						_cf_+=getFlagValue("cf_tracking_seamonkey29");
						_cf_+=getFlagValue("cf_tracking_seamonkey28");
						_cf_+=getFlagValue("cf_tracking_seamonkey27");
						_cf_+=getFlagValue("cf_tracking_seamonkey26");
						_cf_+=getFlagValue("cf_tracking_seamonkey25");
						_cf_+=getFlagValue("cf_tracking_seamonkey24");
						_cf_+=getFlagValue("cf_tracking_seamonkey23");
						_cf_+=getFlagValue("cf_tracking_seamonkey223");
						_cf_+=getFlagValue("cf_tracking_seamonkey222");
						_cf_+=getFlagValue("cf_tracking_seamonkey221");
						_cf_+=getFlagValue("cf_tracking_seamonkey220");
						_cf_+=getFlagValue("cf_tracking_seamonkey22");
						_cf_+=getFlagValue("cf_tracking_seamonkey219");
						_cf_+=getFlagValue("cf_tracking_seamonkey218");
						_cf_+=getFlagValue("cf_tracking_seamonkey217");
						_cf_+=getFlagValue("cf_tracking_seamonkey216");
						_cf_+=getFlagValue("cf_tracking_seamonkey215");
						_cf_+=getFlagValue("cf_tracking_seamonkey214");
						_cf_+=getFlagValue("cf_tracking_seamonkey213");
						_cf_+=getFlagValue("cf_tracking_seamonkey212");
						_cf_+=getFlagValue("cf_tracking_seamonkey211");
						_cf_+=getFlagValue("cf_tracking_seamonkey210");
						_cf_+=getFlagValue("cf_tracking_relnote_b2g");
						_cf_+=getFlagValue("cf_tracking_firefox_relnote");
						_cf_+=getFlagValue("cf_tracking_firefox_esr24");
						_cf_+=getFlagValue("cf_tracking_firefox_esr17");
						_cf_+=getFlagValue("cf_tracking_firefox9");
						_cf_+=getFlagValue("cf_tracking_firefox8");
						_cf_+=getFlagValue("cf_tracking_firefox7");
						_cf_+=getFlagValue("cf_tracking_firefox6");
						_cf_+=getFlagValue("cf_tracking_firefox5");
						_cf_+=getFlagValue("cf_tracking_firefox26");
						_cf_+=getFlagValue("cf_tracking_firefox25");
						_cf_+=getFlagValue("cf_tracking_firefox24");
						_cf_+=getFlagValue("cf_tracking_firefox23");
						_cf_+=getFlagValue("cf_tracking_firefox22");
						_cf_+=getFlagValue("cf_tracking_firefox21");
						_cf_+=getFlagValue("cf_tracking_firefox20");
						_cf_+=getFlagValue("cf_tracking_firefox19");
						_cf_+=getFlagValue("cf_tracking_firefox18");
						_cf_+=getFlagValue("cf_tracking_firefox17");
						_cf_+=getFlagValue("cf_tracking_firefox16");
						_cf_+=getFlagValue("cf_tracking_firefox15");
						_cf_+=getFlagValue("cf_tracking_firefox14");
						_cf_+=getFlagValue("cf_tracking_firefox13");
						_cf_+=getFlagValue("cf_tracking_firefox12");
						_cf_+=getFlagValue("cf_tracking_firefox11");
						_cf_+=getFlagValue("cf_tracking_firefox10");
						_cf_+=getFlagValue("cf_tracking_esr10");
						_cf_+=getFlagValue("cf_tracking_b2g18");
						_cf_+=getFlagValue("cf_status_thunderbird_esr17");
						_cf_+=getFlagValue("cf_status_thunderbird_esr10");
						_cf_+=getFlagValue("cf_status_thunderbird9");
						_cf_+=getFlagValue("cf_status_thunderbird8");
						_cf_+=getFlagValue("cf_status_thunderbird7");
						_cf_+=getFlagValue("cf_status_thunderbird6");
						_cf_+=getFlagValue("cf_status_thunderbird33");
						_cf_+=getFlagValue("cf_status_thunderbird32");
						_cf_+=getFlagValue("cf_status_thunderbird31");
						_cf_+=getFlagValue("cf_status_thunderbird30");
						_cf_+=getFlagValue("cf_status_thunderbird26");
						_cf_+=getFlagValue("cf_status_thunderbird25");
						_cf_+=getFlagValue("cf_status_thunderbird24");
						_cf_+=getFlagValue("cf_status_thunderbird23");
						_cf_+=getFlagValue("cf_status_thunderbird22");
						_cf_+=getFlagValue("cf_status_thunderbird21");
						_cf_+=getFlagValue("cf_status_thunderbird20");
						_cf_+=getFlagValue("cf_status_thunderbird19");
						_cf_+=getFlagValue("cf_status_thunderbird18");
						_cf_+=getFlagValue("cf_status_thunderbird17");
						_cf_+=getFlagValue("cf_status_thunderbird16");
						_cf_+=getFlagValue("cf_status_thunderbird15");
						_cf_+=getFlagValue("cf_status_thunderbird14");
						_cf_+=getFlagValue("cf_status_thunderbird13");
						_cf_+=getFlagValue("cf_status_thunderbird12");
						_cf_+=getFlagValue("cf_status_thunderbird11");
						_cf_+=getFlagValue("cf_status_thunderbird10");
						_cf_+=getFlagValue("cf_status_seamonkey29");
						_cf_+=getFlagValue("cf_status_seamonkey28");
						_cf_+=getFlagValue("cf_status_seamonkey27");
						_cf_+=getFlagValue("cf_status_seamonkey26");
						_cf_+=getFlagValue("cf_status_seamonkey25");
						_cf_+=getFlagValue("cf_status_seamonkey24");
						_cf_+=getFlagValue("cf_status_seamonkey23");
						_cf_+=getFlagValue("cf_status_seamonkey223");
						_cf_+=getFlagValue("cf_status_seamonkey222");
						_cf_+=getFlagValue("cf_status_seamonkey221");
						_cf_+=getFlagValue("cf_status_seamonkey220");
						_cf_+=getFlagValue("cf_status_seamonkey22");
						_cf_+=getFlagValue("cf_status_seamonkey219");
						_cf_+=getFlagValue("cf_status_seamonkey218");
						_cf_+=getFlagValue("cf_status_seamonkey217");
						_cf_+=getFlagValue("cf_status_seamonkey216");
						_cf_+=getFlagValue("cf_status_seamonkey215");
						_cf_+=getFlagValue("cf_status_seamonkey214");
						_cf_+=getFlagValue("cf_status_seamonkey213");
						_cf_+=getFlagValue("cf_status_seamonkey212");
						_cf_+=getFlagValue("cf_status_seamonkey211");
						_cf_+=getFlagValue("cf_status_seamonkey210");
						_cf_+=getFlagValue("cf_status_seamonkey21");
						_cf_+=getFlagValue("cf_status_firefox_esr24");
						_cf_+=getFlagValue("cf_status_firefox_esr17");
						_cf_+=getFlagValue("cf_status_firefox9");
						_cf_+=getFlagValue("cf_status_firefox8");
						_cf_+=getFlagValue("cf_status_firefox7");
						_cf_+=getFlagValue("cf_status_firefox6");
						_cf_+=getFlagValue("cf_status_firefox5");
						_cf_+=getFlagValue("cf_status_firefox26");
						_cf_+=getFlagValue("cf_status_firefox25");
						_cf_+=getFlagValue("cf_status_firefox24");
						_cf_+=getFlagValue("cf_status_firefox23");
						_cf_+=getFlagValue("cf_status_firefox22");
						_cf_+=getFlagValue("cf_status_firefox21");
						_cf_+=getFlagValue("cf_status_firefox20");
						_cf_+=getFlagValue("cf_status_firefox19");
						_cf_+=getFlagValue("cf_status_firefox18");
						_cf_+=getFlagValue("cf_status_firefox17");
						_cf_+=getFlagValue("cf_status_firefox16");
						_cf_+=getFlagValue("cf_status_firefox15");
						_cf_+=getFlagValue("cf_status_firefox14");
						_cf_+=getFlagValue("cf_status_firefox13");
						_cf_+=getFlagValue("cf_status_firefox12");
						_cf_+=getFlagValue("cf_status_firefox11");
						_cf_+=getFlagValue("cf_status_firefox10");
						_cf_+=getFlagValue("cf_status_esr10");
						_cf_+=getFlagValue("cf_status_b2g_1_1_hd");
						_cf_+=getFlagValue("cf_status_b2g18_1_0_1");
						_cf_+=getFlagValue("cf_status_b2g18_1_0_0");
						_cf_+=getFlagValue("cf_status_b2g18");
						_cf_+=getFlagValue("cf_status_20");
						_cf_+=getFlagValue("cf_status_192");
						_cf_+=getFlagValue("cf_status_191");
						_cf_+=getFlagValue("cf_shadow_bug");
						_cf_+=getFlagValue("cf_partner_leo_zte");
						_cf_+=getFlagValue("cf_partner_koi_zte");
						_cf_+=getFlagValue("cf_partner_helix_zte");
						_cf_+=getFlagValue("cf_office");
						_cf_+=getFlagValue("cf_locale");
						_cf_+=getFlagValue("cf_last_resolved");
						_cf_+=getFlagValue("cf_due_date");
						_cf_+=getFlagValue("cf_crash_signature");
						_cf_+=getFlagValue("cf_colo_site");
						_cf_+=getFlagValue("cf_blocking_thunderbird33");
						_cf_+=getFlagValue("cf_blocking_thunderbird32");
						_cf_+=getFlagValue("cf_blocking_thunderbird31");
						_cf_+=getFlagValue("cf_blocking_thunderbird30");
						_cf_+=getFlagValue("cf_blocking_seamonkey21");
						_cf_+=getFlagValue("cf_blocking_kilimanjaro");
						_cf_+=getFlagValue("cf_blocking_fx");
						_cf_+=getFlagValue("cf_blocking_fennec10");
						_cf_+=getFlagValue("cf_blocking_fennec");
						_cf_+=getFlagValue("cf_blocking_basecamp");
						_cf_+=getFlagValue("cf_blocking_b2g");
						_cf_+=getFlagValue("cf_blocking_20");
						_cf_+=getFlagValue("cf_blocking_192");
						_cf_+=getFlagValue("cf_blocking_191");
						_cf_ = _cf_.trim();
						_cf_;
						);
					}
				}
			}

		}
	}
	output;
};
_1000(_source)
