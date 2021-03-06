//"use strict";

var explain_search = { 'group_by_vol':       null,
		       'volume_level_terms': null,
		       'volume_level_desc':  null,
		       'page_level_terms':   null,
		       'page_level_desc':    null  };

function advanced_query_set_explain_fields(arg_q)
{

    if (arg_q.match(/volume[^_]+_txt:/) || arg_q.match(/htrctokentext:/)) {
	doc_unit  = " page ";
	doc_units = " pages ";
	facet_filter.setFacetLevel(FacetLevelEnum.Page);
		
	if (arg_q.match(/volume[^_]+_txt:/)) {
	    explain_search.volume_level_desc  = "[Volume: Terms]";
	}
	if (arg_q.match(/htrctokentext:/)) {		
	    explain_search.page_level_desc   = "[Page-level: POS-Terms]";
	}
	
	if (group_by_vol_checked) {
	    explain_search.group_by_vol = "Search results sorted by volume ID";
	}
	
	if (arg_q.match(/[^_]+_t:/)) {
	    doc_unit  = " page/volume mix ";
	    doc_units = " page/volume mix ";
	}
	    }
    else {
	doc_unit  = " volume ";
	doc_units = " volumes ";
	explain_search.volume_level_desc  = "[Volume: TERMS]";	    
    }
}

/*
function add2any_html(store_search_url)
{
    console.log("*** store_search_url = " + store_search_url);
    //var escaped_store_search_url = store_search_url.replace(/\"/g,'&amp;quot;');
    var escaped_store_search_url = store_search_url.replace(/\"/g,'&quot;').replace(/ /g,'+');
    //var escaped_store_search_url = store_search_url.replace('"','\\"');
    //var escaped_store_search_url = encodeURI(store_search_url);
    console.log("*** escpd_search_url = " + escaped_store_search_url);
    
    var data_a2a = "";
    data_a2a += 'data-a2a-url="'+escaped_store_search_url+'"';
    data_a2a += ' data-a2a-title="HathiTrust Research Center (HTRC) Extracted Feature Search"';
    
    var a2a_html = "";
    a2a_html += '<div class="no-user-select" style="float:right;">\n';
    a2a_html += '  <div class="a2a_kit a2a_kit_size_32 a2a_default_style"' + data_a2a + '>\n';
    a2a_html += '    <a class="a2a_button_email"></a>\n';
    a2a_html += '    <a class="a2a_button_facebook"></a>\n';
    a2a_html += '    <a class="a2a_button_google_plus"></a>\n';
    //a2a_html += '  <a class="a2a_button_twitter"></a>\n';
    a2a_html += '    <a class="a2a_dd" href="https://www.addtoany.com/share"></a>\n';
    //a2a_html += '  <a class="a2a_dd" href="https://www.addtoany.com/share_save"></a>\n';
    a2a_html += '  </div>\n';
    a2a_html += '</div>\n';
    a2a_html += '\n';
    a2a_html += '<script type="text/javascript">\n';
    a2a_html += '  var a2a_config = a2a_config || {};\n';
    //a2a_html += '  a2a_config.track_links = "googl";\n';
    a2a_html += '  a2a_config.track_links = "bitly";\n';
    a2a_html += '  a2a_config.track_links_key = "addtoany|R_cc6a4017b0274d1d86f2397771b70136";\n';

    a2a_html += '</script>\n';
    a2a_html += '<script type="text/javascript" async="" src="//static.addtoany.com/menu/page.js"></script>\n';

    return a2a_html;
}
*/


window.onpopstate = function(event) {
    
    if ((event.state) && (event.state.key)) {
	var state = event.state;

	group_by_vol_checked = state.group_by_vol_checked;

	// In Safari on a Mac, it appears that a history back operation retains the previous
	// previous global values (cached somehow?), different to how the other browsers operate
	// For most global variables in the SolrEF code these get correctcly overridden,
	// but this is not the case for the shoppingcart, so we must do so explicitly here
	console.log("History window.onpopstate() reseting store_shoppingcart_ids + hash to be empty");
	store_shoppingcart_ids = []; 
	store_shoppingcart_ids_hash = {}; 


	trigger_solr_key_search(state.key,state.start,false); // don't want this query added to browser history
    }    
    else if ((event.state) && (event.state.key == null)) {
	// A key of null is a sign that this is the first result set in history sequence
	if ($('#search-results-page').is(":hidden")) {
	    $('#search-results-page').show("slide", { direction: "up" }, 1000);
	}	
    }
    else if (document.location.pathname == solref_home_pathname) {
	$('#search-results-page').hide("slide", { direction: "up" }, 1000);
    }
};


//function explain_add2any_dom(store_search_url) // ****
function explain_add2any_dom(store_raw_q_json)
{
    //var raw_q = store_raw_q_json.raw_q;
    var store_raw_q_json_str = JSON.stringify(store_raw_q_json)
    
    //if (!raw_q.match(/^https?:/)) {
    // ****
    // Is the following relevant anymore? // **** (former version had url as its param)
    /*
    if (raw_q.match(/^\/\//)) {
	raw_q = "https:" + raw_q;
    }
    */
    
    // **** Is this really the best place for this AJAX triggered call?
    if (store_query_display_mode != QueryDisplayModeEnum.ShoppingCart) {
	//raw_q = raw_q.trim(); // calling method does .trim() now, so is this needed anymore? // ****
	
    $.ajax({
	type: "POST",
	async: true,
	headers: { "cache-control": "no-cache" },
	url: ef_accessapi_url,
	data: {
	    'action': 'url-shortener',
	    'value': encodeURI(store_raw_q_json_str)
	},
	dataType: "text",
	success: function(textData) {
	    var key = textData;
	    
	    // If query has been cause by a forward/backward browser button being pressed, then
	    // solr_add_to_history will be false
	    
	    if (solr_add_to_history) {
		// Update browser's URL so key is stored there

		var update_search = window.location.search;
		
		if (update_search == "") {
		    update_search = "?solr-key-q=" + key;
		}
		//else if (location.search.match(/solr-key-q=/)) { // ****
		else if (update_search.match(/solr-key-q=/)) {
		    update_search = update_search.replace(/solr-key-q=.*?(&|$)/,"solr-key-q="+key+"$1");
		}
		else {
		    // solr-key-q not in URL, but other arguments are present
		    update_search += "&solr-key-q=" + key;
		}

		var start = parseInt(store_search_args.start)
		if (start>=0) { // this can be simplified if it is guaranteed that start is valid value by this point
		    var arg_start = parseInt(start)+1; // 'start' value and cgi-arg version work 'off by one' to each other

		    if (update_search.match(/start=\d+/)) {
			var arg_start = parseInt(start)+1; // 'start' value and cgi-arg version work 'off by one' to each other
			update_search = update_search.replace(/start=.*?(&|$)/,"start="+arg_start+"$1");
		    }
		    else {
			update_search += "&start="+arg_start;
		    }
		}
		
		//if (location.search.match(/group-by-vol=/)) { // ****
		if (update_search.match(/group-by-vol=/)) {
		    update_search = update_search.replace(/group-by-vol=.*?(&|$)/,"group-by-vol="+group_by_vol_checked+"$1");
		}
		else {
		    // solr-key-q not in URL, but other arguments are present
		    update_search += "&group-by-vol=" + group_by_vol_checked;
		}

		var updated_url = window.location.pathname + update_search + window.location.hash;	    	

		//if (update_search != document.location.search) { // ****
		// Consider changing from using 'document' to 'window' ???
		// Note: browsers alias 'document.location' and 'window.location' to be the same theing
		if (update_search != document.location.search) {
		    var state = { key: key, q: store_search_args.q, start: start, group_by_vol_checked: group_by_vol_checked }
		    var title_str = "Search by Query '" + store_search_args.q +"', row-start=" + start;
		    window.history.pushState(state,title_str,updated_url);

		}
		else {
		    console.log("No need to record history as URL already matches current browser loaded URL:")
		    console.log("  " + document.location.href);
		}

	    }

	    // Return solr_add_to_history back to its default state (true)
	    // in preparation for a fresh query
	    solr_add_to_history = true;
	    
	    var retrieve_store_search_url = window.location.protocol + "//" + window.location.host + window.location.pathname;
	    retrieve_store_search_url += "?solr-key-q="+key;
	    /*
	    var retrieve_store_search_url = ef_accessapi_url
		+ '?action=url-shortener'
		+ '&key='+key;
		// + '&redirect=true'; // ****
		*/

	    //var email_mess = "Generate the query directly in JSON format:\n  " + retrieve_store_search_url;
	    var email_mess = retrieve_store_search_url;

	    // ****
	    /*
	    //console.log("*** store_search_url = " + store_search_url);
	    // //var escaped_store_search_url = store_search_url.replace(/\"/g,'&amp;quot;');
	    // var escaped_store_search_url = store_search_url.replace(/\"/g,'&quot;').replace(/ /g,'+');
	    // //var escaped_store_search_url = store_search_url.replace('"','\\"');
	    // //var escaped_store_search_url = encodeURI(store_search_url);
	    // console.log("*** escpd_search_url = " + escaped_store_search_url);
	    
	    var data_a2a = "";
	    data_a2a += 'data-a2a-url="'+email_mess+'"';
	    data_a2a += ' data-a2a-title="HathiTrust Research Center (HTRC) Extracted Feature Search"';
	    
	    var a2a_html = "";
	    a2a_html += '<div class="no-user-select" style="float:right;">\n';
	    a2a_html += '  <div class="a2a_kit a2a_kit_size_32 a2a_default_style"' + data_a2a + '>\n';
	    a2a_html += '    <a class="a2a_button_email"></a>\n';
	    a2a_html += '    <a class="a2a_button_facebook"></a>\n';
	    //a2a_html += '    <a class="a2a_button_google_plus"></a>\n';
	    //a2a_html += '  <a class="a2a_button_twitter"></a>\n';
	    a2a_html += '    <a class="a2a_dd" href="https://www.addtoany.com/share"></a>\n';
	    //a2a_html += '  <a class="a2a_dd" href="https://www.addtoany.com/share_save"></a>\n';
	    a2a_html += '  </div>\n';
	    a2a_html += '</div>\n';
	    a2a_html += '\n';
	    a2a_html += '<script type="text/javascript">\n';
	    a2a_html += '  var a2a_config = a2a_config || {};\n';
	    //a2a_html += '  a2a_config.track_links = "googl";\n';
	    a2a_html += '  a2a_config.track_links = "bitly";\n';
	    a2a_html += '  a2a_config.track_links_key = "addtoany|R_cc6a4017b0274d1d86f2397771b70136";\n';
	    
	    a2a_html += '</script>\n';
	    a2a_html += '<script type="text/javascript" async="" src="//static.addtoany.com/menu/page.js"></script>\n';

	    $('#add2any-shortener').html(a2a_html);
	    */
	    
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    //$('.search-in-progress').css("cursor","auto");
	    // $('.facet-search').removeClass("disabled-div");
	    //iprogressbar.cancel();
	    if ((jqXHR.readyState == 0) && (jqXHR.status == 0)) {
		console.warn("Interrupted call converting JSON packaged query string: " + store_raw_q_json_str + " through URL: " + ef_accessapi_url);
	    }
	    else {

		if ((runtime_mode == "dev") || (runtimemode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapi_failed = true;
		    
		    var mess = '<b>Failed to convert JSON packaged query string:';
		    mess += '<div style="margin: 0 0 0 10px"><i>'+store_raw_q_json_str+'</i></div>';
		    mess += 'to Solr query-key form. ';
		    mess += 'Unable to access URL: ';
		    mess += '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +'</div>';
		    mess += 'Unable to retain query in browser history</b>';
		    
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to convert query string to Solr query-key form",
					       jqXHR,textStatus,errorThrown);
		}
	    }
	}
    });
	
    }	
}

function filter_fq_args(filters)
{
    var fq_args = [];
    
    for (var filter_key_pair in filters) {
	var fkp_split = filters[filter_key_pair].split("--");
	var filter_field = fkp_split[0];
	var filter_term = fkp_split[1];
	filter_term = escape_solr_query(filter_term);
	
	var or_terms = filter_term.split(" OR ");
	var quoted_or_terms = or_terms.map(function(v) { return '"'+v+'"'; });
	var quoted_or_terms_str = quoted_or_terms.join(" OR ");
	
	fq_args.push(filter_field + ':(' + quoted_or_terms_str + ')');
    }

    return fq_args;
    
}

// ****
// 'store_search_url' no longer used in function as a result of the decision to subpress the add2any feature
// => no need to have the direct URL the initiates the query that has been performed
function show_results_explain_html(query_level_mix,store_search_url)
{
    
    var explain_html = "<hr /><p>Search explanation: " + query_level_mix;
    if (explain_search.group_by_vol != null) {
	explain_html += "<br /> THEN " + explain_search.group_by_vol;
    }
    
    explain_html += '<br />\n';

    explain_html += '<span id="add2any-shortener"></span>';
    // explain_html += add2any_html(store_search_url); // ****

    var raw_query = '<span id="raw-q-base">' + store_search_args.q + '</span>';
    var fq_args = filter_fq_args(facet_filter.filters);
    if (fq_args.length>0) {
	//raw_query += '<hr title="facet filters below" style="height: 5px; padding: 0px 50px 0px 50px;"/>';
	raw_query += '<br /><span class="no-user-select">Facet filters:</span>';
	raw_query += '<span id="raw-q-facets"> AND (' + fq_args.join(" AND ") + ')</span>';
    }
    if (store_search_not_ids.length>0) {
	raw_query += '<br /><span class="no-user-select">Excluded IDs:</span>';
	raw_query += '<span id="raw-q-exclude">' + store_search_not_ids.join(" ") + '</span>';
    }
    
    explain_html += '<div style="float:left;">\n';
    explain_html += '  <button id="show-hide-solr-q">Show full query ...</button>\n';

    explain_html += '  <div id="show-hide-solr-q-raw" class="show-hide-solr-q" style="display:none; padding: 5px; width: 650px;">' + raw_query + '</div>\n';
    explain_html += '  <div class="show-hide-solr-q" style="display:none;">\n';
    explain_html += '    <a id="show-hide-solr-q-paste">Paste as Advanced Query<span class="ui-icon ui-icon-arrowthick-1-e"></span></a>\n';
    explain_html += '  </div>\n';
    explain_html += "</div>\n";
    explain_html += "</p>\n";

    explain_html += '<p style="clear:both"></p>\n';

    return explain_html;
}

