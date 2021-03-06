//"use strict";

/*
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
	sURLVariables = sPageURL.split('&'),
	sParameterName,
	i;

    for (i = 0; i < sURLVariables.length; i++) {
	sParameterName = sURLVariables[i].split('=');

	if (sParameterName[0] === sParam) {
	    return sParameterName[1] === undefined ? true : sParameterName[1];
	}
    }
};

*/

/*
function getURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i=0; i<sURLVariables.length; i++) {
	var sParameterName = sURLVariables[i].split('=');
	if (sParameterName[0] == sParam) {
	    return sParameterName[1];
	}
    }

    return null;
}

*/


function newWindowSolrEF(workset_id)
{
    var load_workset_url = window.location.pathname + "?workset-id=" + workset_id;    
    var win = window.open(load_workset_url, '_blank');
    if (win) {
	// => Browser has allowed it to be opened
	win.focus();
    }
    else {
	// => Browser has blocked it
	alert('New window/tab request blocked by browser.\nPlease enable popups for this website');
    }
    
}

function parse_workset_results(jsonData)
{
    //console.log("*** parse workset results()");
    
    // ajax call has returned successfully
    store_search_xhr = null;

    iprogressbar.cancel();

    //console.log("jsonData = " + JSON.stringify(jsonData));
    
    // $('.search-in-progress').css("cursor","auto");
    // $('.facet-search').removeClass("disabled-div");
    
    initialize_new_solr_search();

    doc_unit  = " volume ";
    doc_units = " volumes ";

    // work out arg_q
    var gathers = jsonData.gathers;
    var gathers_len = gathers.length;

    if (gathers_len>1000) { // ****
	console.log("Workset size of " + gathers_len + " exceeds limit of 1000");
	console.log("Applying cap of 1000 items for Boolean term query by Volume IDs");
	gathers_len = 1000;
    }
    
    var q_terms = [];
    
    for (var i=0; i<gathers_len; i++) {
	var item = gathers[i];
	var id = item.id;

	id = id.replace(/^https?:\/\/hdl.handle.net\/\d+\//,"")	
	//var escaped_id = id.replace(/\//g,"\\/").replace(/:/g,"\\:");
	var escaped_id = escape_solr_query(id);
	
	q_terms.push("id:" + escaped_id);
    }
    var arg_q = q_terms.join(" OR ");
    
    var arg_start = 0;
    var group_by_vol_checked = false;

    initiate_new_solr_search(arg_q,arg_start,group_by_vol_checked);
}

function load_workset_id_old_api(workset_id)
{
    var workset_items_url = workset_base_url + "getItems";
    var data_str = "id=" + workset_id;

    store_search_xhr = new window.XMLHttpRequest();

    console.log("worket items url = " + workset_items_url + "?" + data_str);
    iprogressbar.trigger_delayed_display(3,"Retrieving workset");
    
    $.ajax({
	type: "GET",
	async: true,
	//timeout: 60000,
	cache: false,
	headers: { "cache-control": "no-cache" },
	url: workset_items_url,
	data: data_str,
	dataType: "json",
	xhr: function() {
	    return store_search_xhr;
	},
	success: function(jsonData) { parse_workset_results(jsonData); },
	error: function(jqXHR, textStatus, errorThrown) {
	    $('.search-in-progress').css("cursor","auto");
	    $('.facet-search').removeClass("disabled-div");
	    iprogressbar.cancel();
	    if ((jqXHR.readyState == 0) && (jqXHR.status == 0)) {
		console.warn("Interrupted call when loading Workset ID from URL: " + workset_items_url);
	    }
	    else {
		var mess = '<b>Loading Workset ID failed to access URL:';
		mess += '<div style="margin: 0 0 0 10px">' + workset_items_url +'</div></b>';
		
		ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	    }
	}
    });
}

function load_workset_id(workset_id_url)
{
    // Example workset id API call:
    //  https://worksets.hathitrust.org/api/worksets/https://worksets.hathitrust.org/wsid/e8e90b30-b700-11e8-bd63-2587a66f96d9

    var workset_items_url = worksets_api_url + "/" + workset_id_url;
    
    store_search_xhr = new window.XMLHttpRequest();

    console.log("worket items url = " + workset_items_url);
    iprogressbar.trigger_delayed_display(3,"Retrieving workset");
    
    $.ajax({
	type: "GET", 
	async: true,
	//timeout: 60000,
	cache: false,
	// worksets-api does not appear to set mime-type, so XML presumed
	//   https://stackoverflow.com/questions/7642202/xml-parsing-error-not-well-formed-in-firefox-but-good-in-chrome
	// in Firefox this leads to an error message in the JS console
	// The following is a workaround
	beforeSend: function(xhr){  xhr.overrideMimeType( "text/plain; charset=x-user-defined" );},
	headers: { "cache-control": "no-cache" },
	url: workset_items_url,
	dataType: "json",
	xhr: function() {
	    return store_search_xhr;
	},
	success: function(jsonData) { parse_workset_results(jsonData); },
	error: function(jqXHR, textStatus, errorThrown) {
	    $('.search-in-progress').css("cursor","auto");
	    $('.facet-search').removeClass("disabled-div");
	    iprogressbar.cancel();
	    if ((jqXHR.readyState == 0) && (jqXHR.status == 0)) {
		console.warn("Interrupted call when loading Workset ID from URL: " + workset_items_url);
	    }
	    else {

		var mess = '<b>Loading Workset ID failed to access URL:';
		mess += '<div style="margin: 0 0 0 10px">' + workset_items_url +'</div></b>';
		
		ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	    }
	}
    });    
}

function add_worksets_sparql_old_api(json_data)
{
    if (json_data.hasOwnProperty('@graph')) {
	$.each(json_data["@graph"], function (ws_index, ws_val) {
	    var workset_id = ws_val["@id"];	    
	    var workset_title = ws_val["http://purl.org/dc/terms/title"][0]["@value"];
	    
	    // http://acbres224.ischool.illinois.edu:8890/sparql?query=describe <http://worksets.hathitrust.org/wsid/189324112>&format=text/x-html+ul
	    // http://acbres224.ischool.illinois.edu:8890/sparql?query=describe+%3Chttp%3A%2F%2Fworksets.hathitrust.org%2Fwsid%2F189324112%3E&format=text%2Fx-html%2Bul
	    
	    //var describe_url = "http://acbres224.ischool.illinois.edu:8890/sparql?query=describe+<" +
	    //    workset_id + ">&format=text%2Fx-html%2Bul";
	    
	    // http://acbres224.ischool.illinois.edu:8080/dcWSfetch/getWsDescripWithVolMeta?id=http://worksets.hathitrust.org/wsid/147967316
	    //var describe_url = "http://acbres224.ischool.illinois.edu:8080/dcWSfetch/getWsDescripWithVolMeta?id=" + workset_id;
	    //var describe_url = "https://solr1.ischool.illinois.edu/dcWSfetch/getWsDescripWithVolMeta?id=" + workset_id;
	    var describe_url = workset_base_url + "getWsDescripWithVolMeta?id=" + workset_id;
	    
	    //var hyperlinked_workset_title = '<a target="_blank" href="' + describe_url + '">' + workset_title + '</a>';
	    var hyperlinked_workset_title = '<a onclick="newWindowSolrEF(\'' + workset_id + '\')">' + workset_title + '</a>';
	    
	    var gathers = ws_val["http://www.europeana.eu/schemas/edm/gathers"]
	    
	    $.each(gathers, function (gather_index, gather_val) {
		var item_url = gather_val["@id"];
		
		$("[name='" + item_url + "']").each(function () {
		    $(this).parent().show();
		    if ($(this).children().size() >= 1) {
			$(this).append("; ");
		    }
		    
		    $(this).append("<span>" + hyperlinked_workset_title + "</span>")
		});
	    });
	});
    }
    else {
	console.log("Empty workset list returned");
    }
}


function add_worksets(json_data)
{
    if (json_data.hasOwnProperty('graph')) {
	$.each(json_data["graph"], function (vid_index, vid_val) {
	    var vol_id_url = vid_val["id"];
	    //console.log("vol id url = " + vol_id_url); // ****

	    $.each(vid_val["gatheredInto"], function (ws_index, ws_val) {
		var workset_id = (typeof ws_val == "string") ? ws_val : ws_val["id"];
		//console.log("*** workset id = " + workset_id); // ****
		var workset_title = worksets_public_lookup[workset_id];
		// console.log("*** workset title = " + workset_title); // ****

		var hyperlinked_workset_title = '<a onclick="newWindowSolrEF(\'' + workset_id + '\')">' + workset_title + '</a>';
	    
		$("[name='" + vol_id_url + "']").each(function () {
		    $(this).parent().show();
		    if ($(this).children().size() >= 1) {
			$(this).append("; ");
		    }
		    
		    $(this).append("<span>" + hyperlinked_workset_title + "</span>")
		});
	    });	    			
	});
    }
    else {
	console.log("Empty workset list returned");
    }
}



function workset_enrich_results(itemURLs)
{
    if (runtime_mode != "dev") {
	console.log("Not in Dev mode: Supressing workset results");
	return;
    }
    
    // prefix dcterms: <http://purl.org/dc/terms/>
    // prefix edm: <http://www.europeana.eu/schemas/edm/>
    // prefix htrc: <http://wcsa.htrc.illinois.edu/>
    // prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    // prefix xsd: <http://www.w3.org/2001/XMLSchema#>
    
    // CONSTRUCT {
    // 	    ?wsid
    // 	rdf:type htrc:Workset ;
    // 	dcterms:title ?title ;
    // 	dcterms:creator ?cre ;
    // 	dcterms:created ?dat ;
    // 	edm:gathers ?gar.}
    
    // where {
    // 	    ?wsid
    // 	rdf:type htrc:Workset ;
    // 	dcterms:title ?title ;
    // 	dcterms:creator ?cre ;
    // 	dcterms:created ?dat ;
    // 	edm:gathers ?gar
    
    // 	FILTER ( ?gar  = <http://hdl.handle.net/2027/uc2.ark:/13960/t4fn12212> || ?gar = <http://hdl.handle.net/2027/uva.x030825627> )
    // 	       }

    var item_urls_len = itemURLs.length;
    if (item_urls_len == 0) {
	console.log("No items to cross-check for membership in workset(s)");
	return;
    }

    var prefixes = "";
    prefixes += "prefix dcterms: <http://purl.org/dc/terms/>\n";
    prefixes += "prefix edm: <http://www.europeana.eu/schemas/edm/>\n";
    prefixes += "prefix htrc: <http://wcsa.htrc.illinois.edu/>\n";
    prefixes += "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n";
    prefixes += "prefix xsd: <http://www.w3.org/2001/XMLSchema#>\n";
    
    var graph_body = "";
    graph_body += " ?wsid\n";
    graph_body += "   rdf:type htrc:Workset ;\n";
    graph_body += "   dcterms:title ?title ;\n";
    graph_body += "   dcterms:creator ?cre ;\n";
    graph_body += "   dcterms:created ?dat ;\n";
    graph_body += "   edm:gathers ?gar .\n";
    
    var filter_array = [];
    
    for (var hi = 0; hi < item_urls_len; hi++) {
	var htid = itemURLs[hi];
	filter_array.push("?gar = " + "<" + htid + ">");
    }
    var filter = " FILTER ( " + filter_array.join(" || ") + " ) ";
    
    var construct = "CONSTRUCT {\n" + graph_body + "}\n";
    var where = "WHERE {\n" + graph_body + filter + "}\n";
    
    var sparql_query = prefixes + construct + where;
    //console.log("*** sparql query = " + sparql_query);
    
    // http://acbres224.ischool.illinois.edu:8890/sparql?default-graph-uri=&query
    // &format=application/x-json+ld&timeout=0&debug=on
    
    //var sparql_url = "http://acbres224.ischool.illinois.edu:8890/sparql";
    //var sparql_url = "https://solr1.htrc.illinois.edu/triple-store/sparql";

    var sparql_data = {
	"default-graph-uri": "",
	"format": "application/x-json+ld",
	"timeout": 0,
	"debug": "on"
    };
    sparql_data.query = sparql_query;
    
//    $.ajax({
//	type: "POST",
//	url: sparql_url,
//	data: sparql_data,
//	dataType: "jsonp",
//	jsonpCallback: "add_worksets"
//    });


    var worksets_api_data = "contains_vol=";

    for (var hi = 0; hi < item_urls_len; hi++) {
	if (hi>0) { worksets_api_data += ",";}
	worksets_api_data += itemURLs[hi];
    }

    $.ajax({
	type: "GET", 
	async: true,
	//timeout: 60000,
	cache: false,
	// worksets-api  does not appear to set mime-type, so XML presumed by browser even though plain text returned
	//   https://stackoverflow.com/questions/7642202/xml-parsing-error-not-well-formed-in-firefox-but-good-in-chrome
	// In Firefox this leads to an XML parsing error message in the JS console
	// The following is a workaround
	beforeSend: function(xhr){  xhr.overrideMimeType( "text/plain; charset=x-user-defined" );},
	headers: { "cache-control": "no-cache" },
	url: worksets_api_url,
	data: worksets_api_data,
	dataType: "json",
	success: function(jsonData) { add_worksets(jsonData); }
    });

}
