
var solr_prefix_url = "http://solr1.ischool.illinois.edu/solr/";
var solr_collection = "faceted-htrc-full-ef20";

var solr_search_action = solr_prefix_url+solr_collection+"/select";
var solr_stream_action = solr_prefix_url+solr_collection+"/stream";

var ef_download_url = "http://solr1.ischool.illinois.edu:8080/get";

var num_found_page_limit_str = "700,000";
var num_found_vol_limit_str  = "100,000";
var num_found_page_limit = num_found_page_limit_str.replace(/,/g,"");
var num_found_vol_limit  = num_found_vol_limit_str.replace(/,/g,"");

var num_results_per_page = 15;

var store_result_page_starts = [];

var filters = [];
var facet = ['genre_ss', 'language_s', 'rightsAttributes_s', 'names_ss', 'pubPlace_s', 'bibliographicFormat_s'];
var facet_display_name = {'genre_ss':'Genre', 'language_s': 'Language', 'rightsAttributes_s': 'Copyright Status',
			  'names_ss': 'Author', 'pubPlace_s': 'Place of Publication',
			  'bibliographicFormat_s': 'Original Format'};

// Global variable show_facet to control if faceting is used.
var show_facet = 0;
var facet_level = null;

var explain_search = { 'group_by_vol': null,
		       'volume_level_terms': null, 'volume_level_desc': null,
		       'page_level_terms': null, 'page_level_desc': null };

$(document).ready(function(){
    
    $('#search-form').attr("action",solr_search_action);
    
    $( "#htrc-alert-dialog" ).dialog({
	modal: true,
	autoOpen: false,
	resizable: true,
	buttons: {
	    "OK": function() {
		$( this ).dialog( "close" );
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });
    
    $("#volume-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 790,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });

    var vol_md_keys = [];
    for (var key in volume_metadata_fields) {
	vol_md_keys.push(key);
    }
    var vol_md_keys_str = vol_md_keys.sort().join(", ");
    $('#volume-help-fields').html(vol_md_keys_str);
    

    $("#volume-help").click(function () {
	$("#volume-help-dialog").dialog( "open" );
    });

    
    $("#page-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 790,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });
    
    $("#page-help").click(function () {
	$("#page-help-dialog").dialog( "open" );
    });

    
    $( "#search-lm-progressbar-bot" ).progressbar({ value: 0 });


    $('#srt-vol-export').click(function (event) {
	event.preventDefault();
	$('.export-item').css("cursor","wait");
	if (facet_level == "page") {
	    ajax_solr_stream_volume_count(store_search_args.q,true,stream_export); // doRollup=true
	}
	else {
	    ajax_solr_stream_volume_count(store_search_args.q,false,stream_export); // doRollup=false
	}
    });

    $('#srt-page-export').click(function (event) {
	event.preventDefault();	
	$('.export-item').css("cursor","wait");
	ajax_solr_stream_volume_count(store_search_args.q,false,stream_export); // doRollup=false
    });


    $('#srt-ef-export').click(function (event) {
	//console.log("**** ef export link clicked: href = " + $('#srt-ef-export').attr('href'));
	if (!$('#srt-ef-export').attr('href')) {
	    // lazy evaluation, workout out what href should be, and then trigger click once more
	    event.preventDefault();
	    $('.export-item').css("cursor","wait");
	    if (facet_level == "page") {
		ajax_solr_stream_volume_count(store_search_args.q,true,stream_export_ef); // doRollup=true
	    }
	    else {
		ajax_solr_stream_volume_count(store_search_args.q,false,stream_export_ef); // doRollup=false
	    }
	}
    });

    
    $('#search-prev').click(function (event) {
	var start = store_search_args.start;
	var prev_start = store_result_page_starts.pop();
	var diff = prev_start - start;
	
	show_new_results(diff);
    });
    
    $('#search-next').click(function (event) {
	store_result_page_starts.push(store_start);
	show_new_results(store_num_pages); // used to be num_results_per_page
    });

});

function htrc_alert(message)
{
    $('#htrc-alert-body').html(message)
    $("#htrc-alert-dialog").dialog( "open" );
}


function lang_pos_toggle(event) {
	var $this = $(this);
	var checked_state = $this.prop("checked");

	var id = $this.attr("id");
	var split_id = id.split("-");
	var related_id = split_id[0] + "-pos-choice";

	var disable_state = !checked_state;
	$('#' + related_id + " *").prop('disabled',disable_state);
}

function ajax_error(jqXHR, textStatus, errorThrown) {
    htrc_alert('ajax_error: An error occurred... Look at the console (F12 or Ctrl+Shift+I, Console tab) for more information!<br />====<br />' + JSON.stringify(jqXHR.responseText.error));

    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

}


function add_titles(json_data) {
	var itemURLs = [];

	$.each(json_data, function (htid_with_prefix, htid_val) {
		var htid = htid_with_prefix.replace(/^htid:/, "");

		$.each(htid_val.records, function (internalid, metadata) {
			var title = metadata.titles[0];
			$("[name='" + htid + "']").each(function () {
				$(this).html(title)
			});
			console.log(htid + ", title = " + metadata.titles[0]);
		});

		$.each(htid_val.items, function (item_index, item_val) {
			if (item_val.htid == htid) {
				var itemURL = item_val.itemURL;
				itemURL = itemURL.replace(/^https:/, "http:");

				var ws_span = '<span class="workset" style="display: none;"><br>[Workset: <span name="' + itemURL + '"></span>]</span>';
				$("[name='" + htid + "']").each(function () {
					$(this).append(ws_span)
				});
				console.log("itemURL = " + itemURL);
				itemURLs.push(itemURL);
			}
		});
	});

	workset_enrich_results(itemURLs);

}

function add_titles_solr(jsonData) {
    var itemURLs = [];
    //console.log("jsonData = " + jsonData);
    
        var response = jsonData.response;
	var docs = response.docs;
	var num_docs = docs.length;

	$.each(docs, function (doc_index, doc_val) {
	    var htid = doc_val.id;

	    var title = doc_val.title_s;
	    
	    var details = [];
	    if (doc_val.typeOfResource_s) {
		details.push("Resource type: " + doc_val.typeOfResource_s);
	    }
	    if (doc_val.names_ss) {
		details.push("Author(s): " + doc_val.names_ss.join(", "));
	    }
	    if (doc_val.pubDate_s) {
		details.push("Publication date: " + doc_val.pubDate_s);
	    }
	    if (doc_val.genre_ss) {
		details.push("Genre: " + doc_val.genre_ss.join(", "));
	    }

	    var details_str = details.join(";\n");	    
	    var $tooltip_title = $('<span />').attr('title',details_str).html(title);
		    
	    //console.log("*** tooltip title = " + $tooltip_title[0].outerHTML);
	    
	    $("[name='" + htid + "']").each(function () {
		var $tooltip_title_clone = $tooltip_title.clone();
		$tooltip_title_clone.tooltip();
		$(this).html($tooltip_title_clone)
	    });
	    console.log(htid + ", title = " + title);

	    var itemURL = doc_val.handleUrl_s;
	    itemURL = itemURL.replace(/^https:/, "http:");

	    var ws_span = '<span class="workset" style="display: none;"><br />';
	    ws_span += '[Workset: <span name="' + itemURL + '"></span>]</span>';
	    
	    $("[name='" + htid + "']").each(function () {
		$(this).append(ws_span)
	    });
	    //console.log("itemURL = " + itemURL);
	    itemURLs.push(itemURL);
	});

	workset_enrich_results(itemURLs);

}


function add_worksets(json_data) {

    if (json_data.hasOwnProperty('@graph')) {
	$.each(json_data["@graph"], function (ws_index, ws_val) {
		var workset_id = ws_val["@id"];
		var workset_title = ws_val["http://purl.org/dc/terms/title"][0]["@value"];

		// http://acbres224.ischool.illinois.edu:8890/sparql?query=describe <http://worksets.hathitrust.org/wsid/189324112>&format=text/x-html+ul
		// http://acbres224.ischool.illinois.edu:8890/sparql?query=describe+%3Chttp%3A%2F%2Fworksets.hathitrust.org%2Fwsid%2F189324112%3E&format=text%2Fx-html%2Bul

		//var describe_url = "http://acbres224.ischool.illinois.edu:8890/sparql?query=describe+<" +
		//    workset_id + ">&format=text%2Fx-html%2Bul";

	        // http://acbres224.ischool.illinois.edu:8080/dcWSfetch/getWsDescripWithVolMeta?id=http://worksets.hathitrust.org/wsid/147967316
	        var describe_url = "http://acbres224.ischool.illinois.edu:8080/dcWSfetch/getWsDescripWithVolMeta?id=" + workset_id;

		var hyperlinked_workset_title = '<a target="_blank" href="' + describe_url + '">' + workset_title + '</a>';

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

function escape_solr_query(query)
{

    var pattern = /([\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\\/\"])/g;
    
    var escaped_query = query.replace(pattern, "\\$1");

    return escaped_query;
}

function ajax_solr_text_search(newResultPage)
{
    var url_args = [];

    for (k in store_search_args) {
	url_args.push(k + '=' + store_search_args[k]);
    }
    
    for (k in facet) {
	var facet_val = facet[k];
	if (facet_level == "page") {
	    facet_val = "volume" + facet_val;
	    facet_val = facet_val.replace(/_ss$/,"_htrcstrings");
	    facet_val = facet_val.replace(/_s$/,"_htrcstring");
	}
	url_args.push('facet.field=' + facet_val);
    }
    
    for (k in filters) {
	var ks = filters[k].split("--");
	var ks0 = ks[0];
	var ks1 = ks[1];
	ks1 = ks1.replace(/\//g,"\\/").replace(/:/g,"\\:");

	url_args.push('fq=' + ks0 + ':("' + ks1 + '")');
    }

    var data_str = url_args.join("&");
    
    store_search_url = store_search_action + "?" + data_str;
    
    $.ajax({
	type: "GET",
	url: store_search_action,
	// async: false, // ****
	data: data_str,
	dataType: "json",
	success: function(jsonData) { show_results(jsonData,newResultPage); },
	error: ajax_error
    });
}

function get_solr_stream_search_clause(arg_q)
{
    //	search(faceted-htrc-full-ef20,qt="/export",q="volumetitle_txt:Sherlock AND en_NOUN_htrctokentext:Holmes",
    //	       indent="on",wt="json",sort="id asc",fl="volumeid_s,id",start="0",rows="200")

    var arg_indent = $('#indent').attr('value');
    var arg_wt = $('#wt').attr('value');

    var vol_count_args = {
	qt: "/export",
	q: arg_q,
	sort: "id asc",
	fl: "volumeid_s,id",
	indent: arg_indent,
	wt: arg_wt
    };


    var search_stream_args = [];

    for (ka in vol_count_args) {
	search_stream_args.push(ka + '="' + vol_count_args[ka] + '"');
    }

    
    for (kf in facet) {
	var facet_val = facet[kf];
	if (facet_level == "page") {
	    facet_val = "volume" + facet_val;
	    facet_val = facet_val.replace(/_ss$/,"_htrcstrings");
	    facet_val = facet_val.replace(/_s$/,"_htrcstring");
	}
	search_stream_args.push('facet.field=' + facet_val);
    }
    
    for (kf in filters) {
	var ks = filters[kf].split("--");
	var ks0 = ks[0];
	var ks1 = ks[1];
	ks1 = ks1.replace(/\//g,"\\/").replace(/:/g,"\\:");

	search_stream_args.push('fq=' + ks0 + ':("' + ks1 + '")');
    }
    
    
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
    
    $.ajax({
	type: "GET",
	url: solr_stream_action,
	data: data_str,
	dataType: "json",
	success: callback,
	error: ajax_error
    });

    
}

function stream_get_ids(jsonData) {
    var response = jsonData["result-set"];
    
    var docs = response.docs;
    var num_docs = docs.length;

    num_docs--; // last entry provides response time data

    var ids = [];
    
    var i;    
    for (i=0; i<num_docs; i++) {
	var doc = docs[i];
	var id = doc['volumeid_s'] || doc['id'];
	
	ids.push(id);
    }

    return ids;
}

function stream_export(jsonData)
{
    var ids = stream_get_ids(jsonData);
    $('.export-item').css("cursor","auto");

    download(JSON.stringify(ids), "htrc-export.json", "text/plain");    
}

function stream_export_ef(jsonData)
{
    var export_ef_limit = 5;
    
    var ids = stream_get_ids(jsonData);
    var ids_head = ids.length>export_ef_limit ? ids.splice(0,export_ef_limit) : ids;
    
    
    var ids_str = ids_head.join(",");

    var url = ef_download_url + '?download-ids='+ids_str;
    //console.log("*** download url = " + url); // ****

    $('.export-item').css("cursor","auto");

    if (ids.length>export_ef_limit) {
	var alert_mess = "Exporting Extracted Features is currently in development.<br />";
	alert_mess += "Currently only the first "
	    + export_ef_limit + " JSON files in the search list are exported";
	
	htrc_alert(alert_mess);
    }

    $('#srt-ef-export').attr('href',url);
    window.location.href = url;    
}


function show_volume_count(jsonData) {
    var response = jsonData["result-set"];
    var docs = response.docs;
    var num_docs = docs.length;

    num_docs--; // last entry provides response time data

    $('#srt-vol-count-computing').hide();
    $('#srt-vol-count').html(" in " + num_docs + " volumes");
    $('#srt-vol-count').show();
    
    if (num_docs < num_found_vol_limit) {
	$('#srt-export').show("slide", { direction: "up" }, 1000);
    }
    else {
	$('#srt-export').hide("slide", { direction: "up" }, 1000);

	$('#srt-vol-count').append(' <span style="color:#BB0000;">[Note: Volume count exceeds limit of '
				   + num_found_vol_limit_str + ' for exporting]</span>');
    }


}


function show_updated_results()
{
    $('.search-in-progress').css("cursor","wait");
    
    ajax_solr_text_search(true); // newResultPage=true
}

function show_new_results(delta) {
    
    var start = parseInt(store_search_args.start)
    
    store_search_args.start = start + parseInt(delta);

    show_updated_results();
}

function generate_item(line_num, id, id_pages, merge_with_previous)
{
    var css_class = (line_num % 2 == 0) ? 'class="evenline"' : 'class="oddline"';
    
    var html_item = "";
    var seq_item  = "";
    
    // <li title="nc01.ark:/13960/t78s5b569" style="color: #924a0b;"><a href="https://data.analytics.hathitrust.org/features/get?download-id=nc01.ark%3A%2F13960%2Ft78s5b569"><span class="icomoon icomoon-download"></span>Download Extracted Features</a></li>
    
    var id_pages_len = id_pages.length;
    
    var download_text = "&nbsp;Download Extracted Features";
    if (id_pages_len==1) {
        if (id_pages[0]>0)  {
	    // single page item working at the page level => clarify download is the complete volume
	    download_text += " (complete volume)";
	}
    }
    else if (id_pages_len>1) {
	// multiple pages in the item => clarify dowload is the complete volume
	download_text += " (complete volume)";
    }
    var download_span = '<div title="'+id+'" style="color: #924a0b;">';
    //download_span +=      '<a download href="https://data.analytics.hathitrust.org/features/get?download-id='+id+'">';
    download_span +=      '<a download href="'+ef_download_url+'?download-id='+id+'">';
    download_span +=        '<span class="ui-icon ui-icon-circle-arrow-s"></span>';
    download_span +=         download_text;
    download_span +=      '</a>';
    download_span +=    '</div>';

    var prev_seq_count = 0;
    
    if (merge_with_previous) {
	// precalculated vals to work out if seq merging needs to generate a 'show/hide' label
	if (line_num > 1) {
	    var seqs_outer_div_id = "#seqs-outer-div-"+(line_num-1);
	    var prev_seqs = $(seqs_outer_div_id).find('> nobr > a.seq');
	    prev_seq_count = prev_seqs.length;
	}
    }
    
    var show_more = false;

    for (var pi = 0; pi < id_pages_len; pi++) {
	var page = id_pages[pi];
	
	var seqnum = (page == 0) ? 1 : page;
	var babel_url = "https://babel.hathitrust.org/cgi/pt?id=" + id + ";view=1up;seq=" + seqnum;
	
	if (id_pages_len > 1) {
	    
	    if (pi == 0) {
		var seqs_outer_div_id = "seqs-outer-div-"+line_num;
		html_item += '<div id="'+seqs_outer_div_id+'" ' + css_class + '>';

		html_item += '<span style="font-style: italic;" name="' + id + '">';
		html_item += '<span style="cursor: progress;">Loading ...</span></span><br />';
		
		if (page > 0) {
		    html_item += id + ': ';

		    //var head_seqs_label = "head-seqs-"+line_num; // ****
		    //seq_item += '<span id="'+head_seq_label'"></span>';
		    seq_item += '<nobr><a class="seq" target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a> ';
		}
		else {
		    // skip linking to the 'phony' page 0
		    html_item += id;
		    seq_item += "<nobr>";
		}
	    }
	    else {
		if (seq_item != "") {
		    seq_item += ',</nobr>';
		}
		
		if (!merge_with_previous && (pi == 3) && (id_pages_len > 3)) {
		    
		    var sid_label = "show-hide-more-seqs-"+line_num;
		    var sid_block = sid_label + "-block";
		    seq_item += ' <a><span id="'+sid_label+'">Show more pages ...</span></a><div id="'+sid_block+'" style="display: none;">';
		    show_more = true;
		}
		seq_item += ' <nobr><a class="seq" target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a> ';
	    }

	    if ((merge_with_previous) && ((prev_seq_count + pi + 1) == 3)) {
		// merge what we have so far for 'seq_item' with previous item
		
		var prev_line_num = line_num-1;
		
		if (prev_seq_count + id_pages_len > 3) {
		    // also need 'show more'
		    var sid_label = "show-hide-more-seqs-"+prev_line_num;
		    var sid_block = sid_label + "-block";
		    seq_item += ',</nobr> <a><span id="'+sid_label+'">Show more pages ...</span></a>';
		    seq_item += '<div id="'+sid_block+'" style="display: none;"></div>';
		}
		
		var ps_label_id = "prepend-seqs-"+prev_line_num;		    
		$('#'+ps_label_id).before(", " + seq_item);
		show_hide_more_seqs(prev_line_num);
		
		// Now move ps_span inside sid_block div
		var $ps_span = $('#'+ps_label_id).detach();
		$('#'+sid_block).append($ps_span);
		
		seq_item = "";
	    }

	}
	else {
	    var seqs_outer_div_id = "seqs-outer-div-"+line_num;
	    html_item += '<div id="'+seqs_outer_div_id+'" ' + css_class + '>';

	    html_item += '<span style="font-style: italic;" name="' + id + '">';
	    html_item += '<span style="cursor: progress;">Loading ...</span></span><br />';
	    
	    if (page > 0) {
		html_item += id + ': ';
		seq_item += '<nobr><a class="seq" target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a>';
	    } else {
		// dealing with 'phony' page => show 'all pages'
		html_item += id + ': ';
		seq_item += '<nobr><a class="seqall" target="_blank" href="' + babel_url + '">all pages</a>';
	    }

	    if (merge_with_previous) {
		html_item = seq_item;
	    }
	    else {
		// leave a span marker where later seq-items that need to merged in can go
		var ps_label = "prepend-seqs-"+line_num;
		seq_item += '</nobr><span id="'+ps_label+'"></span>';

		html_item += seq_item;
		html_item += download_span;
		html_item += '</div>';
	    }
	}
	
    }

	
    if (id_pages_len > 1) {

	seq_item += '</nobr>';
	
	if (!merge_with_previous) {
	    // leave a span marker where later seq-items that need to merged in can go
	    var ps_label = "prepend-seqs-"+line_num;
	    seq_item += '<span id="'+ps_label+'"></span>';
	}

	if (show_more) {
	    seq_item += '</div>'; // closes off the div-block formed for the hidden seqs
	}

	if (merge_with_previous) {
	    html_item = seq_item;
	}
	else {
	    html_item += seq_item;
	    
	    html_item += download_span;
	    html_item += "</div>";
	}
    }
    
    return html_item;
}


function workset_enrich_results(itemURLs) {
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
	var item_urls_len = itemURLs.length;
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

	var sparql_url = "http://acbres224.ischool.illinois.edu:8890/sparql";
	var sparql_data = {
		"default-graph-uri": "",
		"format": "application/x-json+ld",
		"timeout": 0,
		"debug": "on"
	};
	sparql_data.query = sparql_query;

	$.ajax({
		type: "POST",
		url: sparql_url,
		data: sparql_data,
		dataType: "jsonp",
		jsonpCallback: "add_worksets"
	});



}

function pretty_print_facet_value(kv,displayed_item)
{
    if (kv == "rightsAttributes_s") {
	if (displayed_item in rights_dic) {
	    displayed_item = rights_dic[displayed_item];
	}
    }
    if (kv == "bibliographicFormat_s") {
	if (displayed_item in format_dic) {
	    displayed_item = format_dic[displayed_item];
	}
    }
    if (kv == "language_s") {
	if (displayed_item in language_dic) {
	    displayed_item = language_dic[displayed_item];
	}
    }
    if (kv == "pubPlace_s") {
    // fix the place code ending with whitespace
    displayed_item = displayed_item.trim();
	if (displayed_item in place_dic) {
	    displayed_item = place_dic[displayed_item];
	}
    }

    // The following led to the confusing situation that seemingly the same facet value could
    // turn up twice in the list (e.g. because of 'fiction' and 'fiction.')
    //displayed_item = displayed_item.replace(/\.$/,""); // tidy up spurious full-stop at end of string

    return displayed_item;
}

function show_results_explain_html(query_level_mix,store_search_url)
{
    
    var explain_html = "<hr /><p>Search explanation: " + query_level_mix;
    if (explain_search.group_by_vol != null) {
	explain_html += "<br /> THEN " + explain_search.group_by_vol;
    }

    //var a2a_config = a2a_config || {};
    //a2a_config.linkname = "HathiTrust Research Center (HTRC) Extracted Feature Search";
    //var base_url = location.protocol + '//' + location.host + location.pathname;
    // //a2a_config.linkurl = base_url + "?pub-name=" + published_id.replace(/ /g,"+");
    //a2a_config.linkurl = store_search_url;

    explain_html += '<br />\n';

    var data_a2a = "";
    data_a2a += 'data-a2a-url="'+store_search_url+'"';
    data_a2a += ' data-a2a-title="HathiTrust Research Center (HTRC) Extracted Feature Search"';
    
    var a2a_html = "";
    a2a_html += '<div style="float:right;">\n';
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
    a2a_html += '<script type="text/javascript" src="//static.addtoany.com/menu/page.js"></script>\n';

    explain_html += a2a_html;

    explain_html += '<div style="float:left;">\n';
    explain_html += '  <button id="show-hide-solr-q">Show full query ...</button>\n';

    explain_html += '  <div class="show-hide-solr-q" style="display:none; padding: 5px; width: 650px;">' + store_search_args.q + '</div>\n';
    explain_html += "</div>\n";
    explain_html += "</p>\n";

    explain_html += '<p style="clear:both"></p>\n';

    return explain_html;
}

function show_results_facet_html(facet_fields)
{
    var facet_html = "";    
    var _class = '';
    
    for (k in facet_fields) {
	//console.log("**** show results: k = " + k);
	facet_html += "<dl>";
	var kv = k;
	if (facet_level == "page") {
	    kv = kv.replace(/^volume/,"");
	    kv = kv.replace(/_htrcstrings$/,"_ss"); 
	    kv = kv.replace(/_htrcstring$/,"_s"); 
	}
	//console.log("**** kv = " + kv);
	
	facet_html += "<dt class=\"facetField\">" + facet_display_name[kv] + "</dt> ";
	item = facet_fields[k];
	ii = 0;
	for (var j = 0; j <= item.length / 2; j = j + 2) {
	    
	    if (item[j + 1] > 0) {
		if (filters.indexOf(kv + "--" + item[j]) < 0) {
		    _class = "showfacet";
		    if (ii > 5) {
			_class = "hidefacet";
		    }
		    var displayed_item = item[j];
		    var pp_displayed_item = pretty_print_facet_value(kv,item[j]);

		    //if (pp_displayed_item != displayed_item) {
			//var raw_item = "Raw facet: '"+displayed_item+"'";
			//pp_displayed_item = '<span alt="'+raw_item+'" title="'+raw_item+'">'+pp_displayed_item+'</span>';
		    //}
		    
		    facet_html += '<dd class="' + _class + ' ' + kv + '"><a href="javascript:;" data-obj="' + k + '"  data-key="' + item[j] + '">' + pp_displayed_item + '</a><span dir="ltr">&nbsp;(' + item[j + 1] + ') </span></dd>';
		    ii++;
		}
		
	    }
	    
	}
	if (ii > 5) {
	    facet_html += '<dd><a href="" class="' + kv + ' morefacets"><span class="moreless">more...</span></a><a href="" class="' + kv + ' lessfacets" style="display: none;"><span class="moreless">less...</span></a></dd>'
	}
	facet_html += "</dl>";
    }

    return facet_html;
}


var store_start;
var store_num_pages;
var store_line_num;
var store_id;

function show_results(jsonData,newResultPage)
{
    var response = jsonData.response;
    var num_found = response.numFound;
    var docs = response.docs;
    var num_docs = docs.length;


    var search_start = parseInt(store_search_args.start);

    if (newResultPage) {
	// at the top of a new result page to show
	store_start = search_start;
	store_line_num = 1;
	store_id = null;

	if (search_start == 0) {
	    // The very beginning of the search results
	    
	    $('#srt-export').hide(); // hide until volume count is in
	
	    var facet_fields = jsonData.facet_counts.facet_fields;
    
	    var facet_html = show_results_facet_html(facet_fields);
	    if (show_facet == 1) {
		if (facet_level == "page") {
		    $('#facet-units').html(" (page count)");
		}
		else {
		    $('#facet-units').html(" (volume count)");
		}
		
		$(".narrowsearch").show();
		$("#facetlist").html(facet_html);
	    } else if (show_facet == 0){
		$(".narrowsearch").hide();
		facet_html = "";
		$("#facetlist").html(facet_html);
	    }
	}
    }
   
    var volume_level_desc = explain_search.volume_level_desc;
    if (volume_level_desc != null) {
	var volume_level_terms = explain_search.volume_level_terms;
	volume_level_desc = volume_level_desc.replace("TERMS",volume_level_terms);
    }

    var page_level_desc = explain_search.page_level_desc;
    if (page_level_desc != null) {
	var page_level_terms = explain_search.page_level_terms;
	page_level_desc = page_level_desc.replace("TERMS",page_level_terms);
    }

    var query_level_mix = volume_level_desc;
    
    if (query_level_mix != null) {
	if (page_level_desc != null) {
	    query_level_mix += " AND " + page_level_desc; 
	}
    }
    else {
	query_level_mix = page_level_desc;
    }

    if (newResultPage) {
	    
	var explain_html = show_results_explain_html(query_level_mix,store_search_url)
	
	if (num_docs > 0) {

	    if (search_start == 0) {
		// The very beginning of the search results

		$('#search-results-total').show();
		$('#search-results-total-span').html("Results: " + num_found + doc_units + "matched");
		
		if (facet_level == "page") {
		    if (num_found < num_found_page_limit) {
			$('#srt-vol-count-computing').show();
			$('#srt-vol-count').html("");
			$('#srt-vol-count-span').show();
			
			var data_str = get_solr_stream_data_str(store_search_args.q,true) // doRollup=true
			$("#srt-vol-export").show();
			
			var data_str = get_solr_stream_search_data_str(store_search_args.q)
			$("#srt-page-export").show();
			
			ajax_solr_stream_volume_count(store_search_args.q,true,show_volume_count); // doRollup=true
			$("#srt-ef-export").show();
		    }
		    else {
			$('#srt-vol-count-computing').hide();
			$('#srt-vol-count').html('<span style="color:#BB0000;">[Note: Page count exceeds limit of '
						 + num_found_page_limit_str + ' for exporting result set]</span>');
			$('#srt-vol-count').show();
			$('#srt-vol-count-span').show();
		    }
		}		
		else {
		    // volume level
		    if (num_found < num_found_vol_limit) {
			$("#srt-vol-export").show();
			$("#srt-page-export").hide();
			$("#srt-ef-export").show();
			$("#srt-export").show("slide", { direction: "up" }, 1000);
			
			// restore vol-count display back to default text, ready for next vol count computation
			$('#srt-vol-count-computing').show();
			$('#srt-vol-count').hide();
			$('#srt-vol-count-span').hide();
		    }
		    else {
			$('#srt-vol-count-computing').hide();
			$('#srt-vol-count').html('<span style="color:#BB0000;">[Note: Volume count exceeds limit of '
						 + num_found_vol_limit_str + ' for exporting]</span>');
			$('#srt-vol-count').show();
			$('#srt-vol-count-span').show();
		    }		
		}
	    
		$('#search-explain').html(explain_html);
		show_hide_solr_q();
		
		$( "#search-lm-progressbar-top" ).progressbar({ value: 0 });
	    	    
		$('#next-prev').show();
	    }
	    var from = parseInt(store_search_args.start) + 1;
	    var to = from + store_search_args.rows - 1;
	    
	    if (to > num_found) {
		// cap value
		to = num_found;
	    }
	    
	    var showing_matches = "<hr /><p>";
	    showing_matches += (facet_level == "page") ? "Showing page-level matches: " : "Showing volume matches:";
	    
	    showing_matches += '<span id="sm-from">' + from + '</span>';
	    showing_matches += "-";
	    showing_matches += '<span id="sm-to">' + to + '</span>';
	    showing_matches += "</p>";
	    
	    $('#search-showing').html(showing_matches);
	    
	}
	else {
	    // num_docs == 0
	    // restore back to default text, ready for next vol count computation
	    $('#srt-vol-count-computing').show();
	    $('#srt-vol-count').hide();
	    $('#srt-vol-count-span').hide();
	    $('#search-results-total').hide();	    
	    
	    $('#search-explain').html(explain_html);
	    $('#search-showing').html("<p>No pages matched your query</p>");
	    
	    $('#next-prev').hide();
	}
		

    }
    
    var $search_results = $('#search-results');
    if (newResultPage) {
	$search_results.html("");
    }

    $('.search-in-progress').css("cursor","auto");
    if ($('#search-results-page').is(":hidden")) {
	$('#search-results-page').show("slide", { direction: "up" }, 1000);
    }

    // Example form of URL
    //   https://babel.hathitrust.org/cgi/pt?id=hvd.hnnssu;view=1up;seq=11

    var ids = [];
    var htids = [];
    
    var prev_id = null;
    var prev_pages = [];
    var prev_i_boundary = 0;
    
    var i = 0;
    var line_num = store_line_num;

    while ((i < num_docs) && (line_num <= num_results_per_page)) {
	var doc = docs[i];
	var id_and_page = doc.id.split(".page-");
	var id = id_and_page[0];
	
	var seqnum;
	if (id_and_page.length > 1) {
	    seqnum = parseInt(id_and_page[1]) + 1; // fix up ingest error
	} else {
	    seqnum = 0;
	}
	var page = seqnum;
	
	if (group_by_vol_checked) {
	    if ((prev_id != null) && (id != prev_id)) {
		// noticed start of next gropued item
		// => conditions right to output previous item
		var merge_with_previous = (!newResultPage && ((prev_i_boundary == 0) && (prev_id == store_id)));
		var html_item = generate_item(line_num, prev_id, prev_pages, merge_with_previous);
		if (merge_with_previous) {
		    // prepend;
		    var prev_line_num = line_num-1;
		    var ps_label_id = "prepend-seqs-"+prev_line_num;
		    
		    var sid_label = "show-hide-more-seqs-"+prev_line_num;
		    var sid_block = sid_label + "-block";

		    var prev_seqs = $('#'+sid_block).find('> nobr > a.seq');
		    prev_seq_count = prev_seqs.length;

		    if (prev_seq_count==0) {
		    	$('#'+ps_label_id).before(html_item);
		    }
		    else {
			$('#'+ps_label_id).before(", " + html_item);
		    }
		    prev_i_boundary = i;
		}
		else {
		    $search_results.append(html_item);
		    show_hide_more_seqs(line_num);
		    prev_i_boundary = i;
		    line_num++;
		}
		prev_pages = [page];
	    }
	    else {
		// accumulate pages
		prev_pages.push(page)
	    }
	}
	else {
	    
	    if (i>0) {
		// output previous item
		var html_item = generate_item(line_num, prev_id, prev_pages, false);
		$search_results.append(html_item);
		show_hide_more_seqs(line_num);
		prev_i_boundary = i;
		line_num++;
		prev_pages = [page];
	    }
	    else {
		// accumulate pages
		prev_pages.push(page)
	    }
	}
	
	ids.push(id);
	htids.push("htid:" + id);
	
	prev_id = id;
	if (group_by_vol_checked) {
	    store_id = id;
	}
	i++;
    }
    var num_pages = i;
    store_num_pages = num_pages;
    
    if (line_num <= num_results_per_page) {

	if (group_by_vol_checked) {
	    // check if merge operation
	    var merge_with_previous = (!newResultPage && (prev_i_boundary == 0))
	    var html_item = generate_item(line_num, prev_id, prev_pages, merge_with_previous);

	    if (merge_with_previous) {		
	    	var ps_label_id = "prepend-seqs-"+(line_num-1);
		$('#'+ps_label_id).before(", " +html_item);
	    }
	    else {
		// no merge
		$search_results.append(html_item);
		show_hide_more_seqs(line_num);
		store_line_num = line_num +1; // next line position
	    }	    
	}
	else {
	    var html_item = generate_item(line_num, prev_id, prev_pages, false); // merge_with_previous=false
	    $search_results.append(html_item);
	    show_hide_more_seqs(line_num);
	    store_line_num = line_num +1; // next line position
	}
    }

    var progressbar_top = $( "#search-lm-progressbar-top" );
    var progressbar_bot = $( "#search-lm-progressbar-bot" );

    if (newResultPage) {
	document.location.href = "#search-results-anchor";
    }
    
    var search_end = search_start + num_pages;
    
    //console.log("*** search_end < num_found: " + search_end + " < " + num_found);
    if (search_end < num_found) {
	// more results exist
	//console.log("*** line_num < num_results_per_page: " + line_num + " < " + num_results_per_page);
	
	if (line_num < num_results_per_page) {
	    // Some compacting of results has gone on
	    if (newResultPage) {
		$('.search-loading-more').show("slide", { direction: "up" }, 1000);
	    }
	    
	    progressbar_top.progressbar( "value",100 * line_num / num_results_per_page);
	    progressbar_bot.progressbar( "value",100 * line_num / num_results_per_page);

	    store_search_args.start = search_end	    
	    ajax_solr_text_search(false); // newResultPage=false
	}
	else {
	    progressbar_top.progressbar( "value",0);
	    progressbar_bot.progressbar( "value",0);
	    $('.search-loading-more').hide("slide", { direction: "up" }, 1000);
	}
    }
    else {
	// reached end of results before hitting num_results_per_page
	// => hide progressbars
	progressbar_top.progressbar( "value",0);
	progressbar_bot.progressbar( "value",0);
	$('.search-loading-more').hide("slide", { direction: "up" }, 1000);
    }

    /*
    var next_prev = '<p style="width:100%;">';
    next_prev += '<div id="search-prev" style="float: left;">';
    next_prev += '<a>&lt; <span class="ui-icon ui-icon-circle-triangle-w"></span>Previous</a></div>';
    next_prev += '<div id="search-next" style="float: right;">';
    next_prev += '<a>Next<span class="ui-icon ui-icon-circle-triangle-e"></span> &gt;</a></div>';
    next_prev += '</p>';
    
    $('#next-prev').html(next_prev);
    */
    

    // Need to hide prev link?
    if (store_start == 0) { 
	$('#search-prev').hide();
    }
    else {
	$('#search-prev').show();
    }
    
    // Need to hide next link?
    if (search_end >= num_found) {
	$('#search-next').hide();
    }
    else {
	$('#search-next').show();
    }
    
    // Showing matches to ...
    $('#sm-to').html(search_start + num_pages);
    

    // Now setup and invoke ajax call to add title metadta (etc) into result set page

    // This previously used to be done with the HT API:
    //
    // Example URL for catalog metadata (multiple items)
    //   http://catalog.hathitrust.org/api/volumes/brief/json/id:552;lccn:70628581|isbn:0030110408
    
    //var htids_str = htids.join("|", htids);
    //var cat_url = "http://catalog.hathitrust.org/api/volumes/brief/json/" + htids_str;
    //$.ajax({
    //	url: cat_url,
    //	dataType: 'jsonp',
    //	jsonpCallback: "add_titles"
    //});
    

    // => Retrieve from solr volume level metadata to fill out place-holder title information (etc)

    // Example URL for using the Solr-EF collection to retrieve volume id info
    //   http://solr1.ischool.illinois.edu/solr/htrc-full-ef20/select?q=(id:mdp.39015071574472)&indent=on&wt=json&start=0&rows=200

    //var ids_escaped = ids.map(function(id){return "(id:"+id.replace(/\//g,"\\/").replace(/:/g,"\\:")+")"});

    var ids_escaped = ids.map(escape_solr_query).map(function(id){return "(id:"+id+")"});
    
    var ids_or_str = ids_escaped.join(" OR ");
    
    //var ids_or_str = ids.map(function(id){return "(id:"+id.replace(/\//g,"\\/").replace(/:/g,"\\:")+")"}).join(" OR ");


    
    var fl_args = [ "id", "title_s", "handleUrl_s",
		    "genre_ss", "names_ss", "pubDate_s", "typeOfResource_s" ];
    var fl_args_str = fl_args.join(",");
    
    var url_args = {
	q: ids_or_str,
	indent: "off",
	wt: "json",
	start: 0,
	rows: ids.length,
	fl: fl_args_str
    };

    
    $.ajax({
	type: "POST",
	url: solr_search_action,
	data: url_args,
	dataType: "json",
	success: add_titles_solr,
	error: ajax_error
    });
    
    
    
}

var store_search_args = null;
var store_search_action = null;
var store_search_url = null;

var group_by_vol_checked = 0;
var doc_units = "";


function expand_vfield(q_term, all_vfields, query_level) {
	var vfields = [];
	var metadata_fields = ["accessProfile_t", "genre_t", "imprint_t", "isbn_t", "issn_t",
		"issuance_t", "language_t", "lccn_t", "names_t", "oclc_t",
		"pubPlace_t", "pubDate_t", "rightsAttributes_t", "title_t", "typeOfResource_t"
	];

	if (all_vfields) {
		for (var fi = 0; fi < metadata_fields.length; fi++) {
		        var vfield = metadata_fields[fi];
		        if (query_level == "page") {
		            vfield = "volume"+ vfield + "xt";
			}
			vfields.push(vfield + ":" + q_term);
		}
	} else {
		if (q_term.match(/:/)) {
			vfields.push(q_term);
		} else {
		        // make searching by title the default
		        var vfield = "title_t";
		        if (query_level == "page") {
		            vfield = "volume"+ vfield + "xt";
			}

			vfields.push(vfield + ":" + q_term);
		}
	}


	var vfields_str = vfields.join(" OR ");

	return vfields_str;
}

function expand_vquery_field_and_boolean(query, all_vfields, query_level) {
    // boolean terms
    //  => pos and lang field
    if (query === "") {
	return ""
    }
    
    //var query_terms = query.split(/\s+/); // ****
    // Based on:
    //   https://stackoverflow.com/questions/4031900/split-a-string-by-whitespace-keeping-quoted-segments-allowing-escaped-quotes
    var query_terms = query.match(/\w+(?::(?:\w+|"[^"]+"))?|(?:"[^"]+")/g);
    
    console.log("*** query terms = " + query_terms);
    
    var query_terms_len = query_terms.length;
    console.log("*** query terms len = " + query_terms.length);
    
    var bool_query_term = [];
    
    var i = 0;
    var prev_bool = "";
    
    var and_count = 0;
    var or_count  = 0;
    
    for (var i = 0; i < query_terms_len; i++) {
	var term = query_terms[i];
	if (term.match(/^and$/i)) {
	    prev_bool = term.toUpperCase();
	    and_count++;
	}
	else if (term.match(/^or$/i)) {
	    prev_bool = term.toUpperCase();
	    or_count++;
	}
	else {
	    if (i > 0) {
		if (prev_bool == "") {
		    prev_bool = "AND";
		    and_count++;
		}
	    }
	    
	    var expanded_term = expand_vfield(term, all_vfields, query_level); // **** only difference to POS version
	    
	    term = "(" + expanded_term + ")";
	    
	    if (prev_bool != "") {
		bool_query_term.push(prev_bool);
		prev_bool = "";
	    }
	    bool_query_term.push(term);
	}
    }
    
    var op_count = and_count + or_count;

    if (op_count == 1) {
	if (and_count == 1) {
            explain_search.volume_level_terms = "metadata-term AND metadata-term";
	}
	else {
	    // or_count == 1
	    explain_search.volume_level_terms = "metadata-term OR metadata-term";
	}
    }
    else {
	if (op_count>1) {
	    explain_search.volume_level_terms = "metadata-term AND+OR metadata-term ...";
	}
    }
    
    var bool_query = bool_query_term.join(" ");
    
    return bool_query;
}


function expand_field_lang_pos(q_text, langs_with_pos, langs_without_pos, search_all_checked) {
	var fields = [];
	var universal_pos_tags = ["VERB", "NOUN", "ADJ", "ADV", "ADP", "CONJ", "DET", "NUM", "PRT", "X"];

	for (var li = 0; li < langs_with_pos.length; li++) {
		var lang = langs_with_pos[li];
		var lang_enabled_id = lang + "-enabled";
		var $lang_enabled_cb = $('#' + lang_enabled_id);
		if ($lang_enabled_cb.is(':checked')) {
			console.log("Extracting POS tags for: " + lang);

			for (var ti = 0; ti < universal_pos_tags.length; ti++) {
				var tag = universal_pos_tags[ti];
				var lang_tag_id = lang + "-" + tag + "-htrctoken-cb";
				var $lang_tag_cb = $('#' + lang_tag_id);
				if (search_all_checked || ($lang_tag_cb.is(':checked'))) {
					var lang_tag_field = lang + "_" + tag + "_htrctokentext";
					fields.push(lang_tag_field + ":" + q_text);
				}
			}
		}
	}

	for (var li = 0; li < langs_without_pos.length; li++) {
		var lang = langs_without_pos[li];
		var lang_enabled_id = lang + "-enabled";
		var $lang_enabled_cb = $('#' + lang_enabled_id);

		if (search_all_checked || ($lang_enabled_cb.is(':checked'))) {
			console.log("Adding in non-POS field for: " + lang);
			var lang_tag_field = lang + "_htrctokentext";
			fields.push(lang_tag_field + ":" + q_text);
		}
	}

	var fields_str = fields.join(" OR ");

	return fields_str;
}

function expand_query_field_and_boolean(query, langs_with_pos, langs_without_pos, search_all_checked) {
	// boolean terms
	//  => pos and lang field
	if (query === "") {
		return ""
	}

        //var query_terms = query.split(/\s+/);
        // Based on:
        //   https://stackoverflow.com/questions/4031900/split-a-string-by-whitespace-keeping-quoted-segments-allowing-escaped-quotes
        var query_terms = query.match(/\w+(?::(?:\w+|"[^"]+"))?|(?:"[^"]+")/g);
    
	var query_terms_len = query_terms.length;

	var bool_query_term = [];

	var i = 0;
	var prev_bool = "";

	for (var i = 0; i < query_terms_len; i++) {
		var term = query_terms[i];
		if (term.match(/^(and|or)$/i)) {
			prev_bool = term.toUpperCase();
		} else {
			if (i > 0) {
				if (prev_bool == "") {
					prev_bool = "AND";
				}
			}

			var expanded_term = expand_field_lang_pos(term, langs_with_pos, langs_without_pos, search_all_checked)

			term = "(" + expanded_term + ")";

			if (prev_bool != "") {
				bool_query_term.push(prev_bool);
				prev_bool = "";
			}
			bool_query_term.push(term);
		}
	}

	var bool_query = bool_query_term.join(" ");

	return bool_query;
}


function submit_action(event) {
    event.preventDefault();

    if ($('#search-results-page').is(":visible")) {
	$('#search-results-page').hide();
    }
    $('.search-in-progress').css("cursor","wait");

    filters = [];
    facetlist_set();
    
        show_facet = 0;
    
        store_search_action = solr_search_action;

	var arg_indent = $('#indent').attr('value');
	var arg_wt = $('#wt').attr('value');

	var q_text = $('#q').val().trim();
	var vq_text = $('#vq').val().trim();


	group_by_vol_checked = $('#group-results-by-vol:checked').length;
    
	var search_all_langs_checked = $('#search-all-langs:checked').length;
	var search_all_vfields_checked = $('#search-all-vfields:checked').length;

	if ((q_text === "") && (vq_text === "")) {
		$('.search-in-progress').css("cursor","auto");
		htrc_alert("No query term(s) entered");
		return;
	}

        explain_search = { 'group_by_vol': null,
			   'volume_level_terms': 'metadata-term', 'volume_level_desc': null,
			   'page_level_terms': 'POS-term OR ...', 'page_level_desc': null };

	arg_q = expand_query_field_and_boolean(q_text, langs_with_pos, langs_without_pos, search_all_langs_checked);

        if (arg_q == "") {
	    // Potentially only looking at volume level terms
	    facet_level = "volume";
	}
        else {
	    facet_level = "page";
	}
        arg_vq = expand_vquery_field_and_boolean(vq_text, search_all_vfields_checked, facet_level);

	//console.log("*** arg_vq = " + arg_vq);
	//console.log("*** arg_q = " + arg_q);

    
	if (arg_q == "") {
		if (arg_vq == "") {
		    // arg_vq was empty to start with, but attempt to expand non-empty arg_q
		    //   lead to an empty arg_q being returned
		    $('.search-in-progress').css("cursor","auto");
		    htrc_alert("No languages selected");
		    return;
		} else {
		    arg_q = arg_vq;
		    doc_units = " volumes ";
		    show_facet = 1;
		    explain_search.volume_level_desc  = "[Volume: TERMS]";
		    if (group_by_vol_checked) {
		        explain_search.group_by_vol = "Search results sorted by volume ID";
		    }

		}
	} else {
		if (arg_vq != "") {
		    // join the two with an AND
		    arg_q = "(" + arg_vq + ")" + " AND " + "(" + arg_q + ")"; 
		    
		    explain_search.volume_level_desc = "[Volume: TERMS]";
		    explain_search.page_level_desc   = "[Page-level: TERMS]";
		}
	        else {
		    explain_search.page_level_desc  = "[Page-level: POS-terms]";
		}
	        if (group_by_vol_checked) {
		    explain_search.group_by_vol = "Search results sorted by volume ID";
		}		    

		doc_units = " pages ";
		show_facet = 1;  
	}

	if ($('#vq').attr("data-key") == undefined) {
		$('#vq').attr("data-key",vq_text);
	}
	if ($('#vq').attr("data-key") != vq_text) {
		$('#vq').attr("data-key",vq_text);
		filters = [];
		facetlist_set();
	}
	//console.log("*** NOW arg_q = " + arg_q);

	// Example search on one of the htrc-full-ef fields is: 
	//  q=en_NOUN_htrctokentext:farming

    	var arg_start = $('#start').attr('value');

        var num_rows = (group_by_vol_checked) ? 10*num_results_per_page : num_results_per_page;
    
	store_search_args = {
		q: arg_q,
		indent: arg_indent,
		wt: arg_wt,
		start: arg_start,
		rows: num_rows,
		facet: "on"
	};

        if (group_by_vol_checked) {
		store_search_args.sort = "id asc";
	}

    ajax_solr_text_search(true); // newResultPage=true
}

function generate_pos_langs() {
	var pos_checkbox = [{
		pos: "VERB",
		label: "Verbs",
		tooltip: "Verbs (all tenses and modes)"
	}, {
		pos: "NOUN",
		label: "Nouns",
		tooltip: "Nouns (common and proper)"
	}, {
		pos: "ADJ",
		label: "Adjectives",
		tooltip: null
	}, {
		pos: "ADV",
		label: "Adverbs",
		tooltip: null
	}, {
		pos: "ADP",
		label: "Adpositions",
		tooltip: "Adpositions (prepositions and postpositions)"
	}, {
		pos: "CONJ",
		label: "Conjunctions",
		tooltip: null
	}, {
		pos: "DET",
		label: "Determiners",
		tooltip: null
	}, {
		pos: "NUM",
		label: "Numbers",
		tooltip: "Cardinal numbers"
	}, {
		pos: "PRT",
		label: "Particles",
		tooltip: "Particles or other function words"
	}, {
		pos: "X",
		label: "Other",
		tooltip: "Other words, such as foreign words, typos, abbreviations"
	}];

	var $pos_fieldsets = $('#pos-fieldsets');

	for (var li = 0; li < langs_with_pos.length; li++) {

		var l = langs_with_pos[li];
		var lang_full = isoLangs[l].name;
		var lang_native_full = isoLangs[l].nativeName;
		var opt_title = (lang_full !== lang_native_full) ? 'title="' + lang_native_full + '"' : "";

		var opt_enabled = (l == "en") ? 'checked="checked"' : "";

		var legend = "";
		legend += '    <legend style="margin-bottom: 5px; padding-top: 15px;">\n';
		legend += '      <input type="checkbox" name="' + l + '-enabled" id="' + l + '-enabled" ' + opt_enabled + '/>\n';
		legend += '      <span ' + opt_title + '>' + lang_full + ':</span>\n';
		legend += '    </legend>\n';


		var check_box_list = [];

		for (var pi = 0; pi < pos_checkbox.length; pi++) {
			var pos_info = pos_checkbox[pi];
			var pos = pos_info.pos;
			var label = pos_info.label;
			var tooltip = pos_info.tooltip;
			var opt_tooltip = (tooltip != null) ? 'title="' + tooltip + '"' : "";

			var check_box = "";
			check_box += '    <input type="checkbox" name="' + l + '-' + pos + '-htrctoken-cb" id="' + l + '-' + pos + '-htrctoken-cb" checked="checked" />\n';
			check_box += '    <label for="' + l + '-' + pos + '-htrctoken-cb" ' + opt_tooltip + '>' + label + '</label>\n';

			check_box_list.push(check_box);
		}

		var fieldset = "";
		var opt_showhide_class = (li > 0) ? 'class="show-hide-lang"' : "";

		if (li == 1) {
			fieldset += '<button id="show-hide-lang">Show other languages ...</button>';
		}

		fieldset += '<fieldset ' + opt_showhide_class + '>\n';
		fieldset += legend;
		fieldset += '  <div id="' + l + '-pos-choice">\n';

		var check_box_join = check_box_list.join('&nbsp;');
		fieldset += check_box_join;

		fieldset += '  </div>\n';
		fieldset += '</fieldset>\n';

		$pos_fieldsets.append(fieldset);
		$('#' + l + '-enabled').click(lang_pos_toggle);

		if (l == "en") {
			$('#en-pos-choice *').prop('disabled',false);
		} else {
			$('#' + l + '-pos-choice *').prop('disabled',true);
		}
	}

    show_hide_lang();
}

function show_hide_lang() {
	$("#show-hide-lang").click(function (event) {
		event.preventDefault();
		if ($('.show-hide-lang:visible').length) {
			$('.show-hide-lang').hide("slide", { direction: "up" }, 1000);
			$('#show-hide-lang').html("Show other languages ...");
		} else {
			$('.show-hide-lang').show("slide", { direction: "up" }, 1000);
			$('#show-hide-lang').html("Hide other languages ...");
		}
	});
}


function show_hide_solr_q() {
	$("#show-hide-solr-q").click(function (event) {
		event.preventDefault();
		if ($('.show-hide-solr-q:visible').length) {
			$('.show-hide-solr-q').hide("slide", { direction: "up" }, 1000);
			$('#show-hide-solr-q').html("Show full query ...");
		} else {
			$('.show-hide-solr-q').show("slide", { direction: "up" }, 1000);
			$('#show-hide-solr-q').html("Hide full query ...");
		}
	});
}

function show_hide_more_seqs(line_num) {
    var sid_label = "#show-hide-more-seqs-"+line_num;
    var sid_block = sid_label + "-block";
    
    $(sid_label).click(function (event) {
	event.preventDefault();
	if ($(sid_block+':visible').length) {
	    $(sid_block).hide("slide", { direction: "up" }, 1000);
	    $(sid_label).html("Show more pages ...");
	} else {
	    $(sid_block).show("slide", { direction: "up" }, 1000);
	    $(sid_label).html("Hide pages ...");
	}
    });
}


function generate_other_langs() {
	// setup other languages
	// for each 'langs_without_pos' generate HTML of the form:
	//    <input type="checkbox" name="fr-enabled" id="fr-enabled" />French
	var $other_langs = $('#other-langs');

	for (var i = 0; i < langs_without_pos.length; i++) {
		var lang = langs_without_pos[i];
		var labeled_checkbox = '<nobr>';

		labeled_checkbox += '<input type="checkbox" name="' + lang + '-enabled" id="' + lang + '-enabled" />';
		/*
	if (lang === "zh-cn") {
	    console.log("Mapping zh-cn => zh");
	    lang = "zh";
	}
	if (lang === "zh-tw") {
	    console.log("Mapping zh-tw => zh");
	    lang = "zh";
	}
*/
		var lang_full = isoLangs[lang].name;
		var lang_native_full = isoLangs[lang].nativeName;
		var opt_title = (lang_full !== lang_native_full) ? 'title="' + lang_native_full + '"' : "";

		labeled_checkbox += '<label for="' + lang + '-enabled" style="padding-left: 5px; padding-right: 10px;" ' + opt_title + '>' + lang_full + '</label>';

		labeled_checkbox += '</nobr> ';

		$other_langs.append(labeled_checkbox);

	}
}

$(function () {
	generate_pos_langs();

	generate_other_langs();

	if ($('#search-submit').length > 0) {
		$('#search-submit').click(submit_action);
	}

	$("#facetlist").on("click","a",function () {
		//indexOf  
		$class = $(this).attr("class");
		if ($(this).hasClass("morefacets")) {
			obj = $class.split(" ")[0];
			$(this).hide();
			$("[class='" + obj + " lessfacets']").show();
			$("[class='hidefacet " + obj + "']").css({
				display: "block",
				visibility: "visible"
			});
			return false;
		} else if ($(this).hasClass("lessfacets")) {
			obj = $class.split(" ")[0];
			$(this).hide();
			$("[class='" + obj + " morefacets']").show();
			$("[class='hidefacet " + obj + "']").css({
				display: "none",
				visibility: "visible"
			});
			return false;
		} else {

			var obj = $(this).attr("data-obj");
			var key = $(this).attr("data-key");
			if (filters.indexOf(obj + "--" + key) < 0) {
				filters.push(obj + "--" + key);
			}
			$(this).parent().remove();
		        facetlist_set();
		        store_search_args.start = store_start;
		        show_updated_results();
		}
	});
    
	$(".filters").on("click","a",function () {

		filters.splice($(this).parent().index(), 1);
	        facetlist_set();
	        store_search_args.start = store_start;
	        show_updated_results();
	});
});

function facetlist_set() {
    var facetlist_html = '';
    for (k in filters) {
	var ks = filters[k].split("--");

	var kv0 = ks[0];
	var kv1 = ks[1];

	if (facet_level == "page") {
	    kv0 = kv0.replace(/^volume/,"");
	    kv0 = kv0.replace(/_htrcstrings$/,"_ss"); 
	    kv0 = kv0.replace(/_htrcstring$/,"_s"); 
	}
	var kv0_display = facet_display_name[kv0]

	var facet_val  = pretty_print_facet_value(kv0,kv1);	
	
	facetlist_html += '<li><a href="javascript:;" class="unselect"><img alt="Delete" src="assets/jquery-ui-lightness-1.12.1/images/cancel.png" class="removeFacetIcon"></a>&nbsp;<span class="selectedfieldname">' + kv0_display + '</span>:  ' + facet_val + '</li>';
    }

	$(".filters").html(facetlist_html);
}

