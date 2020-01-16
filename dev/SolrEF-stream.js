//"use strict";

var store_open_web_sockets = {};

function get_solr_stream_search_clause(arg_q)
{
    //	search(faceted-htrc-full-ef20,qt="/export",q="volumetitle_txt:Sherlock AND en_NOUN_htrctokentext:Holmes",
    //	       indent="on",wt="json",sort="id asc",fl="volumeid_s,id",start="0",rows="200")
    var escaped_arg_q = arg_q.replace(/,/g,"\\,").replace(/\'/g,"\\'");
    //var escaped_arg_q = escape_solr_query(arg_q);
    
    var vol_count_args = {
	qt: "/export",
	q: escaped_arg_q,
	sort: "id asc",
	fl: "volumeid_s,id",
	indent: "off",
	wt: "json"
    };


    var search_stream_args = [];

    for (var ka in vol_count_args) {
	var ka_arg = vol_count_args[ka];

	if (ka == "q") {
	    if (store_search_not_ids.length>0) {
		
		ka_arg += " AND ( *:* " + store_search_not_ids.map(function(str){return str.replace(/^-/,"NOT ")}).join(" ") + " )";
	    }
	}

	search_stream_args.push(ka + '="' + ka_arg + '"');
    }

    search_stream_args = facet_filter.solrSearchAppendArgs(search_stream_args);
        
    var search_stream_args_str = search_stream_args.join(",");

    var search_stream_clause ="search("+solr_collection+","+search_stream_args_str+")";
    
    return search_stream_clause;
}

function get_solr_stream_search_data_str(arg_q)
{
    var clause = get_solr_stream_search_clause(arg_q);
    return "expr=" + clause;
}



function get_solr_stream_data_str(arg_q,doRollup)
{
    //rollup(
    //	search(faceted-htrc-full-ef20,qt="/export",q="volumetitle_txt:Sherlock AND en_NOUN_htrctokentext:Holmes",
    //	       indent="on",wt="json",sort="id asc",fl="volumeid_s,id",start="0",rows="200"),
    //	over="volumeid_s",
    //	count(*)
    //)
    
    var search_stream = get_solr_stream_search_clause(arg_q);

    var rollup_stream ='rollup('+search_stream+',over="volumeid_s",count(*))'

    var data_str;
    if (doRollup) {
	data_str = "expr=" + rollup_stream ;
    }
    else {
	data_str = "expr=" + search_stream;
    }
    
    return data_str;
}

    
function ajax_solr_stream_volume_count(arg_q,doRollup,callback)
{        
    var data_str = get_solr_stream_data_str(arg_q,doRollup);

    //console.log("***## data str = " + data_str);
    //console.log("***## Away to call solr stream to count");
    
    $.ajax({
	type: "POST",
	async: true,
	headers: { "cache-control": "no-cache" },
	url: solr_stream_action,
	data: data_str,
	dataType: "json",
	success: callback,
	// ****
	// Safari appears to react differently when a valid ajax request is interruped with a browser load action
	// Curtailed URL request could be returning the empty string that Safari treats as an error, even though response status is 200
	// Another StackOverflow article discussed that because the data returned isn't valid JSON, this causes an parsing error when
	//   it try to turn it into an object
	// ****
	//success: function(jsonData) { console.log("vol count success"); return callback(jsonData) },
	//dataType: "text",
	//success: function(jsonData) { console.log("vol count success"); return callback(JSON.parse(jsonData)); },
	    
	//dataType: "text",
	/*
	success: function(textData) {
	    console.log("**** stream count textDdata = " + textData);
	    try {
		var jsonData = JSON.parse(textData);
		callback(jsonData)
	    }
	    catch(err) {
		var mess = "ajax_solr_stream_volume_count() encountered an error/interruption when retreiving volume count from URL\n";
		mess +=  "    " + solr_stream_action;
		mess += "  ajax.success() was called but did not receive valid JSON data.\n";
		mess += "  This can occur when, for example, a new page is loaded into the browser before the volume count has returned";

		console.error(mess);
	    }
	},*/
	error: function(jqXHR, textStatus, errorThrown) {
	    //var mess = "<b>Failed to retreive volume count when accessing URL: ";
	    //mess +=  '<div style="margin: 0 0 0 10px">' + solr_stream_action +'</div></b>';
	    //ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	    if ((jqXHR.readyState == 0) && (jqXHR.status == 0)) {
		var mess = "ajax_solr_stream_volume_count() encountered an error/interruption (status=0) when retreiving volume count from URL\n";
		mess +=  "    " + solr_stream_action;
		//mess += "  ajax.success() was called but did not receive valid JSON data.\n";
		mess += "  This can occur when, for example, a new page is loaded into the browser before the volume count has returned";

		console.warn(mess);
	    }
	    else {
		var mess = "Failed to retreive volume count when accessing URL: ";
		mess +=  "    " + solr_stream_action;
		ajax_message_error_console(mess,jqXHR,textStatus,errorThrown);
	    }
	}
    });

    
}

function stream_get_ids(jsonData) {
    var response = jsonData["result-set"];
    
    var docs = response.docs;
    var num_docs = docs.length;

    num_docs--; // last entry provides response time data

    var ids = [];
    
    for (var i=0; i<num_docs; i++) {
	var doc = docs[i];
	var id = doc['id'] || doc['volumeid_s'] ;
	
	ids.push(id);
    }

    return ids;
}

function stream_export(jsonData)
{
    var ids = stream_get_ids(jsonData);
    $('.export-item').css("cursor","auto");

    var ids_line_by_line = ids.join("\r\n"); // Notepad friendly, other more fancy text editors typically auto detect
    
    var output_filename = "htrc-export";

    if ((ids.length>0) && (ids[0].match(/\.page-\d+$/))) {
	output_filename += "-pages";
    }

    var solr_key_q = getURLParameter("solr-key-q");
    if (solr_key_q) {
	output_filename += "-"+solr_key_q;
    }
    
    output_filename += ".txt";

    //download(JSON.stringify(ids), "htrc-export.json", "text/plain");     // ****
    download(ids_line_by_line, output_filename, "text/plain");    
}

function stream_export_ef_key(key,ids,output_format,only_metadata)
{
    var output_filename_root;

    var solr_key_q = getURLParameter("solr-key-q");
    if (solr_key_q != null) {
	if (output_format == "zip") {
	    output_filename_root="htrc-ef-export";
	}
	else {
	    output_filename_root="htrc-metadata-export";
	}

	output_filename_root += "-"+solr_key_q;
    }
    
    var url = ef_accessapi_url + '?action=download-ids&key='+key + "&output="+output_format;;
    var ws_url = ws_accessapi_url + '?action=download-ids&key='+key + "&output="+output_format;;

    if (output_filename_root) {
	url += "&output-filename-root="+output_filename_root;
	ws_url += "&output-filename-root="+output_filename_root;
    }
    
    if (solref_verbosity >= 2) {
	console.log("SolrEF-Stream::stream_export_ef(): download url = " + url);
    }
    
    $('.export-item').css("cursor","auto");
    
    if (ids.length>export_ef_limit) {
	var alert_mess = "Exporting Extracted Features is currently in development.<br />";
	alert_mess += "Currently only the first "
	    + export_ef_limit + " JSON files in the search list are exported. <br />";

	alert_mess += "Do you want to continue?";
	
	htrc_confirm(alert_mess, 
    
 function() {
    // only_metadata, output_format,
    // runtime_mode (global?)
    // url, ws_url
    // store_open_web_sockets (global?)
    
    var href_id = (only_metadata) ? "export-ef-metadata-" : "export-ef-";
    href_id += output_format;
    
    //var div_id = href_id + "-div";
    var prog_id = href_id + "-prog";
    var prog_numeric_id = href_id + "-prog-numeric";

    if ((runtime_mode != "dev") || (window.location.hostname == "solr2.htrc.illinois.edu")) {	
	$('#'+href_id).attr('href',url);
	// Trigger click with W3C version, as jquery trigger("click") reported to not work when an 'href
	//   https://stackoverflow.com/questions/7999806/jquery-how-to-trigger-click-event-on-href-element
	//$('#'+href_id).trigger("click");
	$('#'+href_id)[0].click();
	
	//window.location.href = url;// **** (more basic alternative)
    }
    else {
	var ws = new WebSocket(ws_url);
	
	// **** use solr-key not ids->key shorten
	// give download name for TXT ids
	
	// *** !!! server code is a bit convoluted for download, getting a BZ which is uncompresses in the cache
	// to then only compress it when it writes it out to file (if it does not exist on the system) ...
	// ... so File reference can be returned (which in outputVolumes is then decompressed!!)
	// *** !!! reading bz file done 1 val at a time!!!
	
	var progress_displayed = false;
	
	ws.onopen = function() {
	    console.log("Successfully opened WebSocket connection to: " + ws_url);
	    store_open_web_sockets[href_id] = ws;
	    
	    $prog_div = $('<div>').attr("id",prog_id).attr("style","display:none;")
		.html("Preparing "+output_format.toUpperCase()+" Download:");

	    // Preparing Download: <span id="export-ef-progress" class="export-item">0.00%</span>
	    var $prog_numeric = $('<span>').attr("id",prog_numeric_id).attr("class","export-item").html("0.00%");
	    
	    $prog_div.append($prog_numeric);
	    $('#export-ef-progress-div').append($prog_div);
	    
	    ws.send("start-download");
	};

	ws.stopdownload = function () {
	    console.log("*** ws.stopdownload() called, away to send stop-download command/action");
	    ws.send("stop-download");
	};
	
	ws.onmessage = function (evt) {
	    try {
		var json_mess = JSON.parse(evt.data);
		
		if (json_mess.status != 200) {
		    console.error("WebSocket Error occurred on the server processing 'start-download'");
		    console.error(evt.data);
		}
		else {
		    // Assume OK
		    if (json_mess.action == "progress") {
			var percentage = json_mess.percentage;
			if (!progress_displayed && (percentage>0 && percentage<100)) {
			    progress_displayed = true;
			    $('#'+prog_id).show();
			    $('#'+href_id).addClass("disabled-div");
			    $('#export-ef-progress-div').show();
			}
			var percentage_formatted = json_mess["percentage-formatted"];
			$('#'+prog_numeric_id).html(percentage_formatted + "%");
			
			//console.log("Export/Download WebSocket progress: " + percentage_rounded + "%");
		    }
		    else if (json_mess.action == "download-complete") {
			console.log("Export/Download WebSocket download complete");				
			ws.close();
			
			console.log("Initiating browser download");
			$('#'+href_id).attr('href',url);
			$('#'+href_id)[0].click();
		    }
		    
		    else {			
			console.log("Export/Download WebSocket received message: " + evt.data);
		    }
		}
	    }
	    catch(error) {
		console.error("WebSocket onmessage() response not valid JSON syntax: " + evt.data);
	    }
	};
	
	ws.onclose = function() {
	    console.log("WebSocket.onclose(), ws = ..." );
	    console.log(ws);
	    
	    $('#'+prog_id).remove();
	    if (progress_displayed) {
		progress_displayed = false;
		$('#'+href_id).removeClass("disabled-div");
	    }
	    
	    if ($('#export-ef-progress-div').children().length  == 0) {
		// No other preparing for downloads being displayed
		$('#export-ef-progress-div').hide();
	    }
	    console.log("Export/Download WebSocket closed");

	    delete store_open_web_sockets[href_id];
	};
	
	ws.onerror = function(err) {
	    alert("A WebSocket error occurred preventing the download preparation process to successfully complete.  Please try again"); // **** // change to htrc_alert?
	    if ($('#'+prog_id).length>0) {
		$('#'+prog_id).remove();
	    }

	    delete store_open_web_sockets[href_id];
	};
    }
 } // end function()
		     , null
		    ); // end htrc_confirm
    } // end if-statement that triggers htrc_confirm
    
}

    
function stream_export_ef(jsonData,output_format,only_metadata)
{
    var ids = stream_get_ids(jsonData);
    var ids_head = ids.length>export_ef_limit ? ids.splice(0,export_ef_limit) : ids;
    
    if (only_metadata) {
	ids_head = ids_head.map(function(v) { return v+"-metadata" });
    }


    var ids_str = ids_head.join(",");

    $.ajax({
	type: "POST",
	async: true,
	//timeout: 60000,
	headers: { "cache-control": "no-cache" },
	url: ef_accessapi_url, 
	data: {
	    'action': 'url-shortener',
	    'value': encodeURI(ids_str)
	},
	dataType: "text",
	success: function(textData) {
	    var key = textData;
	    stream_export_ef_key(key,ids,output_format,only_metadata);
	}
/*	    
	    var url = ef_accessapi_url + '?action=download-ids&key='+key + "&output="+output_format;;
	    var ws_url = ws_accessapi_url + '?action=download-ids&key='+key + "&output="+output_format;;
	    
	    if (solref_verbosity >= 2) {
		console.log("SolrEF-Stream::stream_export_ef(): download url = " + url);
	    }
	    
	    $('.export-item').css("cursor","auto");
	    
	    if (ids.length>export_ef_limit) {
		var alert_mess = "Exporting Extracted Features is currently in development.<br />";
		alert_mess += "Currently only the first "
		    + export_ef_limit + " JSON files in the search list are exported";
		
		htrc_alert(alert_mess);
	    }
	    
	    var href_id = (only_metadata) ? "export-ef-metadata-" : "export-ef-";
	    href_id += output_format;

	    //var div_id = href_id + "-div";
	    var prog_id = href_id + "-prog";
	    var prog_numeric_id = href_id + "-prog-numeric";
	    
	    if ((runtime_mode != "dev") || (window.location.hostname == "solr2.htrc.illinois.edu")) {
		$('#'+href_id).attr('href',url);

		// Trigger click with W3C version, as jquery trigger("click") reported to not work when an 'href
		//   https://stackoverflow.com/questions/7999806/jquery-how-to-trigger-click-event-on-href-element
		//$('#'+href_id).trigger("click");
		$('#'+href_id)[0].click();

		//window.location.href = url;// **** (more basic alternative)
	    }
	    else {
		var ws = new WebSocket(ws_url);

		// **** use solr-key not ids->key shorten
		// give download name for TXT ids
		
		// *** !!! server code is a bit convoluted for download, getting a BZ which is uncompresses in the cache
		// to then only compress it when it writes it out to file (if it does not exist on the system) ...
		// ... so File reference can be returned (which in outputVolumes is then decompressed!!)
		// *** !!! reading bz file done 1 val at a time!!!

		var progress_displayed = false;
		
		ws.onopen = function() {
		    console.log("Successfully opened WebSocket connection to: " + ws_url);
		    $prog_div = $('<div>').attr("id",prog_id).attr("style","display:none;")
			.html("Preparing "+output_format.toUpperCase()+" Download:");

		    // Preparing Download: <span id="export-ef-progress" class="export-item">0.00%</span>
		    var $prog_numeric = $('<span>').attr("id",prog_numeric_id).attr("class","export-item").html("0.00%");
		    
		    $prog_div.append($prog_numeric);
		    $('#export-ef-progress-div').append($prog_div);
		    
		    ws.send("start-download");
		};

		ws.onmessage = function (evt) {
		    try {
			var json_mess = JSON.parse(evt.data);
		    
			if (json_mess.status != 200) {
			    console.error("WebSocket Error occurred on the server processing 'start-download'");
			    console.error(evt.data);
			}
			else {
			    // Assume OK
			    if (json_mess.action == "progress") {
				var percentage = json_mess.percentage;
				if (!progress_displayed && (percentage>0 && percentage<100)) {
				    progress_displayed = true;
				    $('#'+prog_id).show();
				    $('#'+href_id).addClass("disabled-div");
				    $('#export-ef-progress-div').show();
				}
				var percentage_formatted = json_mess["percentage-formatted"];
				$('#'+prog_numeric_id).html(percentage_formatted + "%");
				
				//console.log("Export/Download WebSocket progress: " + percentage_rounded + "%");
			    }
			    else if (json_mess.action == "download-complete") {
				console.log("Export/Download WebSocket download complete");				
				ws.close();
				
				console.log("Initiating browser download");
				$('#'+href_id).attr('href',url);
				$('#'+href_id)[0].click();
			    }
			    
			    else {			
				console.log("Export/Download WebSocket received message: " + evt.data);
			    }
			}
		    }
		    catch(error) {
			console.error("WebSocket onmessage() response not valid JSON syntax: " + evt.data);
		    }
		};
		
		ws.onclose = function() {
		    $('#'+prog_id).remove();
		    if (progress_displayed) {
			progress_displayed = false;
			$('#'+href_id).removeClass("disabled-div");
		    }
		    
		    if ($('#export-ef-progress-div').children().length  == 0) {
			// No other preparing for downloads being displayed
			$('#export-ef-progress-div').hide();
		    }
		    console.log("Export/Download WebSocket closed");
		};
		
		ws.onerror = function(err) {
		    alert("Error: " + err); // **** // change to htrc_alert?
		    if ($('#'+prog_id).length>0) {
			$('#'+prog_id).remove();
		    }
		};
		
	    }
	}
*/
    });
}

function stream_export_ef_zip(jsonData)
{
    stream_export_ef(jsonData,"zip");
}

function stream_export_ef_metadata_json(jsonData)
{
    stream_export_ef(jsonData,"json",true); // only_metadata = true
}

function stream_export_ef_metadata_csv(jsonData)
{
    stream_export_ef(jsonData,"csv",true); // only_metadata = true
}

function stream_export_ef_metadata_tsv(jsonData)
{
    stream_export_ef(jsonData,"tsv",true); // only_metadata = true
}
