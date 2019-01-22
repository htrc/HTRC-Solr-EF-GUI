//"use strict";

var InteractionStyleEnum = {
    DragAndDrop: 1,
    Checkboxes: 2,
    Hybrid: 3
};

// add_titles_ht() designed to work with information return by HT Metadata API
// => Deprecated, as this information can now be returned by Solr directly

function opt_auto_publish()
{
    var auto_publish = getURLParameter("auto-publish");
    if ((auto_publish != null) && (auto_publish == "true")) {
	// Remove it
	var update_search = window.location.search;
	update_search = update_search.replace("auto-publish=true","");
	var updated_url = window.location.pathname + update_search + window.location.hash;
	window.history.replaceState(null,null,updated_url);

	// Enact the auto-publish
	$("#htrc-publish-dialog").dialog( "open" );
    }
}

function add_titles_ht_DEPRECATED(json_data)
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

function add_titles_and_authors_solr(jsonData) {
    var itemURLs = [];
    //console.log("jsonData = " + jsonData);
    
    var response = jsonData.response;
    var docs = response.docs;
    var num_docs = docs.length;
    
    $.each(docs, function (doc_index, doc_val) {
	var htid = doc_val.id;
	
	var title = doc_val.title_s;
	var title_tidied = title.replace(/\.\s*$/,""); // remove any trailing fullstop, in anticipation of "by ..." author(s)
	var title_and_authors = title_tidied;
	
	var details = [];
	details.push("Title: " + title_tidied);

	
	if (doc_val.names_ss) {
	    var names = doc_val.names_ss.map(strtrim).join(", ");
	    if (!names.match(/^\s*$/)) {
		details.push("Author(s): " + names);
		title_and_authors += " by " + names;
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
	if (doc_val.concept_ss) {
	    var concepts = doc_val.concept_ss.map(strtrim).join(", ");
	    if (!concepts.match(/^\s*$/)) {
		details.push("Concept(s): " + concepts.capitalize() );
	    }
	}

	var details_str = details.map(strtrim).join(";\n");	    
	var $tooltip_tanda = $('<span />').attr('title',details_str).html(title_and_authors);
	
	$("[name='" + htid + "']").each(function () {
	    var $tooltip_tanda_clone = $tooltip_tanda.clone();
	    $tooltip_tanda_clone.tooltip({
	        open: function (event, ui) {
		    ui.tooltip.css("max-width", "800px");
		}
	    });
	    $(this).html($tooltip_tanda_clone)
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
	        var react_component = $('#solr-ef-search-type').data("react-component");
	        var href;
	        if (react_component) {
		    href = 'solr-ef-page-viewer';
		}
	        else {
		    if (runtime_mode == "dev") {
			href = 'json-page-viewer-dev.html';
		    }
		    else {
			href = 'json-page-viewer.html';
		    }
		}
	        href += '?htid='+htid;

		var seq_str = $(this).text();

		if (seq_str == "all pages") {
		    href += "&seq=1";
		}
	        else if (seq_str.match(/^seq\s+/)) {
		    // The following was written for when page sequence numbers were in the form 'seq <n>'
		    var seq_num = seq_str.replace(/^seq\s+/,"");
		    href += "&seq=" + seq_num;
		}
	        else {
		    var seq_num = seq_str.replace(/^\s+/,"");
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

function show_volume_count(jsonData)
{
    $('.exp-vol-count').css("cursor","auto");
    
    var response = jsonData["result-set"];
    var docs = response.docs;
    var num_docs = docs.length;

    num_docs--; // last entry provides response time data

    var $num_docs_span = $('<span>')
	.attr('id','srt-vol-count-num')
	.data('raw-num',num_docs)
	.append(num_docs.toLocaleString());
    var $num_docs_span_sidebar = $('<span>')
	.attr('id','exp-vol-count-num-sidebar')
	.data('raw-num',num_docs)
	.append(num_docs.toLocaleString());

    
    var vol_label = (num_docs==1) ? " volume" : " volumes";
    $('.exp-vol-count-computing').hide();
    $('#srt-vol-count').html(" in ").append($num_docs_span).append(vol_label);
    //$('#exp-vol-count-sidebar').html(" in ").append($num_docs_span_sidebar).append(vol_label); // ******
    $('#exp-vol-count-sidebar').hide();
    $('#srt-vol-count').show();
    
    if (num_docs < num_found_vol_limit) {
	if (!$('#export-by').is(":visible")) {	
	    $('#export-by').fadeIn(1500);
	}
	opt_auto_publish();
    }
    else {
	$('#export-by').hide("slide", { direction: "up" }, 1000);

	$('#exp-vol-count-sidebar').append(' <span style="color:#BB0000;">'
				   +'Exporting disabled for this search. Volume count exceeds limit of '
				   + num_found_vol_limit.toLocaleString() + '</span>');
    }

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
    download_span +=      '<a download="'+id+'.json" href="'+ef_download_url+'?action=download-ids&id='+id+'&output=json">';
    download_span +=        '<span class="ui-icon ui-icon-circle-arrow-s"></span>';
    download_span +=         download_text;
    download_span +=      '</a>';
    download_span +=    '</div>';

    var opt_dnd_style = "";
    if (store_interaction_style == null) {
	if (store_query_display_mode == QueryDisplayModeEnum.ShoppingCart) {
	    // want to show 'x' for delete => leave 'opt_dnd_style' empty
	}
	else {
	    opt_dnd_style = " style-hidden";
	}
    }
    else if ((store_interaction_style != InteractionStyleEnum.DragAndDrop) 
    	&& (store_interaction_style != InteractionStyleEnum.Hybrid)) {
	opt_dnd_style = " style-hidden";
    }
    console.log("**** store_interaction_style = " + store_interaction_style);
    
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
		    html_item += id + ' page sequence: ';

		    //var head_seqs_label = "head-seqs-"+line_num; // ****
		    //seq_item += '<span id="'+head_seq_label'"></span>';
		    seq_item += '<nobr><a class="seq" target="_blank" href="' + babel_url + '">' + seqnum + '</a> ';
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
		seq_item += ' <nobr><a class="seq" target="_blank" href="' + babel_url + '">' + seqnum + '</a> ';
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
		html_item += '<span>'+id + ' page sequence:</span> ';
		seq_item += '<nobr><a class="seq" target="_blank" href="' + babel_url + '">' + seqnum + '</a>';
	    } else {
		// dealing with 'phony' page => show 'all pages'
		html_item += '<span>'+id + ' page sequence:</span> ';
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

	    retrieve_shoppingcart();

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
			$('.exp-vol-count-computing').show();
			$('.exp-vol-count').html("");
			$('.exp-vol-count-span').show();
			
			$("#export-by-vol-div").show();
			$("#export-by-page-div").show();
			
			ajax_solr_stream_volume_count(store_search_args.q,true,show_volume_count); // doRollup=true
			$("#export-ef-metadata-div").show();
			$("#export-ef-zip-div").show();
			console.log("Supressing export-ef-to-registry-div for beta version"); // ****
			//$("#export-ef-to-registry-div").show();
		    }
		    else {
			$('.exp-vol-count-computing').hide();
			$('#exp-vol-count-sidebar').html('<span style="color:#BB0000;">'
						 +'Exporting disabled for this search. Page count exceeds limit of '
						 + num_found_page_limit.toLocaleString() + '</span>');
			$('#exp-vol-count-sidebar').show();
			$('#srt-vol-count').hide();
			$('.exp-vol-count-span').show();
		    }
		}		
		else {
		    // volume level
		    if (num_found < num_found_vol_limit) {
			$("#export-by-vol-div").show();
			$("#export-by-page-div").hide();
			$("#export-ef-metadata-div").show();
			$("#export-ef-zip-div").show();
			console.log("Supressing export-ef-to-registry-div for beta version");
			//$("#export-ef-to-registry-div").show();

			$('#export-by').fadeIn(1500);
			opt_auto_publish();

			// restore vol-count display back to default text, ready for next vol count computation
			$('.exp-vol-count-computing').show();
			$('.exp-vol-count').hide();
			$('.exp-vol-count-span').hide();
		    }
		    else {
			$('.exp-vol-count-computing').hide();
			$('#exp-vol-count-sidebar').html('<span style="color:#BB0000;">'
						 +'Exporting disabled for this search. Volume count exceeds limit of '
						 + num_found_vol_limit.toLocaleString() + '</span>');
			$('#exp-vol-count-sidebar').show();
			$('#srt-vol-count').hide();
			$('.exp-vol-count-span').show();
		    }		
		}
	    
		$('#search-explain').html(explain_html);
		show_hide_solr_q();
		// Clear out any export-item download links generated previously
		$('a.export-item').attr('href',null);

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
	    $('.exp-vol-count-computing').show();
	    $('.exp-vol-count').hide();
	    $('.exp-vol-count-span').hide();
	    $('#search-results-total').hide();	    
	    
	    $('#search-explain').html(explain_html);
	    show_hide_solr_q();
	    // Clear out any export-item download links generated previously
	    $('a.export-item').attr('href',null);
	    $('#search-showing').html("<p>No pages matched your query</p>");
	    
	    //$('#next-prev').hide();
		//$('#page-bar').hide();
	}		

	// Now explain_html has been added into page, figure out the shortened URL that
	// is needed for add2any, and add that into the marked <span> tag
	var raw_q = $('#raw-q-base').text();
	raw_q += " " + $('#raw-q-facets').text();
	raw_q += " " + $('#raw-q-exclude').text();

	explain_add2any_dom(raw_q);
	//explain_add2any_dom(store_search_url);

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
	    // if not done set_shoppingcart_icons() do it now // ******
	    if (store_query_display_mode != QueryDisplayModeEnum.ShoppingCart) {
		mark_shoppingcart_items_in_resultset();
	    }
	    update_shoppingcart_count();
	    progressbar_top.progressbar( "value",0);
	    progressbar_bot.progressbar( "value",0);
	    $('.search-loading-more').hide("slide", { direction: "up" }, 1000);
	}
    }
    else {
	// reached end of results before hitting num_results_per_page
	// => hide progressbars

	// if not done set_shoppingcart_icons() do it now // ******
	if (store_query_display_mode != QueryDisplayModeEnum.ShoppingCart) {
	    mark_shoppingcart_items_in_resultset();
	}
	update_shoppingcart_count();

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
		    "genre_ss", "names_ss", "pubDate_s", "pubPlace_s", "language_s", "typeOfResource_s", "classification_lcc_ss", "concept_ss" ];
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
	success: add_titles_and_authors_solr,
	error: ajax_error
    });    
}
