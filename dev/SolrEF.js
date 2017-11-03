"use strict";

var QueryTabEnum = {
    Page: 0,
    Volume: 1,
    Combined: 2,
    Advanced: 3
};

var InteractionStyleEnum = {
    DragAndDrop: 1,
    Checkboxes: 2,
    Hybrid: 3
};


var store_query_tab_selected = null;
var store_interaction_style = null;

var store_search_xhr = null;

var group_by_vol_checked = 0;
var doc_unit  = "";
var doc_units = "";


// add_titles_ht() designed to work with information return by HT Metadata API
// => Deprecated, as this information can now be returned by Solr directly

function add_titles_ht(json_data)
{
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
		
		var ws_span = '<span class="workset" style="display: none;"><br />[Workset: <span name="' + itemURL + '"></span>]</span>';
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

// The following works with the JSON data returned by a Solr search

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
	if (doc_val.names_ss) {
	    var names = doc_val.names_ss.map(strtrim).join(", ");
	    if (!names.match(/^\s*$/)) {
		details.push("Author(s): " + names);
	    }
	}
	if (doc_val.genre_ss) {
	    var genres = doc_val.genre_ss.map(strtrim).join(", ");
	    if (!genres.match(/^\s*$/)) {
		details.push("Genre: " + genres.capitalize() );
	    }
	}
	if (doc_val.pubDate_s && !doc_val.pubDate_s.match(/^\s*$/)) {
	    details.push("Publication date: " + doc_val.pubDate_s);
	}
	if (doc_val.pubPlace_s && !doc_val.pubPlace_s.match(/^\s*$/)) {
	    var pp_val = facet_filter.prettyPrintTerm("pubPlace_s",doc_val.pubPlace_s)
	    details.push("Place of Publication: " + pp_val);
	}
	if (doc_val.language_s && !doc_val.language_s.match(/^\s*$/)) {
	    var pp_val = facet_filter.prettyPrintTerm("language_s",doc_val.language_s)
	    details.push("Language: " + pp_val);
	}
	if (doc_val.typeOfResource_s && !doc_val.typeOfResource_s.match(/^\s*$/)) {
	    details.push("Resource type: " + doc_val.typeOfResource_s.capitalize() );
	}

	var details_str = details.map(strtrim).join(";\n");	    
	var $tooltip_title = $('<span />').attr('title',details_str).html(title);
	
	$("[name='" + htid + "']").each(function () {
	    var $tooltip_title_clone = $tooltip_title.clone();
	    $tooltip_title_clone.tooltip();
	    $(this).html($tooltip_title_clone)
	});
	console.log(htid + ", title = " + title);

	// Change any non-public domain seq links to view internal JSON EF-POS volume
	var $result_line = $("[name='" + htid + "']").parent();
	var $seq_matches = $result_line.find("nobr>a[class^='seq']");
	
	//$("[name='" + htid + "'] ~ nobr>a[class^='seq']").each(function () {

	$seq_matches.each(function() {
	    var rights = doc_val.rightsAttributes_s;

	    //if ((rights != "pd") && (rights != "pdus")) { // ****
	    //if (rights != "pd") { // ****
		var href = 'json-page-viewer-dev.html?htid='+htid;

		var seq_str = $(this).text();

		if (seq_str == "all pages") {
		    href += "&seq=1";
		}
		else if (seq_str.match(/^seq\s+/)) {
		    var seq_num = seq_str.replace(/^seq\s+/,"");
		    href += "&seq=" + seq_num;
		}
		href += "&rights=" + rights;
		href += "&title=" + title;
		
		
		$(this).attr('href',href);
	    //}
	});
					
	var itemURL = doc_val.handleUrl_s;
	itemURL = itemURL.replace(/^https:/, "http:");
	
	var ws_span = '<span class="workset" style="display: none;"><br />';
	ws_span += '[Workset: <span name="' + itemURL + '"></span>]</span>';
	
	$("[name='" + htid + "']").each(function () {
	    $(this).append(ws_span)
	});
	itemURLs.push(itemURL);
    });
    
    workset_enrich_results(itemURLs);
}



function ajax_solr_text_search(newSearch,newResultPage)
{
    var url_args = [];

    for (var ka in store_search_args) {
	var ka_arg = store_search_args[ka];
	
	if (ka == "q") {
	    if (store_search_not_ids.length>0) {
		ka_arg += store_search_not_ids.join(" ");
	    }
	}
	url_args.push(ka + '=' + ka_arg);
    }

    url_args = facet_filter.solrSearchAppendArgs(url_args);
        
    var data_str = url_args.join("&");
    
    store_search_url = store_search_action + "?" + data_str;

    store_search_xhr = new window.XMLHttpRequest();
    
    $.ajax({
	type: "POST", // used to be "GET"
	url: store_search_action,
	data: data_str,
	dataType: "json",
	xhr : function() {
	    return store_search_xhr;
	},
	success: function(jsonData) { 
	    if (group_by_vol_checked) {
		// Possible merging of items in search results means
		// page-bar next pages not directly computable
		// => don't show page-bar, only give 'next' and 'prev'
		$('#page-bar').hide();
		$('#next-prev').show();
		show_results(jsonData,newSearch,newResultPage);		
	    }
	    else {
		// No merging of search result items possible
		// => can provide page-bar to user
		if (num_found==0) {
		    num_found=jsonData.response.numFound;
		    if (num_found>0) {

			$('#next-prev').hide();
			$('#page-bar').show();
			
			$('#page-bar').Paging({
			    pagesize: num_results_per_page,
			    count: num_found,
			    toolbar: true ,changePagesize: function(ps) {
				num_results_per_page=ps;
				store_search_args.rows=ps;
				store_search_args.start =0;
				num_found=0;
				$('#page-bar').html('');
				ajax_solr_text_search(true,true);
			    },
			    callback: function(a) {
				store_search_args.start = (a-1)* parseInt(num_results_per_page);
				show_updated_results();
			    }
			});
		    }
		}
		if (jsonData.response.numFound==0) {
		    $('#page-bar').html('');
		}
		show_results(jsonData,newSearch,newResultPage);
	    }
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    $('.search-in-progress').css("cursor","auto");
	    iprogressbar.cancel();
	    ajax_error(jqXHR, textStatus, errorThrown)
	}
    });
}


function show_volume_count(jsonData)
{
    $('#srt-vol-count').css("cursor","auto");
    
    var response = jsonData["result-set"];
    var docs = response.docs;
    var num_docs = docs.length;

    num_docs--; // last entry provides response time data

    var $num_docs_span = $('<span>')
	.attr('id','srt-vol-count-num')
	.data('raw-num',num_docs)
	.append(num_docs.toLocaleString());

    var vol_label = (num_docs==1) ? " volume" : " volumes";
    $('#srt-vol-count-computing').hide();
    $('#srt-vol-count').html(" in ").append($num_docs_span).append(vol_label);
    $('#srt-vol-count').show();
    
    if (num_docs < num_found_vol_limit) {
	if (!$('#export-by').is(":visible")) {	
	    $('#export-by').fadeIn(1500);
	}
    }
    else {
	$('#export-by').hide("slide", { direction: "up" }, 1000);

	$('#srt-vol-count').append(' <span style="color:#BB0000;">'
				   +'[Note: Exporting disabled for this search. Volume count exceeds limit of '
				   + num_found_vol_limit.toLocaleString() + ']</span>');
    }


}


function show_updated_results()
{
    $('.search-in-progress').css("cursor","wait");
    
    ajax_solr_text_search(false,true); // newSearch=false, newResultPage=true
}

function show_new_results(delta) {
    
    var start = parseInt(store_search_args.start)
    
    store_search_args.start = start + parseInt(delta);

    show_updated_results();
}

				
function generate_item(line_num, id, id_pages, merge_with_previous)
{
    var css_class = 'class="oddevenline" style="position: relative;"';
    
    var html_item = "";
    var seq_item  = "";
    
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
    download_span +=      '<a download href="'+ef_download_url+'?download-id='+id+'">';
    download_span +=        '<span class="ui-icon ui-icon-circle-arrow-s"></span>';
    download_span +=         download_text;
    download_span +=      '</a>';
    download_span +=    '</div>';

    var opt_dnd_style = "";
    if ((store_interaction_style != InteractionStyleEnum.DragAndDrop) 
    	&& (store_interaction_style != InteractionStyleEnum.Hybrid)) {
	opt_dnd_style = " style-hidden";
    }

    var delete_div_classes = "ui-button ui-corner-all ui-widget ui-button-icon-only ui-dialog-titlebar-close";
    var delete_div = '<div class="htrc-delete-container drag-and-drop-style'+opt_dnd_style+'" style="float: right;">';
    delete_div += '     <button type="button" id="result-set-delete-'+line_num+'" class="htrc-delete" ';
    delete_div +=          'class="'+delete_div_classes+'" ';
    delete_div +=          'title="Remove item from result set">';
    delete_div +=         '<span class="ui-button-icon ui-icon ui-icon-closethick"></span>';
    delete_div +=         '<span class="ui-button-icon-space"> </span>';
    delete_div +=      '</button>';
    delete_div +=    '</div>';

    
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

    var opt_checkbox_style = "";
    if ((store_interaction_style != InteractionStyleEnum.Checkboxes) 
    	&& (store_interaction_style != InteractionStyleEnum.Hybrid)) {
	opt_checkbox_style = " style-hidden";
    }

    for (var pi = 0; pi < id_pages_len; pi++) {
	var page = id_pages[pi];
	
	var seqnum = (page == 0) ? 1 : page;
	var babel_url = babel_prefix_url + "?id=" + id + ";view=1up;seq=" + seqnum;

	var seqs_outer_div_id = "seqs-outer-div-"+line_num;

	var checkbox_input = '<div class="sr-input-item checkbox-style'+opt_checkbox_style+'" style="position: absolute; left: -18px;">';
	checkbox_input += '<input type="checkbox" class="sr-input-item-pending" name="checkbox-'+seqs_outer_div_id+'" id="checkbox-' + seqs_outer_div_id+'" />';
	checkbox_input += '</div>';

	
	if (id_pages_len > 1) {
	    
	    if (pi == 0) {
		html_item += '<div id="'+seqs_outer_div_id+'" ' + css_class + '>';
		html_item += checkbox_input;

		html_item += delete_div;
		
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
	    html_item += '<div id="'+seqs_outer_div_id+'" ' + css_class + '>';
	    html_item += checkbox_input;
	    html_item += delete_div;
	    
	    html_item += '<span style="font-style: italic;" name="' + id + '">';
	    html_item += '<span style="cursor: progress;">Loading ...</span></span><br />';
	    
	    if (page > 0) {
		html_item += '<span>'+id + ':</span> ';
		seq_item += '<nobr><a class="seq" target="_blank" href="' + babel_url + '">seq&nbsp;' + seqnum + '</a>';
	    } else {
		// dealing with 'phony' page => show 'all pages'
		html_item += '<span>'+id + ':</span> ';
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


var store_start;
var store_num_pages;
var store_line_num;
var store_id;

var store_result_page_starts = [];

function show_results(jsonData,newSearch,newResultPage)
{
	 
    var response = jsonData.response;
    var num_found = response.numFound;
    var docs = response.docs;
    var num_docs = docs.length;

    // ajax call has returned successfully
    store_search_xhr = null;
    
    var search_start = parseInt(store_search_args.start);

    if (newResultPage) {
	// at the top of a new result page to show
	store_start = search_start;
	store_line_num = 1;
	store_id = null;

	//if (search_start == 0) {
	if (newSearch) {
	    // The very beginning of the search results
	    iprogressbar.cancel();
	    
	    $('#export-by').hide(); // hide until volume count is in
	}
	
	facet_filter.display(jsonData.facet_counts)
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

    store_query_level_mix = volume_level_desc;
    
    if (store_query_level_mix != null) {
	if (page_level_desc != null) {
	    store_query_level_mix += " AND " + page_level_desc; 
	}
    }
    else {
	store_query_level_mix = page_level_desc;
    }

    if (newResultPage) {
	    
	var explain_html = show_results_explain_html(store_query_level_mix,store_search_url)
	
	if (num_docs > 0) {

	    if (newSearch) {
		// The very beginning of the search results

		$('#search-results-total').show();
	    }
	    
	    var $num_found_span = $('<span>')
		.attr('id','results-total-num')
	    	.data('raw-num',num_found)
		.append(num_found.toLocaleString());

	    var doc_units_label = (num_found==1) ? doc_unit : doc_units;
	    $('#search-results-total-span')
		.html("Results: ")
		.append($num_found_span)
		.append(doc_units_label + "matched");

	    if (search_start == 0) {

		if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
		    if (num_found < num_found_page_limit) {
			$('#srt-vol-count-computing').show();
			$('#srt-vol-count').html("");
			$('#srt-vol-count-span').show();
			
			$("#export-by-vol").show();
			$("#export-by-page").show();
			
			ajax_solr_stream_volume_count(store_search_args.q,true,show_volume_count); // doRollup=true
			$("#export-ef-zip").show();
			$("#export-ef-to-registry").show();
		    }
		    else {
			$('#srt-vol-count-computing').hide();
			$('#srt-vol-count').html('<span style="color:#BB0000;">'
						 +'[Note: Exporting disabled for this search. Page count exceeds limit of '
						 + num_found_page_limit.toLocaleString() + ']</span>');
			$('#srt-vol-count').show();
			$('#srt-vol-count-span').show();
		    }
		}		
		else {
		    // volume level
		    if (num_found < num_found_vol_limit) {
			$("#export-by-vol").show();
			$("#export-by-page").hide();
			$("#export-ef-zip").show();
			$("#export-ef-to-registry").show();

			//$("#srt-ef-export").show(); // ***** does this even exist anymore?
			$("#export-by").fadeIn(1500);
			
			// restore vol-count display back to default text, ready for next vol count computation
			$('#srt-vol-count-computing').show();
			$('#srt-vol-count').hide();
			$('#srt-vol-count-span').hide();
		    }
		    else {
			$('#srt-vol-count-computing').hide();
			$('#srt-vol-count').html('<span style="color:#BB0000;">'
						 +'[Note: Exporting disabled for this search. Volume count exceeds limit of '
						 + num_found_vol_limit.toLocaleString() + ']</span>');
			$('#srt-vol-count').show();
			$('#srt-vol-count-span').show();
		    }		
		}
	    
		$('#search-explain').html(explain_html);
		show_hide_solr_q();
		
		//$('#next-prev').show();
		//$('#page-bar').show();
			
	    }
	    var from = parseInt(store_search_args.start) + 1;
	    var to = from + store_search_args.rows - 1;
	    
	    if (to > num_found) {
		// cap value
		to = num_found;
	    }
	    
	    var showing_matches = "<div>";
	    showing_matches += (facet_filter.getFacetLevel() == FacetLevelEnum.Page)
		? "Showing page-level matches: "
		: "Showing volume matches:";
	    
	    showing_matches += '<span id="sm-from">' + from.toLocaleString() + '</span>';
	    showing_matches += "-";
	    showing_matches += '<span id="sm-to">' + to.toLocaleString() + '</span>';
	    showing_matches += "</div>";
	    
	    $('#search-showing').html(showing_matches);
	    $('#sm-to').data('raw-num',to);
	    
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
	    
	    //$('#next-prev').hide();
		//$('#page-bar').hide();
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
		    var prev_seq_count = prev_seqs.length;

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
		    result_set_delete_item(line_num);
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
		result_set_delete_item(line_num);
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
		result_set_delete_item(line_num);
		store_line_num = line_num +1; // next line position
	    }	    
	}
	else {
	    var html_item = generate_item(line_num, prev_id, prev_pages, false); // merge_with_previous=false
	    $search_results.append(html_item);
	    show_hide_more_seqs(line_num);
	    result_set_delete_item(line_num);
	    store_line_num = line_num +1; // next line position
	}
    }

    // Add change listeners to newly added items	
    $('input.sr-input-item-pending').each(function() {
	var $this_checkbox = $(this);
	
	$this_checkbox.on("change",function(event) {

	    if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
		update_select_all_none_buttons();
		console.log("*** in checkbox only mode => returning (having updated count)");
		return;
	    }
		
	    var $my_selected_item = $this_checkbox.closest("#search-results > div.ui-selectee");
	    
	    if ($this_checkbox.is(':checked')) {
		//console.log("*** checkbox id " + $this_checkbox.attr("id") + " checked ON"); // ****
		
		if (!$my_selected_item.hasClass("ui-draggable")) {
		    if (shoppingcart_debug) {
			console.log("** making draggable, selected_item = " + $my_selected_item[0]); // ****
		    }
		    $my_selected_item.addClass("ui-selected");
		    make_draggable($my_selected_item);
		}
		
	    }
	    else {
		//console.log("*** checkbox id " + $this_checkbox.attr("id") + " checked OFF"); // ****
		if ($my_selected_item.hasClass("ui-draggable")) {
		    console.log("*** removing draggable");
		    $my_selected_item.draggable("destroy");
		    $my_selected_item.find(".ui-selected").removeClass("ui-selected"); // in case an inner element selected from a rubber-band drag
		    $my_selected_item.removeClass("ui-selected");
		}
	    }
	});

	$this_checkbox.attr("class","sr-input-item");
    });

    // update display for any items that are already in the shoppingcart
    $("#search-results .htrc-delete").each(function() {
	var $close_button = $(this);
	var $close_div = $close_button.parent();
	var id = $close_div.next().attr("name");

//	if (jQuery.inArray(id,store_shoppingcart_ids) >= 0) { // ****
	if (store_shoppingcart_ids_hash.hasOwnProperty(id)) {
	    console.log("**** updating icon to be shopping cart!!");
	    convert_close_to_shoppingcart_action($close_button);
	}
    });
    
    
    //var selectable_on = getURLParameter("selectable"); // ****
    //if (parseInt(selectable_on)) {
	$('#trashcan-drop').show();
	$('#shoppingcart-drop-wrapper').show();
	make_selectable_and_draggable($search_results);
    //}
    
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
	    ajax_solr_text_search(false,false); // newSearch=false, newResultPage=false
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
    var new_to = search_start + num_pages;
    $('#sm-to').data('raw-num',new_to);
    $('#sm-to').html(new_to.toLocaleString());

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

    // ****
    //var ids_escaped = ids.map(function(id){return "(id:"+id.replace(/\//g,"\\/").replace(/:/g,"\\:")+")"});

    var ids_escaped = ids.map(escape_solr_query).map(function(id){return "(id:"+id+")"});
    
    var ids_or_str = ids_escaped.join(" OR ");
    
    //var ids_or_str = ids.map(function(id){return "(id:"+id.replace(/\//g,"\\/").replace(/:/g,"\\:")+")"}).join(" OR ");


    
    var fl_args = [ "id", "title_s", "handleUrl_s", "rightsAttributes_s",
		    "genre_ss", "names_ss", "pubDate_s", "pubPlace_s", "language_s", "typeOfResource_s" ];
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
var store_search_not_ids = null;
var store_query_level_mix = null;


function expand_vfield(q_term, all_vfields, query_level) {
    var vfields = [];
    // **** Should the following not be reconciled (and be the same as) the global version ???
    var metadata_fields = ["accessProfile_t", "genre_t", "imprint_t", "isbn_t", "issn_t",
			   "issuance_t", "language_t", "lccn_t", "names_t", "oclc_t",
			   "pubPlace_t", "pubDate_t", "rightsAttributes_t", "title_t", "typeOfResource_t"
			  ];
    
	if (all_vfields) {
		for (var fi = 0; fi < metadata_fields.length; fi++) {
		        var vfield = metadata_fields[fi];
		        if (query_level == FacetLevelEnum.Page) {
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
		        if (query_level == FacetLevelEnum.Page) {
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
    //var query_terms = query.match(/\w+(?::(?:\w+|"[^"]+"))?|(?:"[^"]+")/g);
    var query_terms = query.match(/[^"\s:]+(?::(?:[^"\s:]+|"[^"]+"))?|(?:"[^"]+")/g);
    
    //console.log("*** query terms = " + query_terms); // ****
    
    var query_terms_len = query_terms.length;
    //console.log("*** query terms len = " + query_terms.length); // ****
    
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
    //var query_terms = query.match(/\w+(?::(?:\w+|"[^"]+"))?|(?:"[^"]+")/g);
    var query_terms = query.match(/[^"\s:]+(?::(?:[^"\s:]+|"[^"]+"))?|(?:"[^"]+")/g);
    
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

function initialize_new_solr_search()
{
    if ($('#search-results-page').is(":visible")) {
	$('#search-results-page').hide();
    }
    $('.search-in-progress').css("cursor","wait");

    num_found=0;
    $('#page-bar').html('');

    facet_filter.resetFilters(); // ****
    facet_filter.facetlistSet();    
    
    store_search_action = solr_search_action;

    explain_search = { 'group_by_vol': null,
		       'volume_level_terms': 'metadata-term', 'volume_level_desc': null,
		       'page_level_terms': 'POS-term OR ...', 'page_level_desc': null };

}

function submit_action(event) {
    event.preventDefault();

    initialize_new_solr_search();
    
    //var arg_indent = $('#indent').attr('value'); // ****
    //var arg_wt = $('#wt').attr('value');

    var arg_q = null;

    var q_text = $('#q').val().trim();
    var vq_text = $('#vq').val().trim();

    var tokenize_mode = $("#tokenize-mode :radio:checked").attr('id');


    var submit_action_tokenized_confirmed = function(json_data) {
	vq_text = json_data.text_out

	group_by_vol_checked = $('#group-results-by-vol:checked').length;
	
	var search_all_langs_checked = $('#search-all-langs:checked').length;
	var search_all_vfields_checked = $('#search-all-vfields:checked').length;

	if (store_query_tab_selected == QueryTabEnum.Advanced) {
	    var advanced_q_text = $('#advanced-q').val().trim();
	    if (advanced_q_text === "") {
		$('.search-in-progress').css("cursor","auto");
		htrc_alert("No query term(s) entered");
		return;
	    }
	    arg_q = advanced_q_text;


	    if (arg_q.match(/volume[^_]+_txt:/) || arg_q.match(/htrctokentext:/)) {
		doc_unit  = " page ";
		doc_units = " pages ";

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
	else {
	    if ((q_text === "") && (vq_text === "")) {
		$('.search-in-progress').css("cursor","auto");
		htrc_alert("No query term(s) entered");
		return;
	    }
	    
	    
	    arg_q = expand_query_field_and_boolean(q_text, langs_with_pos, langs_without_pos, search_all_langs_checked);
	    
	    if (arg_q == "") {
		// Potentially only looking at volume level terms
		facet_filter.setFacetLevel(FacetLevelEnum.Volume);
	    }
	    else {
		facet_filter.setFacetLevel(FacetLevelEnum.Page);
	    }

	    var query_level = facet_filter.getFacetLevel();
	    var arg_vq = expand_vquery_field_and_boolean(vq_text, search_all_vfields_checked, query_level);
	    
	    if (arg_q == "") {
		if (arg_vq == "") {
		    // arg_vq was empty to start with, but attempt to expand non-empty arg_q
		    //   lead to an empty arg_q being returned
		    $('.search-in-progress').css("cursor","auto");
		    htrc_alert("No languages selected");
		    return;
		} else {
		    arg_q = arg_vq;
		    doc_unit = " volume ";
		    doc_units = " volumes ";
		    explain_search.volume_level_desc  = "[Volume: Terms]";
		    if (group_by_vol_checked) {
			explain_search.group_by_vol = "Search results sorted by volume ID";
		    }
		}
	    }
	    else {
		if (arg_vq != "") {
		    // join the two with an AND
		    arg_q = "(" + arg_vq + ")" + " AND " + "(" + arg_q + ")"; 
		    
		    explain_search.volume_level_desc = "[Volume: Terms]";
		    explain_search.page_level_desc   = "[Page-level: POS-Terms]";
		}
		else {
		    explain_search.page_level_desc  = "[Page-level: POS-Terms]";
		}
		if (group_by_vol_checked) {
		    explain_search.group_by_vol = "Search results sorted by volume ID";
		}		    
		
		doc_unit  = " page ";
		doc_units = " pages ";
	    }
	}
	
	//console.log("*** NOW arg_q = " + arg_q);

	// Example search on one of the htrc-full-ef fields is: 
	//  q=en_NOUN_htrctokentext:farming
	
	var arg_start = $('#start').attr('value');
	
	initiate_new_solr_search(arg_q,arg_start,group_by_vol_checked);
    }

    var submit_action_tokenized = function(json_data) {
	
	if (vq_text != json_data.text_out) {
	    var mess = "Do you want to split this query into separate terms?<br /><hr />";

	    mess += "Query input: " + vq_text + "<br>";
	    mess += "Tokenized as: " + json_data.text_out.split(" ").join(", ");
	    htrc_confirm(mess,
			 function() {
			     $(this).dialog("close");
			     $('#vq').val(json_data.text_out);
			     submit_action_tokenized_confirmed(json_data);
			 },
			 function() {
			     $(this).dialog("close");
			     submit_action_tokenized_confirmed({"text_out":vq_text});
			 }
			);
	}
	else {
	    submit_action_tokenized_confirmed(json_data);
	}
    }

    if (tokenize_mode == "tokenize-on") {
	$.ajax({
	    type: "POST",
	    url: ef_download_url,
	    data: { "action": "icu-tokenize",
		    "text-in": vq_text },
	    dataType: "json",
	    success: submit_action_tokenized,
	    error: ajax_error
	});
    }
    else {
	submit_action_tokenized({"text_out":vq_text});
    }
    

}

function initiate_new_solr_search(arg_q,arg_start,group_by_vol_checked)
{
    var num_rows = (group_by_vol_checked) ? 10*num_results_per_page : num_results_per_page;

    store_search_args = {
	q: arg_q,
	indent: arg_indent,
	wt: arg_wt,
	start: arg_start,
	rows: num_rows,
	facet: "on"
    };

    store_search_not_ids = [];
    store_query_level_mix = null;
    
    if (group_by_vol_checked) {
	store_search_args.sort = "id asc";
    }

    // For display purposes, determine how many terms in query
    var count_terms = 0;
    var iprogressbar_message = "Searching 20 CPU-Core index";
    if (store_search_args != null) {
	count_terms = (store_search_args.q.match(/:/g) || []).length;
    }

    if (count_terms>1) {
	iprogressbar_message += " for " + count_terms + " fields/terms";
    }

    iprogressbar.trigger_delayed_display(SolrEFSettings.iprogressbar_delay_threshold,
					 iprogressbar_message);
    
    ajax_solr_text_search(true,true); // newSearch=true, newResultPage=true
}


function show_hide_solr_q() {
    $("#show-hide-solr-q").click(function (event) {
	event.preventDefault();
	if ($('.show-hide-solr-q:visible').length) {
	    $('.show-hide-solr-q').hide("slide", { direction: "up" }, 500);
	    $('#show-hide-solr-q').html("Show full query ...");
	}
	else {
	    $('.show-hide-solr-q').show("slide", { direction: "up" }, 500);
	    $('#show-hide-solr-q').html("Hide full query ...");
	}
    });
    
    $("#show-hide-solr-q-paste").click(function (event) {
	event.preventDefault();
	var raw_q = $('#show-hide-solr-q-raw').html();
	$('#advanced-q').val(raw_q);
	$('#show-hide-solr-q').trigger("click");

	var tabs = $('#tabs-search');
	tabs.tabs({ active: QueryTabEnum.Advanced});
	activate_tab_id(QueryTabEnum.Advanced);
	
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
	}
	else {
	    $(sid_block).show("slide", { direction: "up" }, 1000);
	    $(sid_label).html("Hide pages ...");
	}
    });
}

function show_hide_query_tabs() {
    var base_id = "#show-hide-query-tabs";
    var box_id       = base_id+"-box";
    var turnstyle_id = base_id+"-turnstyle";
    var block_id     = "#tabs-shared";
    
    $(box_id).click(function (event) {
	event.preventDefault();
	if ($(block_id+':visible').length) {
	    $(block_id).hide("slide", { direction: "up" }, 1000);
	    $(turnstyle_id).html('<span class="ui-icon ui-icon-triangle-1-e"></span>');
	}
	else {
	    $(block_id).show("slide", { direction: "up" }, 1000);
	    $(turnstyle_id).html('<span class="ui-icon ui-icon-triangle-1-s"></span>');
	}
    });
}


function result_set_delete_item(line_num) {
    var di_id = "result-set-delete-"+line_num;

    $('#'+di_id).on("click.deleteitem", function (event) {
	event.stopImmediatePropagation()
	
	var $close_div = $(this).parent();
	var $wrapper_line_div = $close_div.parent();
	
	var id = $close_div.next().attr("name");
	$wrapper_line_div.slideUp(500, function() { $wrapper_line_div.remove(); });

	//var escaped_id = id.replace(/:/g,"\\:").replace(/\\/g,"\\\\");
	var escaped_id = id.replace(/:/g,"\\:");
	
	console.log("Exclude escaped id: " + escaped_id);

	if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
	    
	    var $a_seqs = $wrapper_line_div.find('a[class="seq"]');
	    $a_seqs.each(function() {
		var seq_str = $(this).text();
		var seq = seq_str.replace(/^seq\s+/,"");
		// sprintf("%06d")
		var page_str = "" + (seq-1);
		var pad = "000000";
		var seq_pad = pad.substring(0, pad.length - page_str.length) + page_str
		store_search_not_ids.push("-id:"+escaped_id+".page-"+seq_pad);		
	    });
	}
	else {
	    store_search_not_ids.push("-id:"+escaped_id);		
	}

	var $results_total_num = $('#results-total-num');
	var results_total_int = parseInt($results_total_num.data('raw-num'));

	//var $result_line = $("[name='" + htid + "']").parent(); // ****
	var query_level = facet_filter.getFacetLevel();
	if (query_level == FacetLevelEnum.Volume) {
	    // decrease num results found by 1

	    results_total_int--;
	    $results_total_num.data('raw-num',results_total_int)
	    $results_total_num.text(results_total_int.toLocaleString());

	    // 2. decrease 'showing page-level matches ... to' by 1
	    var $sm_to_num = $('#sm-to');		
	    var sm_to_int = parseInt($sm_to_num.text());
	    sm_to_int--;
	    $sm_to_num.data('raw-num',sm_to_int);
	    $sm_to_num.text(sm_to_int.toLocaleString());

	}
	else {
	    // Page level
	    if (group_by_vol_checked) {
		// 1. decrease num results by num_deleted

		var $seq_matches = $wrapper_line_div.find("nobr>a[class^='seq']");	    
		var num_deleted = $seq_matches.length;
		results_total_int -= num_deleted;
		$results_total_num.data('raw-num',results_total_int);
		$results_total_num.text(results_total_int.toLocaleString());
		
		// 2. decrease volume count by 1
		var $vol_count_num = $('#srt-vol-count-num');
		var vol_count_int = parseInt($vol_count_num.data('raw-num'));
		vol_count_int--;
		$vol_count_num.data('raw-num',vol_count_int);
		$vol_count_num.text(vol_count_int.toLocaleString());

		// 3. decrease 'showing page-level matches ... to' by num_deleted
		var $sm_to_num = $('#sm-to');		
		var sm_to_int = parseInt($sm_to_num.text());
		sm_to_int -= num_deleted;
		$sm_to_num.data('raw-num',sm_to_int);
		$sm_to_num.text(sm_to_int.toLocaleString());
	    }
	    else {
		// 1. decrease num results by 1
		results_total_int--;
		$results_total_num.data('raw-num',results_total_int);
		$results_total_num.text(results_total_int.toLocaleString());
		
		// 2. recompute num vols in case this seq entry was the last one for this volume
		$('#srt-vol-count').css("cursor","wait");
		ajax_solr_stream_volume_count(store_search_args.q,true,show_volume_count); // doRollup=true

		// 3. decrease 'showing page-level matches ... to' by 1
		var $sm_to_num = $('#sm-to');		
		var sm_to_int = parseInt($sm_to_num.text());
		sm_to_int--;
		$sm_to_num.data('raw-num',sm_to_int);
		$sm_to_num.text(sm_to_int.toLocaleString());		
	    }
	}

	var explain_html = show_results_explain_html(store_query_level_mix,store_search_url)
	$('#search-explain').html(explain_html);
	show_hide_solr_q(); 

    });
}
