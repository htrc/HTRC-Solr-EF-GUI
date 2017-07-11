

var langs_with_pos = ["en", "de", "pt", "da", "nl", "sv"];

var langs_without_pos = [
	"af", "ar", "bg", "bn", "cs", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu",
	"id", "it", "ja", "kn", "ko", "lt", "lv", "mk", "ml", "mr", "ne", "no", "pa", "pl",
	"ro", "ru", "sk", "sl", "so", "sq", "sv", "sw", "ta", "te", "th", "tl", "tr",
	"uk", "ur", "vi", "zh-cn", "zh-tw"
];

var num_rows = 20;
var filters = [];
var facet = ['genre_ss', 'language_t', 'pubPlace_s', 'bibliographicFormat_s'];
var facet_display_name = {'genre_ss':'Genre', 'language_t': 'Language', 'pubPlace_s': 'Place of Publication', 'bibliographicFormat_s': 'Original Format'};

// Global variable show_facet to control if faceting is used.
var show_facet = 0;

var explain_search = { 'group_by_vol': null, 'query_level': null };

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

				var ws_span = '<span style="display: none;"><br>[Workset: <span name="' + itemURL + '"></span>]</span>';
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

	    var ws_span = '<span style="display: none;"><br>[Workset: <span name="' + itemURL + '"></span>]</span>';
	    $("[name='" + htid + "']").each(function () {
		$(this).append(ws_span)
	    });
	    //console.log("itemURL = " + itemURL);
	    itemURLs.push(itemURL);
	});

	workset_enrich_results(itemURLs);

}


function add_worksets(json_data) {

	//console.log("****" + JSON.stringify(json_data));
	$.each(json_data["@graph"], function (ws_index, ws_val) {
		var workset_id = ws_val["@id"];
		var workset_title = ws_val["http://purl.org/dc/terms/title"][0]["@value"];

		// http://acbres224.ischool.illinois.edu:8890/sparql?query=describe <http://worksets.hathitrust.org/wsid/189324112>&format=text/x-html+ul
		// http://acbres224.ischool.illinois.edu:8890/sparql?query=describe+%3Chttp%3A%2F%2Fworksets.hathitrust.org%2Fwsid%2F189324112%3E&format=text%2Fx-html%2Bul

		var describe_url = "http://acbres224.ischool.illinois.edu:8890/sparql?query=describe+<" +
			workset_id + ">&format=text%2Fx-html%2Bul";
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


function show_new_results(delta) {
	$('.search-in-progress').css("cursor", "wait");

	var start = parseInt(store_search_args.start)

	store_search_args.start = start + parseInt(delta);
	var url = "";
	for (k in store_search_args) {
		url += k + '=' + store_search_args[k] + "&";
	}

	for (k in facet) {
		url += 'facet.field=' + facet[k] + "&";
	}
	for (k in filters) {
		_k = filters[k].split("-");
		url += 'fq=' + _k[0] + ':("' + _k[1] + '")&';
	}


	$.ajax({
		type: 'GET',
		url: store_search_action,
		data: url,
		dataType: 'json',
		success: show_results,
		error: ajax_error
	});
}

function generate_item(line, id, id_pages) {
	var css_class = (line % 2 == 0) ? 'class="evenline"' : 'class="oddline"';

	var html_item = "";

	var id_pages_len = id_pages.length;

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
					html_item += id + ': <a target="_blank" href="' + babel_url + '">seq ' + seqnum + '</a> ';
				} else {
					// skip linking to the 'phony' page 0
					html_item += id;
				}
			} else {
				html_item += ', <a target="_blank" href="' + babel_url + '">seq ' + seqnum + '</a> ';
			}
		} else {
			html_item += '<p ' + css_class + '>';
			html_item += ' <span style="font-style: italic;" name="' +
				id + '"><span style="cursor: progress;">Loading ...</span></span><br>';

			if (page > 0) {
				html_item += '<a target="_blank" href="' + babel_url + '">' + id + ', seq ' + seqnum + '</a>';
			} else {
				html_item += '<a target="_blank" href="' + babel_url + '">' + id + ', all pages</a>';
			}

			html_item += '</p>';
		}

	}

	if (id_pages_len > 1) {
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
		facet_html += "<dl>";
		facet_html += "<dt class=\"facetField\">" + facet_display_name[k] + "</dt> ";
		item = facet_fields[k];
		ii = 0;
		for (var j = 0; j <= item.length / 2; j = j + 2) {

			if (item[j + 1] > 0) {
				if (filters.indexOf(k + "-" + item[j]) < 0) {
					_class = "showfacet";
					if (ii > 5) {
						_class = "hidefacet";
					}
					displayed_item = item[j]
					if (k == "bibliographicFormat_s") {
						if (displayed_item in format_dic) {
							displayed_item = format_dic[displayed_item];
						}
					}
					if (k == "language_t") {
						if (displayed_item in language_dic) {
							displayed_item = language_dic[displayed_item];
						}
					}
					if (k == "pubPlace_s") {
						if (displayed_item in place_dic) {
							displayed_item = place_dic[displayed_item];
						}
					}
					facet_html += '<dd class="' + _class + ' ' + k + '"><a href="javascript:;" data-obj="' + k + '"  data-key="' + item[j] + '">' + displayed_item + '</a><span dir="ltr"> (' + item[j + 1] + ') </span></dd>';
					ii++;
				}

			}

		}
		if (ii > 5) {
			facet_html += '<dd><a href="" class="' + k + ' morefacets"><span class="moreless">more...</span></a><a href="" class="' + k + ' lessfacets" style="display: none;"><span class="moreless">less...</span></a></dd>'
		}
		facet_html += "</dl>";
	}
	if (show_facet == 1) {
		$(".narrowsearch").show();
		$("#facetlist").html(facet_html);
		show_facet = 0;
	} else if (show_facet == 0){
		$(".narrowsearch").hide();
		facet_html = "";
		$("#facetlist").html(facet_html);
	}

	$('.search-in-progress').css("cursor", "auto");

	var $search_results = $('#search-results');

        var explain_html = "<p>Search explanation: " + explain_search.query_level;
        if (explain_search.group_by_vol != null) {
	    explain_html += " THEN " + explain_search.group_by_vol;
	}
        explain_html += "</p>";
    
	if (num_docs > 0) {
	    $search_results.html("<p>Results: " + num_found + doc_units + "matched</p>");

	    $search_results.append(explain_html);
	    
		var from = parseInt(store_search_args.start) + 1;
		var to = from + num_rows - 1;
		if (to > num_found) {
			// cap value
			to = num_found;
		}
		var showing_matches = "<p>Showing matches: ";
		showing_matches += '<span id="sm-from">' + from + '</span>';
		showing_matches += "-";
		showing_matches += '<span id="sm-to">' + to + '</span>';
		showing_matches += "</p>";

		$search_results.append(showing_matches);
	} else {
		$search_results.html(explain_html + "<p>No pages matched your query</p>");
	}

	// Example form of URL
	//   https://babel.hathitrust.org/cgi/pt?id=hvd.hnnssu;view=1up;seq=11

	var ids = [];
        var htids = [];
    
	var prev_id = null;
	var prev_pages = [];

	var i = 0;
	var line_num = 1;
	while ((i < num_docs) && (line_num < num_rows)) {
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
	//    if ((i == num_docs) && (line_num != num_rows)) {
	//	line_num--;
	//    }

	document.location.href = "#search-results-anchor";

	var next_prev = '<p style="width:100%;"><div id="search-prev" style="float: left;"><a>&lt; Previous</a></div><div id="search-next" style="float: right;"><a>Next &gt;</a></div></p>';

	$search_results.append(next_prev);
	$('#search-prev').click(function (event) {
		show_new_results(-1 * num_rows);
	});
	$('#search-next').click(function (event) {
		show_new_results(num_rows);
	});

	var search_start = parseInt(store_search_args.start);
	if (search_start == 0) {
		$('#search-prev').hide();
	}

	var search_end = search_start + num_pages;
	if (search_end >= num_found) {
		$('#search-next').hide();
	}

	$('#sm-to').html(search_start + line_num);


	// Example URL for catalog metadata (multiple items)
	//   http://catalog.hathitrust.org/api/volumes/brief/json/id:552;lccn:70628581|isbn:0030110408

	//var htids_str = htids.join("|", htids);
	//var cat_url = "http://catalog.hathitrust.org/api/volumes/brief/json/" + htids_str;
	//$.ajax({
	//	url: cat_url,
	//	dataType: 'jsonp',
	//	jsonpCallback: "add_titles"
	//});


        // http://solr1.ischool.illinois.edu/solr/htrc-full-ef20/select?q=(id:mdp.39015071574472)&indent=on&wt=json&start=0&rows=200
    	

        var solr_search_action = $('#search-form').attr("action");
    var ids_and_str = ids.map(function(id){return "(id:"+id.replace(/\//g,"\\/").replace(/:/g,"\\:")+")"}).join(" OR ");

        //console.log(store_search_action + "?" + url);
        //console.log("ids_and_str = " + ids_and_str);
    
        var url_args = {
	    q: ids_and_str,
	    indent: "off",
	    wt: "json",	    
	    start: 0,
	    rows: ids.length,
	};
    
	$.ajax({
	    type: 'GET',
	    url: solr_search_action,
	    data: url_args,
	    dataType: 'json',
	    success: add_titles_solr,
	    error: ajax_error
	});


    
}

var store_search_args = null;
var store_search_action = null;

var group_by_vol_checked = 0;
var doc_units = "";


function expand_vfield(q_term, all_vfields) {
	var vfields = [];
	var metadata_fields = ["accessProfile_t", "genre_t", "imprint_t", "isbn_t", "issn_t",
		"issuance_t", "language_t", "lccn_t", "names_t", "oclc_t",
		"pubPlace_t", "pubDate_t", "rightsAttributes_t", "title_t", "typeOfResource_t"
	];

	if (all_vfields) {
		for (var fi = 0; fi < metadata_fields.length; fi++) {
			var vfield = metadata_fields[fi];
			vfields.push(vfield + ":" + q_term);
		}
	} else {
		if (q_term.match(/:/)) {
			vfields.push(q_term);
		} else {
			// make searching by title the default
			vfields.push("title_t:" + q_term);
		}
	}


	var vfields_str = vfields.join(" OR ");

	return vfields_str;
}

function expand_vquery_field_and_boolean(query, all_vfields) {
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

			var expanded_term = expand_vfield(term, all_vfields); // **** only difference to POS version

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
					var lang_tag_field = lang + "_" + tag + "_htrctoken";
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
			var lang_tag_field = lang + "_htrctoken";
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

	store_search_action = $('#search-form').attr("action");

	var arg_indent = $('#indent').attr('value');
	var arg_wt = $('#wt').attr('value');
	var arg_start = $('#start').attr('value');
	var arg_rows = $('#rows').attr('value');

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

	arg_vq = expand_vquery_field_and_boolean(vq_text, search_all_vfields_checked);

	arg_q = expand_query_field_and_boolean(q_text, langs_with_pos, langs_without_pos, search_all_langs_checked);

	//console.log("*** arg_vq = " + arg_vq);
	//console.log("*** arg_q = " + arg_q);

        explain_search = { 'group_by_vol': null, 'query_level': null };
    
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
		    explain_search.query_level  = "[Volume metadata]";
		    if (group_by_vol_checked) {
		        explain_search.group_by_vol = "Search results sorted by volume ID";		            
		    }

		}
	} else {
		if (arg_vq != "") {
			// join the two with an AND
			arg_q = "(" + arg_vq + ")" + " OR " + "(" + arg_q + ")";

			// also implies
		        group_by_vol_checked = true;
		    explain_search.query_level  = "[Volume metadata] OR [page-level POS terms]";
		    explain_search.group_by_vol = "Search results sorted by volume ID";
		}
	        else {
		    explain_search.query_level  = "[page-level POS terms]";
		    if (group_by_vol_checked) {
		        explain_search.group_by_vol = "Search results sorted by volume ID";		            
		    }		    
		}
		doc_units = " pages ";
		show_facet = 0;
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
	//  q=en_NOUN_htrctoken:farming

	store_search_args = {
		q: arg_q,
		indent: arg_indent,
		wt: arg_wt,
		start: arg_start,
		rows: arg_rows,
		facet: "on"
	};

    if (group_by_vol_checked) {
		store_search_args.sort = "id asc";
	}

	var url = "";
	for (k in store_search_args) {
		url += k + '=' + store_search_args[k] + "&";
	}

	for (k in facet) {
		url += 'facet.field=' + facet[k] + "&";
	}
	for (k in filters) {
		_k = filters[k].split("-");
		url += 'fq=' + _k[0] + ':("' + _k[1] + '")&';
	}

	//console.log("Solr URL:\n");

	//console.log(store_search_action + "?" + url);

	$.ajax({
		type: 'GET',
		url: store_search_action,
		data: url,
		dataType: 'json',
		success: show_results,
		error: ajax_error
	});

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

	show_hide_lang()
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
		_k = filters[k].split("-");
		facetlist_html += '<li><a href="javascript:;" class="unselect"><img alt="Delete" src="assets/jquery-ui-lightness-1.12.1/images/cancel.png" class="removeFacetIcon"></a><span class="selectedfieldname">' + _k[0] + '</span>:  ' + _k[1] + '</li>';
	}

	$(".filters").html(facetlist_html);
}


var format_dic = {'BK':'Books', 'CF':'Computer Files', 'MP': 'Maps',
				'MU': 'Music', 'CR': 'Continuing Resources',
				'VM': 'Visual Materials', 'MX': 'Mixed Materials'};

language_dic = {'-gal': 'Oromo', 'bak': 'Bashkir', 'art': 'Artificial (Other)', 'arw': 'Arawak', 'kam': 'Kamba', 'bin': 'Edo', 'bam': 'Bambara', 'lez': 'Lezgian', 'kir': 'Kyrgyz', 'twi': 'Twi', 'iii': 'Sichuan Yi', 'cau': 'Caucasian (Other)', 'tsn': 'Tswana', 'bel': 'Belarusian', 'ypk': 'Yupik languages', 'goh': 'German, Old High (ca. 750-1050)', '-sao': 'Samoan', 'grn': 'Guarani', 'gba': 'Gbaya', 'aze': 'Azerbaijani', 'sag': 'Sango (Ubangi Creole)', 'gil': 'Gilbertese', 'dua': 'Duala', 'mdf': 'Moksha', 'chm': 'Mari', 'ben': 'Bengali', 'sco': 'Scots', 'bur': 'Burmese', 'tyv': 'Tuvinian', 'nyn': 'Nyankole', 'glv': 'Manx', 'per': 'Persian', 'umb': 'Umbundu', 'paa': 'Papuan (Other)', 'lad': 'Ladino', 'ssw': 'Swazi', 'mnc': 'Manchu', 'chg': 'Chagatai', 'her': 'Herero', 'nia': 'Nias', 'alt': 'Altai', 'gla': 'Scottish Gaelic', 'nep': 'Nepali', 'ada': 'Adangme', 'myv': 'Erzya', 'sal': 'Salishan languages', 'cpf': 'Creoles and Pidgins, French-based (Other)', 'oss': 'Ossetic', 'ita': 'Italian', 'fao': 'Faroese', 'ewe': 'Ewe', 'awa': 'Awadhi', 'hrv': 'Croatian', 'fre': 'French', 'kro': 'Kru (Other)', 'lun': 'Lunda', 'eng': 'English', 'lin': 'Lingala', 'ger': 'German', 'syc': 'Syriac', 'lim': 'Limburgish', 'bla': 'Siksika', 'tir': 'Tigrinya', '-eth': 'Ethiopic', 'srp': 'Serbian', 'chi': 'Chinese', 'nzi': 'Nzima', 'tso': 'Tsonga', 'khi': 'Khoisan (Other)', 'sog': 'Sogdian', 'afa': 'Afroasiatic (Other)', '-esk': 'Eskimo languages', 'gor': 'Gorontalo', '-esp': 'Esperanto', 'bal': 'Baluchi', 'nqo': "N'Ko", 'bul': 'Bulgarian', 'dgr': 'Dogrib', 'frr': 'North Frisian', 'tlh': 'Klingon (Artificial language)', '-scc': 'Serbian', 'frs': 'East Frisian', 'raj': 'Rajasthani', 'tel': 'Telugu', 'lui': 'LuiseÃ±o', 'lus': 'Lushai', 'sna': 'Shona', 'wen': 'Sorbian (Other)', 'swa': 'Swahili', 'ach': 'Acoli', 'pol': 'Polish', 'orm': 'Oromo', 'kua': 'Kuanyama', 'kin': 'Kinyarwanda', 'afr': 'Afrikaans', 'bai': 'Bamileke languages', 'bos': 'Bosnian', 'nah': 'Nahuatl', 'sem': 'Semitic (Other)', 'phn': 'Phoenician', 'kut': 'Kootenai', 'cre': 'Cree', 'bej': 'Beja', 'gaa': 'GÃ£', 'sid': 'Sidamo', 'pau': 'Palauan', 'fon': 'Fon', 'kal': 'KalÃ¢tdlisut', '-kus': 'Kusaie', '-mla': 'Malagasy', 'slo': 'Slovak', 'sit': 'Sino-Tibetan (Other)', 'mar': 'Marathi', 'suk': 'Sukuma', 'nic': 'Niger-Kordofanian (Other)', 'iku': 'Inuktitut', 'znd': 'Zande languages', 'tgk': 'Tajik', 'wak': 'Wakashan languages', 'bnt': 'Bantu (Other)', 'yid': 'Yiddish', 'lug': 'Ganda', 'mwr': 'Marwari', 'nau': 'Nauru', 'gez': 'Ethiopic', 'him': 'Western Pahari languages', 'ven': 'Venda', 'nob': 'Norwegian (BokmÃ¥l)', 'dum': 'Dutch, Middle (ca. 1050-1350)', 'cos': 'Corsican', 'kau': 'Kanuri', 'bik': 'Bikol', 'hai': 'Haida', 'mus': 'Creek', 'ave': 'Avestan', 'cel': 'Celtic (Other)', 'pal': 'Pahlavi', 'tli': 'Tlingit', 'crh': 'Crimean Tatar', 'mad': 'Madurese', 'uzb': 'Uzbek', 'efi': 'Efik', 'pro': 'ProvenÃ§al (to 1500)', 'dyu': 'Dyula', 'bua': 'Buriat', 'tai': 'Tai (Other)', 'pon': 'Pohnpeian', 'guj': 'Gujarati', 'arn': 'Mapuche', 'sga': 'Irish, Old (to 1100)', 'amh': 'Amharic', 'zul': 'Zulu', 'inh': 'Ingush', 'elx': 'Elamite', '-cam': 'Khmer', 'lao': 'Lao', 'kos': 'Kosraean', 'bat': 'Baltic (Other)', '-gae': 'Scottish Gaelix', 'egy': 'Egyptian', 'sme': 'Northern Sami', 'del': 'Delaware', 'syr': 'Syriac, Modern', 'kbd': 'Kabardian', 'shn': 'Shan', 'kas': 'Kashmiri', 'nor': 'Norwegian', 'nym': 'Nyamwezi', 'gay': 'Gayo', 'tmh': 'Tamashek', 'hat': 'Haitian French Creole', 'ind': 'Indonesian', 'mal': 'Malayalam', 'non': 'Old Norse', 'kaw': 'Kawi', 'ice': 'Icelandic', 'bih': 'Bihari (Other)', 'ath': 'Athapascan (Other)', 'ltz': 'Luxembourgish', 'war': 'Waray', 'som': 'Somali', 'sux': 'Sumerian', 'was': 'Washoe', 'chu': 'Church Slavic', 'zen': 'Zenaga', 'tha': 'Thai', 'wel': 'Welsh', 'chv': 'Chuvash', 'car': 'Carib', 'ain': 'Ainu', 'nya': 'Nyanja', 'arp': 'Arapaho', 'mul': 'Multiple languages', 'nog': 'Nogai', 'tur': 'Turkish', 'jav': 'Javanese', 'kaz': 'Kazakh', 'abk': 'Abkhaz', 'mlt': 'Maltese', 'kac': 'Kachin', 'got': 'Gothic', 'den': 'Slavey', 'jbo': 'Lojban (Artificial language)', 'sla': 'Slavic (Other)', 'chk': 'Chuukese', '-int': 'Interlingua (International Auxiliary Language Association)', 'ukr': 'Ukrainian', 'heb': 'Hebrew', 'vie': 'Vietnamese', 'tiv': 'Tiv', 'hmn': 'Hmong', 'gon': 'Gondi', 'sun': 'Sundanese', 'sma': 'Southern Sami', 'krl': 'Karelian', 'gem': 'Germanic (Other)', 'kok': 'Konkani', 'lub': 'Luba-Katanga', 'sah': 'Yakut', 'fur': 'Friulian', 'frm': 'French, Middle (ca. 1300-1600)', 'tam': 'Tamil', '-iri': 'Irish', 'dan': 'Danish', 'ira': 'Iranian (Other)', 'krc': 'Karachay-Balkar', 'hmo': 'Hiri Motu', 'lav': 'Latvian', 'xal': 'Oirat', '-max': 'Manx', 'scn': 'Sicilian Italian', 'dsb': 'Lower Sorbian', 'srn': 'Sranan', 'peo': 'Old Persian (ca. 600-400 B.C.)', 'nbl': 'Ndebele (South Africa)', 'srr': 'Serer', 'ang': 'English, Old (ca. 450-1100)', 'ewo': 'Ewondo', 'fiu': 'Finno-Ugrian (Other)', 'snk': 'Soninke', 'aus': 'Australian languages', 'haw': 'Hawaiian', 'hup': 'Hupa', 'mak': 'Makasar', 'bho': 'Bhojpuri', 'mag': 'Magahi', 'dar': 'Dargwa', 'tvl': 'Tuvaluan', 'fat': 'Fanti', 'kur': 'Kurdish', 'tah': 'Tahitian', 'nav': 'Navajo', 'zxx': 'No linguistic content', 'vot': 'Votic', 'cpp': 'Creoles and Pidgins, Portuguese-based (Other)', 'man': 'Mandingo', 'cus': 'Cushitic (Other)', 'fan': 'Fang', 'udm': 'Udmurt', 'mic': 'Micmac', 'cai': 'Central American Indian (Other)', 'btk': 'Batak', 'nub': 'Nubian languages', 'zza': 'Zaz', 'iba': 'Iban', 'fry': 'Frisian', 'ceb': 'Cebuano', 'kum': 'Kumyk', 'min': 'Minangkabau', 'kom': 'Komi', 'rus': 'Russian', 'wol': 'Wolof', '-ajm': 'AljamÃ­a', 'tum': 'Tumbuka', 'xho': 'Xhosa', 'bre': 'Breton', 'und': 'Undetermined', 'pli': 'Pali', 'rom': 'Romani', 'mis': 'Miscellaneous languages', 'kaa': 'Kara-Kalpak', 'baq': 'Basque', 'byn': 'Bilin', 'nai': 'North American Indian (Other)', 'eka': 'Ekajuk', 'sel': 'Selkup', 'asm': 'Assamese', 'lol': 'Mongo-Nkundu', 'cad': 'Caddo', 'chr': 'Cherokee', 'tgl': 'Tagalog', '-lan': 'Occitan (post 1500)', 'men': 'Mende', 'nyo': 'Nyoro', 'tup': 'Tupi languages', 'doi': 'Dogri', 'din': 'Dinka', 'pag': 'Pangasinan', 'bis': 'Bislama', 'kon': 'Kongo', 'aym': 'Aymara', 'hit': 'Hittite', 'yap': 'Yapese', 'bem': 'Bemba', 'run': 'Rundi', 'ipk': 'Inupiaq', 'lat': 'Latin', 'tet': 'Tetum', 'sas': 'Sasak', '-sso': 'Sotho', 'mao': 'Maori', 'tut': 'Altaic (Other)', '-swz': 'Swazi', 'mdr': 'Mandar', 'ara': 'Arabic', 'fij': 'Fijian', 'swe': 'Swedish', 'ilo': 'Iloko', 'rap': 'Rapanui', 'kru': 'Kurukh', 'aar': 'Afar', 'snd': 'Sindhi', 'afh': 'Afrihili (Artificial language)', 'inc': 'Indic (Other)', 'fil': 'Filipino', 'mlg': 'Malagasy', 'glg': 'Galician', 'smn': 'Inari Sami', 'rum': 'Romanian', '-scr': 'Croatian', 'lit': 'Lithuanian', 'nde': 'Ndebele (Zimbabwe)', 'zun': 'Zuni', 'mah': 'Marshallese', 'anp': 'Angika', 'tuk': 'Turkmen', 'kha': 'Khasi', 'tig': 'TigrÃ©', 'chp': 'Chipewyan', 'tib': 'Tibetan', 'ile': 'Interlingue', 'luo': 'Luo (Kenya and Tanzania)', 'dra': 'Dravidian (Other)', 'ota': 'Turkish, Ottoman', 'gle': 'Irish', 'nap': 'Neapolitan Italian', 'tem': 'Temne', 'sai': 'South American Indian (Other)', 'cpe': 'Creoles and Pidgins, English-based (Other)', 'yao': 'Yao (Africa)', 'ava': 'Avaric', 'mni': 'Manipuri', 'iro': 'Iroquoian (Other)', 'new': 'Newari', 'oci': 'Occitan (post-1500)', 'mga': 'Irish, Middle (ca. 1100-1550)', 'sam': 'Samaritan Aramaic', '-tru': 'Truk', 'rup': 'Aromanian', 'jpr': 'Judeo-Persian', 'wal': 'Wolayta', 'akk': 'Akkadian', 'hil': 'Hiligaynon', 'grb': 'Grebo', 'cop': 'Coptic', 'sin': 'Sinhalese', 'hau': 'Hausa', 'zha': 'Zhuang', 'hun': 'Hungarian', 'ibo': 'Igbo', '-snh': 'Sinhalese', 'uga': 'Ugaritic', '-sho': 'Shona', 'gre': 'Greek, Modern (1453-)', 'pan': 'Panjabi', 'lua': 'Luba-Lulua', 'ale': 'Aleut', 'fin': 'Finnish', 'nno': 'Norwegian (Nynorsk)', 'pap': 'Papiamento', 'sot': 'Sotho', 'tat': 'Tatar', 'rar': 'Rarotongan', 'son': 'Songhai', 'roh': 'Raeto-Romance', 'lam': 'Lamba (Zambia and Congo)', '-gag': 'Galician', 'ban': 'Balinese', 'cze': 'Czech', 'tkl': 'Tokelauan', 'osa': 'Osage', 'smi': 'Sami', 'ter': 'Terena', 'enm': 'English, Middle (1100-1500)', 'dzo': 'Dzongkha', 'hsb': 'Upper Sorbian', 'pra': 'Prakrit languages', 'arm': 'Armenian', '-tsw': 'Tswana', 'kho': 'Khotanese', 'wln': 'Walloon', 'grc': 'Greek, Ancient (to 1453)', 'ton': 'Tongan', 'may': 'Malay', '-tag': 'Tagalog', 'arg': 'Aragonese', 'ber': 'Berber (Other)', 'vol': 'VolapÃ¼k', '-mol': 'Moldavian', 'sgn': 'Sign languages', 'map': 'Austronesian (Other)', 'jrb': 'Judeo-Arabic', 'smj': 'Lule Sami', 'aka': 'Akan', '-gua': 'Guarani', 'mun': 'Munda (Other)', 'cor': 'Cornish', 'roa': 'Romance (Other)', 'alg': 'Algonquian (Other)', 'sat': 'Santali', 'yor': 'Yoruba', 'phi': 'Philippine (Other)', 'mos': 'MoorÃ©', 'gmh': 'German, Middle High (ca. 1050-1500)', 'hin': 'Hindi', 'epo': 'Esperanto', 'ina': 'Interlingua (International Auxiliary Language Association)', 'nso': 'Northern Sotho', 'srd': 'Sardinian', 'mno': 'Manobo languages', 'vai': 'Vai', '-fri': 'Frisian', 'mkh': 'Mon-Khmer (Other)', 'ijo': 'Ijo', 'sio': 'Siouan (Other)', 'cmc': 'Chamic languages', '-lap': 'Sami', 'mwl': 'Mirandese', 'sus': 'Susu', 'ori': 'Oriya', 'oto': 'Otomian languages', '-far': 'Faroese', 'uig': 'Uighur', 'est': 'Estonian', 'bug': 'Bugis', 'cho': 'Choctaw', 'crp': 'Creoles and Pidgins (Other)', 'apa': 'Apache languages', '-tar': 'Tatar', 'urd': 'Urdu', 'cha': 'Chamorro', 'dut': 'Dutch', 'moh': 'Mohawk', 'slv': 'Slovenian', 'lah': 'LahndÄ', 'smo': 'Samoan', 'csb': 'Kashubian', 'loz': 'Lozi', 'tog': 'Tonga (Nyasa)', 'bad': 'Banda languages', 'cat': 'Catalan', '-taj': 'Tajik', 'ido': 'Ido', 'bas': 'Basa', 'div': 'Divehi', 'kor': 'Korean', 'nwc': 'Newari, Old', 'arc': 'Aramaic', 'sad': 'Sandawe', 'ndo': 'Ndonga', 'zap': 'Zapotec', 'alb': 'Albanian', 'sms': 'Skolt Sami', 'nds': 'Low German', 'mas': 'Maasai', 'ssa': 'Nilo-Saharan (Other)', 'kmb': 'Kimbundu', 'ace': 'Achinese', 'chy': 'Cheyenne', 'ady': 'Adygei', 'ast': 'Bable', 'gwi': "Gwich'in", 'kik': 'Kikuyu', 'kab': 'Kabyle', 'gsw': 'Swiss German', 'por': 'Portuguese', 'pam': 'Pampanga', 'jpn': 'Japanese', 'mai': 'Maithili', 'que': 'Quechua', 'ine': 'Indo-European (Other)', 'oji': 'Ojibwa', 'mac': 'Macedonian', 'zbl': 'Blissymbolics', 'san': 'Sanskrit', 'chn': 'Chinook jargon', 'dak': 'Dakota', 'chb': 'Chibcha', 'khm': 'Khmer', 'mon': 'Mongolian', 'pus': 'Pushto', 'kan': 'Kannada', 'spa': 'Spanish', 'fro': 'French, Old (ca. 842-1300)', 'day': 'Dayak', 'che': 'Chechen', 'tpi': 'Tok Pisin', 'ful': 'Fula', 'niu': 'Niuean', 'myn': 'Mayan languages', 'kpe': 'Kpelle', 'kar': 'Karen languages', 'bra': 'Braj', 'geo': 'Georgian', 'tsi': 'Tsimshian'};

place_dic = {'af': 'Afghanistan', 'ie': 'Ireland', 'ctu': 'Connecticut', '-tkr': 'Turkmen S.S.R.',
'tk': 'Turkmenistan', 'wyu': 'Wyoming', 'sh': 'Spanish North Africa', '-gn': 'Gilbert and Ellice Islands',
'aa': 'Albania', 'mm': 'Malta', 'nbu': 'Nebraska', '-cz': 'Canal Zone', 'dcu': 'District of Columbia', 'gr': 'Greece',
'abc': 'Alberta', 'ts': 'United Arab Emirates', 'ci': 'Croatia', 'tma': 'Tasmania', '-mvr': 'Moldavian S.S.R.',
'-ln': 'Central and Southern Line Islands', 'riu': 'Rhode Island', 'xc': 'Maldives', 'fr': 'France', 'nw': 'Northern Mariana Islands',
'pw': 'Palau', 'np': 'Nepal', 'ws': 'Samoa', 'xoa': 'Northern Territory', 'ko': 'Korea (South)', 'ai': 'Armenia (Republic)',
'snc': 'Saskatchewan', 'ck': 'Colombia', 'my': 'Malaysia', '-sk': 'Sikkim', 'cm': 'Cameroon', 'cq': 'Comoros', 'ii': 'India',
'mdu': 'Maryland', 'lv': 'Latvia', 'nju': 'New Jersey', 'pk': 'Pakistan', 'nik': 'Northern Ireland', 'am': 'Anguilla',
'-pt': 'Portuguese Timor', '-kgr': 'Kirghiz S.S.R.', 'sr': 'Surinam', 'scu': 'South Carolina', 'cu': 'Cuba', '-err': 'Estonia',
'xb': 'Cocos (Keeling) Islands', 'xa': 'Christmas Island (Indian Ocean)', 'xp': 'Spratly Island', '-ge': 'Germany (East)',
'iau': 'Iowa', 'nfc': 'Newfoundland and Labrador', 'pp': 'Papua New Guinea', 'gm': 'Gambia', 'deu': 'Delaware',
'xe': 'Marshall Islands', 'vm': 'Vietnam', 'qea': 'Queensland', 'jo': 'Jordan', 'tnu': 'Tennessee', 'aj': 'Azerbaijan',
'ksu': 'Kansas', '-vs': 'Vietnam, South', 'tc': 'Turks and Caicos Islands', 'sd': 'South Sudan', 'tu': 'Turkey', 'at': 'Australia',
'ss': 'Western Sahara', 'bt': 'Bhutan', 'wj': 'West Bank of the Jordan River', '-ui': 'United Kingdom Misc. Islands',
'cou': 'Colorado', 'xxu': 'United States', 'au': 'Austria', 'cx': 'Central African Republic', 'ce': 'Sri Lanka', 'bcc': 'British Columbia',
'fa': 'Faroe Islands', 'ic': 'Iceland', 'bs': 'Botswana', 'rb': 'Serbia', 'mp': 'Mongolia', 'xl': 'Saint Pierre and Miquelon',
'gw': 'Germany', 'nhu': 'New Hampshire', 'onc': 'Ontario', 'nr': 'Nigeria', 'vau': 'Virginia', 'gt': 'Guatemala', 'sl': 'Sierra Leone',
'et': 'Ethiopia', '-kzr': 'Kazakh S.S.R.', 'tl': 'Tokelau', 'aku': 'Alaska', 'aca': 'Australian Capital Territory', 'stk': 'Scotland',
'xf': 'Midway Islands', 'xga': 'Coral Sea Islands Territory', '-sv': 'Swan Islands', 'vtu': 'Vermont', 'pn': 'Panama', 'it': 'Italy',
'jm': 'Jamaica', 'mr': 'Morocco', '-gsr': 'Georgian S.S.R.', 'oku': 'Oklahoma', 'gv': 'Guinea', 'wau': 'Washington (State)',
'bo': 'Bolivia', '-nm': 'Northern Mariana Islands', 'tz': 'Tanzania', 'cl': 'Chile', 'dq': 'Dominica', 'bl': 'Brazil',
'em': 'Timor-Leste', 'ku': 'Kuwait', 'lo': 'Lesotho', '-tt': 'Trust Territory of the Pacific Islands', 'meu': 'Maine',
'io': 'Indonesia', '-unr': 'Ukraine', 'tv': 'Tuvalu', 'go': 'Gabon', 'gp': 'Guadeloupe', 'ho': 'Honduras', 'sc': 'Saint-BarthÃ©lemy',
'-cp': 'Canton and Enderbury Islands', '-bwr': 'Byelorussian S.S.R.', 'rw': 'Rwanda', 'ot': 'Mayotte', '-ajr': 'Azerbaijan S.S.R.',
'-xi': 'Saint Kitts-Nevis-Anguilla', 'cr': 'Costa Rica', 'su': 'Saudi Arabia', '-iu': 'Israel-Syria Demilitarized Zones',
'sw': 'Sweden', 'sp': 'Spain', 'nu': 'Nauru', 'inu': 'Indiana', 'miu': 'Michigan', 'un': 'Ukraine', 'ta': 'Tajikistan',
'an': 'Andorra', 'vc': 'Vatican City', 'mq': 'Martinique', '-ac': 'Ashmore and Cartier Islands', 'mbc': 'Manitoba',
'xx': 'No place', 'gd': 'Grenada', 'fp': 'French Polynesia', 'mtu': 'Montana', 'enk': 'England',
'-ai': 'Anguilla', 'alu': 'Alabama', 'sdu': 'South Dakota', '-rur': 'Russian S.F.S.R.', 'xd': 'Saint Kitts-Nevis',
'pf': 'Paracel Islands', 'ja': 'Japan', 'mau': 'Massachusetts', 'dk': 'Denmark', 'xn': 'Macedonia', '-vn': 'Vietnam, North',
'mu': 'Mauritania', 'hiu': 'Hawaii', '-na': 'Netherlands Antilles', 'azu': 'Arizona', '-ys': "Yemen (People's Democratic Republic)",
'xh': 'Niue', 'es': 'El Salvador', 'nx': 'Norfolk Island', 'gb': 'Kiribati', 'ke': 'Kenya', 'py': 'Paraguay', 'xv': 'Slovenia',
'lh': 'Liechtenstein', 'aru': 'Arkansas', 'txu': 'Texas', 'bg': 'Bangladesh', 'is': 'Israel', 'ft': 'Djibouti', '-lir': 'Lithuania', 'cj': 'Cayman Islands', 'ohu': 'Ohio', 'mk': 'Oman', 'gau': 'Georgia', 'za': 'Zambi', 'uy': 'Uruguay', 'sg': 'Senegal', '-uk': 'United Kingdom', 'wf': 'Wallis and Futuna', 'fs': 'Terres australes et antarctiques franÃ§aises', 'kz': 'Kazakhstan', 'ly': 'Libya', 'utu': 'Utah', 'cb': 'Cambodia', 'ug': 'Uganda', '-cn': 'Canada', 'vra': 'Victoria', '-hk': 'Hong Kong', 'nsc': 'Nova Scotia', 'bi': 'British Indian Ocean Territory', 'cy': 'Cyprus', 'sq': 'Swaziland', 'nn': 'Vanuatu', 'so': 'Somalia', 'pg': 'Guinea-Bissau', '-yu': 'Serbia and Montenegro', 'cd': 'Chad', 'ml': 'Mali', 'gs': 'Georgia (Republic)', 'gz': 'Gaza Strip', 'cw': 'Cook Islands', '-lvr': 'Latvia', 'qa': 'Qatar', 'ye': 'Yemen', 'xs': 'South Georgia and the South Sandwich Islands', 'nvu': 'Nevada', '-sb': 'Svalbard', 'ag': 'Argentina', 'st': 'Saint-Martin', 'lb': 'Liberia', 'mx': 'Mexico', 'ae': 'Algeria', 'uv': 'Burkina Faso', '-cs': 'Czechoslovakia', 'ls': 'Laos', '-ry': 'Ryukyu Islands, Southern', 'pl': 'Poland', 're': 'RÃ©union', 'lau': 'Louisiana', 'ph': 'Philippines', 'th': 'Thailand', 'fm': 'Micronesia (Federated States)', 'bp': 'Solomon Islands', 'si': 'Singapore', 'nq': 'Nicaragua', 'kv': 'Kosovo', 'kyu': 'Kentucky', 'ba': 'Bahrain', 'hm': 'Heard and McDonald Islands', 'cg': 'Congo (Democratic Republic)', 'mg': 'Madagascar', 'iy': 'Iraq-Saudi Arabia Neutral Zone', 'mv': 'Moldova', 'uik': 'United Kingdom Misc. Islands', 'po': 'Portugal', 'gu': 'Guam', 'xna': 'New South Wales', 'ir': 'Iran', 'wk': 'Wake Island', 'dr': 'Dominican Republic', 'eg': 'Equatorial Guinea', 'iv': "CÃ´te d'Ivoire", 'bu': 'Bulgaria', 'xxc': 'Canada', 'ykc': 'Yukon Territory', 'bm': 'Bermuda Islands', 'pe': 'Peru', 'nyu': 'New York (State)', 'aq': 'Antigua and Barbuda', 'dm': 'Benin', 'bv': 'Bouvet Island', '-uzr': 'Uzbek S.S.R.', 'sx': 'Namibia', '-air': 'Armenian S.S.R.', 'kn': 'Korea (North)', 'fj': 'Fiji', 'bw': 'Belarus', '-wb': 'West Berlin', 'fi': 'Finland', 'mc': 'Monaco', 'nz': 'New Zealand', 'ch': 'China (Republic : 1949- )', 'vi': 'Virgin Islands of the United States', 'ti': 'Tunisia', 'no': 'Norway', 'ng': 'Niger', 'sj': 'Sudan', 'lu': 'Luxembourg', 'gy': 'Guyana', 'xr': 'Czech Republic', 'fk': 'Falkland Islands', 'mou': 'Missouri', 'idu': 'Idaho', 'ao': 'Angola', 'nmu': 'New Mexico', 'le': 'Lebanon', 'ua': 'Egypt', 'xo': 'Slovakia', 'pr': 'Puerto Rico', 'wlk': 'Wales', 'li': 'Lithuania', 'sf': 'Sao Tome and Principe', 'xm': 'Saint Vincent and the Grenadines', 'br': 'Burma', 'be': 'Belgium', 'oru': 'Oregon', 'mw': 'Malawi', 'flu': 'Florida', '-mh': 'Macao', 'ht': 'Haiti', 'pau': 'Pennsylvania', 'cc': 'China', 'xra': 'South Australia', 'bn': 'Bosnia and Herzegovina', 'xxk': 'United Kingdom', 'ncu': 'North Carolina', 'rm': 'Romania', 'mf': 'Mauritius', 'tr': 'Trinidad and Tobago', 'up': 'United States Misc. Pacific Islands', '-jn': 'Jan Mayen', 'uc': 'United States Misc. Caribbean Islands', 'er': 'Estonia', 'mj': 'Montserrat', 'se': 'Seychelles', 'nkc': 'New Brunswick', '-ur': 'Soviet Union', 'fg': 'French Guiana', 'bb': 'Barbados', 'ec': 'Ecuador', 'iq': 'Iraq', 'ilu': 'Illinois', 'as': 'American Samoa', 'bx': 'Brunei', 'bd': 'Burundi', 'ea': 'Eritrea', 'quc': 'QuÃ©bec (Province)', 'ji': 'Johnston Atoll', 'nuc': 'Nunavut', 'cau': 'California', 'xj': 'Saint Helena', 'ndu': 'North Dakota', 'sz': 'Switzerland', 'wea': 'Western Australia', 'ca': 'Caribbean Netherlands', 'nl': 'New Caledonia', 'sa': 'South Africa', 'sy': 'Syria', 'ne': 'Netherlands', 'mo': 'Montenegro', 'ay': 'Antarctica', 'mz': 'Mozambique', 'gi': 'Gibraltar', 'pic': 'Prince Edward Island', 'sn': 'Sint Maarten', 'kg': 'Kyrgyzstan', 'rh': 'Zimbabwe', 'hu': 'Hungary', 'aw': 'Aruba', '-iw': 'Israel-Jordan Demilitarized Zones', 'vp': 'Various places', '-us': 'United States', 'uz': 'Uzbekistan', 'bf': 'Bahamas', 'co': 'CuraÃ§ao', 'sm': 'San Marino', 'msu': 'Mississippi', '-xxr': 'Soviet Union', 'ntc': 'Northwest Territories', 'tg': 'Togo', 'xk': 'Saint Lucia', 'vb': 'British Virgin Islands', 've': 'Venezuela', 'wvu': 'West Virginia', 'mnu': 'Minnesota', 'bh': 'Belize', 'wiu': 'Wisconsin', 'cv': 'Cabo Verde', 'gl': 'Greenland', 'to': 'Tonga', 'cf': 'Congo (Brazzaville)', '-tar': 'Tajik S.S.R.', 'gh': 'Ghana', 'pc': 'Pitcairn Island', 'ru': 'Russia (Federation)'};




