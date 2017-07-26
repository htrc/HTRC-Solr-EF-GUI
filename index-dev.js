
var num_results = 20;
var store_result_page_starts = [];

var filters = [];
var facet = ['genre_ss', 'language_s', 'rightsAttributes_s', 'pubPlace_s', 'bibliographicFormat_s'];
var facet_display_name = {'genre_ss':'Genre', 'language_s': 'Language', 'rightsAttributes_s': 'Copyright Status', 'pubPlace_s': 'Place of Publication', 'bibliographicFormat_s': 'Original Format'};

// Global variable show_facet to control if faceting is used.
var show_facet = 0;
var facet_level = null;

var explain_search = { 'group_by_vol': null,
		       'volume_level_terms': null, 'volume_level_desc': null,
		       'page_level_terms': null, 'page_level_desc': null };

$(document).ready(function(){
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


    $("#volume-help").click(function () {
	$("#volume-help-dialog").dialog( "open" );
    });

});


function lang_pos_toggle(event) {
	var $this = $(this);
	var checked_state = $this.prop("checked");

	var id = $this.attr("id");
	var split_id = id.split("-");
	var related_id = split_id[0] + "-pos-choice";

	var disable_state = !checked_state;
	$('#' + related_id + " *").prop('disabled', disable_state);
}

function ajax_error(jqXHR, textStatus, errorThrown) {
	alert('An error occurred... Look at the console (F12 or Ctrl+Shift+I, Console tab) for more information!');

	console.log('jqXHR:' + jqXHR);
	console.log('textStatus:' + textStatus);
	console.log('errorThrown:' + errorThrown);
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
	    $("[name='" + htid + "']").each(function () {
		$(this).html(title)
	    });
	    console.log(htid + ", title = " + title);

	    var itemURL = doc_val.handleUrl_s;
	    itemURL = itemURL.replace(/^https:/, "http:");

	    var ws_span = '<span class="workset" style="display: none;"><br>[Workset: <span name="' + itemURL + '"></span>]</span>';
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

function ajax_solr_text_search()
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
	var ks = filters[k].split("-");
	url_args.push('fq=' + ks[0] + ':("' + ks[1] + '")');
    }

    var data_str = url_args.join("&");
    
    store_search_url = store_search_action + "?" + data_str;
    
    $.ajax({
	type: 'GET',
	url: store_search_action,
	data: data_str,
	dataType: 'json',
	success: show_results,
	error: ajax_error
    });
}



function show_new_results(delta) {
    $('.search-in-progress').css("cursor", "wait");
    
    var start = parseInt(store_search_args.start)
    
    store_search_args.start = start + parseInt(delta);
    
    ajax_solr_text_search();
    /*
        var url = "";
	for (k in store_search_args) {
		url += k + '=' + store_search_args[k] + "&";
	}

	for (k in facet) {
	    var facet_val = facet[k];
	    if (facet_level == "page") {
		facet_val = "volume" + facet_val;
		facet_val = facet_val.replace(/_ss$/,"_htrcstrings");
		facet_val = facet_val.replace(/_s$/,"_htrcstring");
	    }
	    url += 'facet.field=' + facet_val + "&";
	}
    
	for (k in filters) {
		var ks = filters[k].split("-");
		url += 'fq=' + ks[0] + ':("' + ks[1] + '")&';
	}

        store_search_url = store_search_action + "?" + url;
    

	$.ajax({
		type: 'GET',
		url: store_search_action,
		data: url,
		dataType: 'json',
		success: show_results,
		error: ajax_error
	});
*/
}

function generate_item(line, id, id_pages) {
	var css_class = (line % 2 == 0) ? 'class="evenline"' : 'class="oddline"';

	var html_item = "";

        // <li title="nc01.ark:/13960/t78s5b569" style="color: #924a0b;"><a href="https://data.analytics.hathitrust.org/features/get?download-id=nc01.ark%3A%2F13960%2Ft78s5b569"><span class="icomoon icomoon-download"></span>Download Extracted Features</a></li>

    	var id_pages_len = id_pages.length;

        var download_text = "Download Extracted Features";
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
        var download_span = '<br /><span title="'+id+'" style="color: #924a0b;"><a href="https://data.analytics.hathitrust.org/features/get?download-id='+id+'"><span class="icomoon icomoon-download"></span>' +download_text+ '</a></span>';


	for (var pi = 0; pi < id_pages_len; pi++) {
		var page = id_pages[pi];

		var seqnum = (page == 0) ? 1 : page;
		var babel_url = "https://babel.hathitrust.org/cgi/pt?id=" + id + ";view=1up;seq=" + seqnum;

		if (id_pages_len > 1) {

			if (pi == 0) {
				html_item += '<p ' + css_class + '>';
				html_item += '<span style="font-style: italic;" name="' +
					id + '"><span style="cursor: progress;">Loading ...</span></span><br>';
				if (page > 0) {
					html_item += id + ': <nobr><a target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a> ';
				} else {
					// skip linking to the 'phony' page 0
					html_item += "<nobr>" + id;
				}
			} else {
				html_item += ',</nobr> <a target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a> ';
			}
		} else {
			html_item += '<p ' + css_class + '>';
			html_item += ' <span style="font-style: italic;" name="' +
				id + '"><span style="cursor: progress;">Loading ...</span></span><br>';

			if (page > 0) {
				html_item += id + ': <a target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a>';
			} else {
				html_item += id + ': <a target="_blank" href="' + babel_url + '">all pages</a>';
			}

		        html_item += download_span;
			html_item += '</p>';
		}

	}

    
        if (id_pages_len > 1) {
	        html_item += download_span;
		html_item += "</p>";
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
		dataType: 'jsonp',
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
	if (displayed_item in place_dic) {
	    displayed_item = place_dic[displayed_item];
	}
    }

    // The following led to the confusing situation that seemingly the same facet value could
    // turn up twice in the list (e.g. because of 'fiction' and 'fiction.')
    //displayed_item = displayed_item.replace(/\.$/,""); // tidy up spurious full-stop at end of string

    return displayed_item;
}

function show_results(jsonData) {
    var response = jsonData.response;
    var num_found = response.numFound;
    var docs = response.docs;
    var num_docs = docs.length;
    
    var facet_fields = jsonData.facet_counts.facet_fields;
    
    //
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
		if (filters.indexOf(kv + "-" + item[j]) < 0) {
		    _class = "showfacet";
		    if (ii > 5) {
			_class = "hidefacet";
		    }
		    var displayed_item = pretty_print_facet_value(kv,item[j]);
		    
		    facet_html += '<dd class="' + _class + ' ' + kv + '"><a href="javascript:;" data-obj="' + k + '"  data-key="' + item[j] + '">' + displayed_item + '</a><span dir="ltr">&nbsp;(' + item[j + 1] + ') </span></dd>';
		    ii++;
		}
		
	    }
	    
	}
	if (ii > 5) {
	    facet_html += '<dd><a href="" class="' + kv + ' morefacets"><span class="moreless">more...</span></a><a href="" class="' + kv + ' lessfacets" style="display: none;"><span class="moreless">less...</span></a></dd>'
	}
	facet_html += "</dl>";
    }
    if (show_facet == 1) {
	$(".narrowsearch").show();
	$("#facetlist").html(facet_html);
    } else if (show_facet == 0){
	$(".narrowsearch").hide();
	facet_html = "";
	$("#facetlist").html(facet_html);
    }
    
    $('.search-in-progress').css("cursor", "auto");
    
    var $search_results = $('#search-results');
    
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
    
    var explain_html = "<p>Search explanation: " + query_level_mix;
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

    explain_html += '  <div class="show-hide-solr-q" style="display:none; padding: 5px; width: 650px;">' + store_search_args.q + '"</div>\n';
    explain_html += "</div>\n";
    explain_html += "</p>\n";

    explain_html += '<p style="clear:both"></p>\n';

    if (num_docs > 0) {
	$search_results.html("<p>Results: " + num_found + doc_units + "matched</p>");
	
	$search_results.append(explain_html);
	
	var from = parseInt(store_search_args.start) + 1;
	//var to = from + num_results - 1;
	var to = from + store_search_args.rows - 1;
	
	if (to > num_found) {
	    // cap value
	    to = num_found;
	}
	var showing_matches = (facet_level == "page") ? "<p>Showing page-level matches: " : "<p>Showing volume matches:";
	
	showing_matches += '<span id="sm-from">' + from + '</span>';
	showing_matches += "-";
	showing_matches += '<span id="sm-to">' + to + '</span>';
	showing_matches += "</p>";
	
	$search_results.append(showing_matches);
    } else {
	$search_results.html(explain_html + "<p>No pages matched your query</p>");
    }

    show_hide_solr_q();

    // Example form of URL
    //   https://babel.hathitrust.org/cgi/pt?id=hvd.hnnssu;view=1up;seq=11
    
    var ids = [];
    var htids = [];
    
    var prev_id = null;
    var prev_pages = [];
    
    var i = 0;
    var line_num = 1;
    while ((i < num_docs) && (line_num < num_results)) {
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
	
	if ((!group_by_vol_checked && prev_id != null) || ((prev_id != null) && (id != prev_id))) {
	    // time to output previous item
	    var html_item = generate_item(line_num, prev_id, prev_pages);
	    $search_results.append(html_item);
	    line_num++;
	    prev_pages = [page];
	} else {
	    // accumulate pages
	    prev_pages.push(page)
	}
	
	ids.push(id);
	htids.push("htid:" + id);
	
	prev_id = id;
	i++;
    }
    var num_pages = i;
    
    var html_item = generate_item(line_num, prev_id, prev_pages);
    //    console.log("*** html item = " + html_item);
    //    if (html_item != "") {
    $search_results.append(html_item);
    //	line_num++;
    //    }
    //console.log("*** line_num = " + line_num);
    
    //else {
    //	line_num--;
    //  }
    //    if ((i == num_docs) && (line_num != num_results)) {
    //	line_num--;
    //    }
    
    document.location.href = "#search-results-anchor";

    var search_end = search_start + num_pages;
    //if (search_end < num_found) {
	// more results exist
    if (line_num<num_results) {
	//$search_results.append('<p>More results needed to fill up the page</p>');
    }

    var next_prev = '<p style="width:100%;"><div id="search-prev" style="float: left;"><a>&lt; Previous</a></div><div id="search-next" style="float: right;"><a>Next &gt;</a></div></p>';
    
    $search_results.append(next_prev);

    $('#search-prev').click(function (event) {
	var start = store_search_args.start;
	var prev_start = store_result_page_starts.pop();
	var diff = prev_start - start;
	
	show_new_results(diff);
    });
    
    $('#search-next').click(function (event) {
	store_result_page_starts.push(store_search_args.start);
	show_new_results(num_pages); // used to be num_results
    });


    // Need to hide prev link?
    var search_start = parseInt(store_search_args.start);
    if (search_start == 0) {
	$('#search-prev').hide();
    }

    // Need to hide next link?
    //var search_end = search_start + num_pages;
    if (search_end >= num_found) {
	$('#search-next').hide();
    }

    // Showing matches to ...
    //$('#sm-to').html(search_start + line_num);
    $('#sm-to').html(search_start + num_pages);
    
    
    // Example URL for catalog metadata (multiple items)
    //   http://catalog.hathitrust.org/api/volumes/brief/json/id:552;lccn:70628581|isbn:0030110408
    
    //var htids_str = htids.join("|", htids);
    //var cat_url = "http://catalog.hathitrust.org/api/volumes/brief/json/" + htids_str;
    //$.ajax({
    //	url: cat_url,
    //	dataType: 'jsonp',
    //	jsonpCallback: "add_titles"
    //});
    

    // Example URL for using the Solr-EF collection to retrieve volume id info
    //   http://solr1.ischool.illinois.edu/solr/htrc-full-ef20/select?q=(id:mdp.39015071574472)&indent=on&wt=json&start=0&rows=200
    
    
    var solr_search_action = $('#search-form').attr("action");
    var ids_and_str = ids.map(function(id){return "(id:"+id.replace(/\//g,"\\/").replace(/:/g,"\\:")+")"}).join(" OR ");
        
    var url_args = {
	q: ids_and_str,
	indent: "off",
	wt: "json",
	start: 0,
	rows: ids.length,
    };

    $.ajax({
	type: "POST",
	url: solr_search_action,
	data: url_args,
	dataType: 'json',
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
    
    var query_terms = query.split(/\s+/);
    var query_terms_len = query_terms.length;
    
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

	var query_terms = query.split(/\s+/);
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

	$('.search-in-progress').css("cursor", "wait");

        show_facet = 0;
    
	store_search_action = $('#search-form').attr("action");

	var arg_indent = $('#indent').attr('value');
	var arg_wt = $('#wt').attr('value');

	var q_text = $('#q').val().trim();
	var vq_text = $('#vq').val().trim();


	group_by_vol_checked = $('#group-results-by-vol:checked').length;
    
	var search_all_langs_checked = $('#search-all-langs:checked').length;
	var search_all_vfields_checked = $('#search-all-vfields:checked').length;

	if ((q_text === "") && (vq_text === "")) {
		$('.search-in-progress').css("cursor", "auto");
		alert("No query term(s) entered");
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
		    $('.search-in-progress').css("cursor", "auto");
		    alert("No languages selected");
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
		$('#vq').attr("data-key", vq_text);
	}
	if ($('#vq').attr("data-key") != vq_text) {
		$('#vq').attr("data-key", vq_text);
		filters = [];
		facetlist_set();
	}
	//console.log("*** NOW arg_q = " + arg_q);

	// Example search on one of the htrc-full-ef fields is: 
	//  q=en_NOUN_htrctokentext:farming

    	var arg_start = $('#start').attr('value');
	//var arg_rows = $('#rows').attr('value'); // ****

        var num_rows = (group_by_vol_checked) ? 10*num_results : num_results;
    
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

    ajax_solr_text_search();
    /*
	var url = "";
	for (k in store_search_args) {
		url += k + '=' + store_search_args[k] + "&";
	}

        for (k in facet) {
	        var facet_val = facet[k];
	        if (facet_level == "page") {
		    facet_val = "volume" + facet_val;
		    facet_val = facet_val.replace(/_ss$/,"_htrcstrings");
		    facet_val = facet_val.replace(/_s$/,"_htrcstring");
		}

		url += 'facet.field=' + facet_val + "&";
	}
    
	for (k in filters) {
		var ks = filters[k].split("-");
		url += 'fq=' + ks[0] + ':("' + ks[1] + '")&';
	}

	//console.log("Solr URL:\n");
	//console.log(store_search_action + "?" + url);

        store_search_url = store_search_action + "?" + url;
    
	$.ajax({
		type: 'GET',
		url: store_search_action,
		data: url,
		dataType: 'json',
		success: show_results,
		error: ajax_error
	});
    */
    
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
			$('#en-pos-choice *').prop('disabled', false);
		} else {
			$('#' + l + '-pos-choice *').prop('disabled', true);
		}
	}

    show_hide_lang();
}

function show_hide_lang() {
	$("#show-hide-lang").click(function (event) {
		event.preventDefault();
		if ($('.show-hide-lang:visible').length) {
			$('.show-hide-lang').hide("slide", {
				direction: "up"
			}, 1000);
			$('#show-hide-lang').html("Show other languages ...");
		} else {
			$('.show-hide-lang').show("slide", {
				direction: "up"
			}, 1000);
			$('#show-hide-lang').html("Hide other languages ...");
		}
	});
}


function show_hide_solr_q() {
	$("#show-hide-solr-q").click(function (event) {
		event.preventDefault();
		if ($('.show-hide-solr-q:visible').length) {
			$('.show-hide-solr-q').hide("slide", {
				direction: "up"
			}, 1000);
			$('#show-hide-solr-q').html("Show full query ...");
		} else {
			$('.show-hide-solr-q').show("slide", {
				direction: "up"
			}, 1000);
			$('#show-hide-solr-q').html("Hide full query ...");
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

	$("#facetlist").on("click", "a", function () {
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
			if (filters.indexOf(obj + "-" + key) < 0) {
				filters.push(obj + "-" + key);
			}
			$(this).parent().remove();
			facetlist_set();
			$('#search-submit').trigger("click");
		}



	});
	$(".filters").on("click", "a", function () {

		filters.splice($(this).parent().index(), 1);
		facetlist_set();
		$('#search-submit').trigger("click");
	});

});

function facetlist_set() {
    var facetlist_html = '';
    for (k in filters) {
	var ks = filters[k].split("-");

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

