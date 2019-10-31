//"use strict";

var store_search_xhr = null; // used in iprogressbar.cancel()

function JsonEFPageViewer()
{
    this.store_ef_data    = null;
    this.store_htid       = null;
    this.store_seq_num    = null;
    this.store_page_count = null;

    this.flatUniversalPOSMapping = {};
    for (var lang_key in universalPOSMapping) {
	var lang_pos_map = universalPOSMapping[lang_key];
	
	for (var pos_key in lang_pos_map) {
	    this.flatUniversalPOSMapping[pos_key] = lang_pos_map[pos_key];
	}
    }

    this.universalPOStoLabel = {};
    this.universalPOStoTooltip = {};
    
    for (var pos_i in pos_checkbox) {
	var pos_rec = pos_checkbox[pos_i];
	this.universalPOStoLabel[pos_rec.pos] = pos_rec.label;
	this.universalPOStoTooltip[pos_rec.pos] = pos_rec.tooltip;
    }	
}

JsonEFPageViewer.prototype.setEFJsonData = function(json_data)
{
    this.store_ef_data = json_data;
}

JsonEFPageViewer.prototype.setPageCount = function(page_count)
{
    this.store_page_count = page_count;
}

JsonEFPageViewer.prototype.getPageCount = function()
{
    return this.store_page_count;
}

JsonEFPageViewer.prototype.getSeqNum = function()
{
    return this.store_seq_num;
}

JsonEFPageViewer.prototype.getPaddedSeqNum = function()
{
    // sprintf("%06d")
    var seq_num_str = "" + this.store_seq_num;
    var pad = "000000";
    var seq_pad = pad.substring(0, pad.length - seq_num_str.length) + this.store_seq_num;
    return seq_pad;
}

JsonEFPageViewer.prototype.setHTID = function(htid)
{
    this.store_htid = htid;
}

JsonEFPageViewer.prototype.getHTID = function()
{
    return this.store_htid;
}

JsonEFPageViewer.prototype.isFirstPage = function()
{
    return this.store_seq_num <= 1;
}

JsonEFPageViewer.prototype.beforeFirstPage = function()
{
    return this.store_seq_num > 1;
}
    
JsonEFPageViewer.prototype.beforeLastPage = function()
{
    return this.store_seq_num < this.store_page_count;
}

JsonEFPageViewer.prototype.isLastPage = function()
{
    return this.store_seq_num >= this.store_page_count;
}

JsonEFPageViewer.prototype.isValidPageNum = function(seq_num)
{
    return ((seq_num >= 1) && (seq_num <= this.store_page_count));
}

JsonEFPageViewer.prototype.hashmap_to_html_table = function(hashmap)
{
    var $table = $("<table/>",{ width: "100%" });

    for (var key in hashmap) {
	var $tr = $('<tr class="oddevenline" />');
	
	var val = hashmap[key];

	$tr.append($('<td />').html(key)).append($('<td />').html(val));

	$table.append($tr);
    }

    return $table;
}

JsonEFPageViewer.prototype._posmap_to_text= function(block,pos_map,display_mode)
{
    var pos_keys = [];
    var pos_keys_pp = "";
    
    if (display_mode == "display-raw") {
	for (var pos_key in pos_map) {
	    pos_keys.push(pos_key);
	}
	pos_keys_pp = pos_keys.join(", ");
    }
    else if (display_mode == "display-sort-alpha") {
	//for (var k in pos_map) pos_keys.push(k);
	pos_keys = Object.keys(pos_map).sort(function(cur_key,next_key) {
	    //pos_keys = pos_keys.sort(function(cur_key,next_key) {
	    // comparison needs to return -1, 0, +1 (not boolean value)
	    if (cur_key < next_key) return -1;
	    if (cur_key > next_key) return 1;
	    return 0;
	});
	pos_keys_pp = pos_keys.join(", ");
    }
    else if (display_mode == "display-sort-freq") {
	var pos_freq = {};
	
	for (var pos_key in pos_map) {
	    var pos_terms = pos_map[pos_key];
	    var freq = 0;
	    for (var pos_term in pos_terms) {
		freq += pos_terms[pos_term];
	    }

	    pos_freq[pos_key] = freq;
	}
	   
	var sorted_pos_freq = Object.keys(pos_freq).sort(function(cur_key,next_key) {
	    return pos_freq[next_key] - pos_freq[cur_key];
	});

	for (var key_i in sorted_pos_freq) {
	    var pos_key = sorted_pos_freq[key_i];
	    pos_keys.push(pos_key+":"+pos_freq[pos_key]);
	}

	pos_keys_pp = pos_keys.join(", ");
    }
    else if (display_mode == "display-sort-pos") {

	var pos_term_mapping = {};

	// Map all the different words on the page to their respective Universal POS label
	for (var pos_key in pos_map) {
	    var pos_terms = pos_map[pos_key];
	    for (var pos_term in pos_terms) {
		var universal_pos_term = this.flatUniversalPOSMapping[pos_term];
		var universal_pos_term_label = this.universalPOStoLabel[universal_pos_term] || universal_pos_term;
		
		if (!pos_term_mapping.hasOwnProperty(universal_pos_term_label)) {
		    pos_term_mapping[universal_pos_term_label] = [];
		}
		pos_term_mapping[universal_pos_term_label].push(pos_key);
	    }
	}

	// Sort by Universal OS label
	var sorted_pos_terms = Object.keys(pos_term_mapping).sort(function(cur_key,next_key) {
	    if (cur_key < next_key) return -1;
	    if (cur_key > next_key) return 1;
	    return 0;
	});
	
	var universal_pos_pair = [];

	// Generate array of Univeral POS {key,terms} in sort order
	for (var key_i in sorted_pos_terms) {
	    var pos_key = sorted_pos_terms[key_i];
	    universal_pos_pair.push({ "key": pos_key, "terms": pos_term_mapping[pos_key] });	    
	}
	

	// Turn the sorted array of pairs into <li> suitable for HTML display
	for (var pos_pair_i in universal_pos_pair) {
	    var pos_pair = universal_pos_pair[pos_pair_i];
	    pos_keys.push('<li><i class="no-user-select" style="color:black;">'+pos_pair.key+":</i> "+pos_pair.terms.sort().join(", ") + '</li>');
	}

	pos_keys_pp = '<ul>'+pos_keys.join("\n") + '</ul>';		
    }
    
    if (pos_keys.length>0) {
	var keys_html = '<i class="no-user-select">'+block.capitalize() + "</i>: " + pos_keys_pp + "<hr />";
	$('#json-ef-page-'+block).html(keys_html);
    }
    else {
	$('#json-ef-page-'+block).html("");
    }

    return pos_keys.length;

}

JsonEFPageViewer.prototype._find_rewind_text = function(seq_num)
{
    var found_text = false;
    var found_seq_num = seq_num;

    var pages = this.store_ef_data.features.pages;    

    while (found_seq_num >= 1) {
	var page = pages[found_seq_num-1];
	var page_text_total = 
	    Object.keys(page.header.tokenPosCount).length
	    + Object.keys(page.body.tokenPosCount).length
	    + Object.keys(page.footer.tokenPosCount).length

	if (page_text_total>0) {
	    found_text = true;
	    break;
	}

	found_seq_num--;
    }

    if (!found_text) {
	found_seq_num = null;
    }
    
    return found_seq_num;
}


JsonEFPageViewer.prototype._find_forward_text = function(seq_num)
{
    var found_text = false;
    var found_seq_num = seq_num;

    var pages = this.store_ef_data.features.pages;    

    while (found_seq_num <= pages.length) {
	var page = pages[found_seq_num-1];
	var page_text_total = 
	    Object.keys(page.header.tokenPosCount).length
	    + Object.keys(page.body.tokenPosCount).length
	    + Object.keys(page.footer.tokenPosCount).length
	//console.log("** page num: " + found_seq_num + ", total = " + page_text_total);
	if (page_text_total>0) {
	    found_text = true;
	    break;
	}

	found_seq_num++;
    }

    if (!found_text) {
	found_seq_num = null;
    }
    
    return found_seq_num;
}

JsonEFPageViewer.prototype.display_view_and_download = function(seq_num,unit_type)
{
    var babel_url = babel_prefix_url + "?id=" + this.store_htid + ";view=1up";
	
    babel_url += ";seq=" + seq_num;	
	    
    var $alink = $('<a />')
	.attr('href',babel_url)
	.attr('target','_blank')
	.html("View this "+unit_type+" @ the HathiTrust Digital Library");

    $('#goto-ht').html($alink);
    
    var rights = getURLParameter("rights");
    if ((rights != null) && ((rights == "pd") || (rights == "pdus"))) {
	// If Image of page available, display a thumbnail of that linked to HT as well
	// Example image server URL
	//  https://babel.hathitrust.org/cgi/imgsrv/image?id=uc1.32106002115449;seq=7;width=1360	

	var $existing_img_thumbnail = $('#img-thumbnail');
	if ($existing_img_thumbnail.length>0) {
	    $existing_img_thumbnail.css("cursor", "progress");
	}
	var thumbnail_url = image_server_base_url + '?id='+this.store_htid+';seq='+seq_num+';height=110';
	var $img_thumbnail = $('<img>')
	    .attr('id','img-thumbnail')
	    .attr('class','clickable-image')
	    .attr('src',thumbnail_url)
	    .load(function() {
		var $image_preview = $('<a>')
		    .attr('href',babel_url)
		    .attr('target','_blank')
		    .attr('style','padding-left: 8pt;')
		    .attr('title',"Click to view this "+unit_type+" @ the HathiTrust Digital Library in a new tab/window")
		    .html($img_thumbnail);
		
		$('#image-preview').html($image_preview);
	    });	
    }
}

JsonEFPageViewer.prototype.display_ef_page_text = function(seq_num)
{
    this.store_seq_num = seq_num;

    var unit_type = ((seq_num == null) || (seq_num == 0)) ? "item" : "page";
    this.display_view_and_download(seq_num,unit_type);
    
    var display_mode = $("#display-mode :radio:checked").attr('id');
	    
    var pages = this.store_ef_data.features.pages;
    var page = pages[seq_num-1];
    
    console.log("Generating POS text for seq-num: " + seq_num);
    $('#input-go-page').val(seq_num);
    $('#seq-num').html(seq_num);
    
    if (this.isFirstPage()) {
	$('#action-go-first').prop('disabled', true);
	$('#action-go-prev').prop('disabled', true);
    }
    else {
	$('#action-go-first').prop('disabled', false);
	$('#action-go-prev').prop('disabled', false);
    }

    if (this.isLastPage()) {
	$('#action-go-next').prop('disabled', true);
	$('#action-go-last').prop('disabled', true);
    }
    else {
	$('#action-go-next').prop('disabled', false);
	$('#action-go-last').prop('disabled', false);
    }
    

    var header_text_len = this._posmap_to_text("header",page.header.tokenPosCount, display_mode);
    var body_text_len   = this._posmap_to_text("body",  page.body.tokenPosCount, display_mode);
    var footer_text_len = this._posmap_to_text("footer",page.footer.tokenPosCount, display_mode);

    var text_len_total = header_text_len + body_text_len + footer_text_len;
    
    if (text_len_total>0) {
	$('#json-ef-no-text').hide();
	$('#json-ef-text-label').show();
    }
    else {
	$('#json-ef-text-label').hide();
	$('#json-ef-no-text').show();

	var found_rew_seq_num = this._find_rewind_text(seq_num);
	var nontrivial_rew = false;
	if ((found_rew_seq_num != null) && ((seq_num - found_rew_seq_num)>1)) {
	    $('#json-ef-no-text-rew-goto').data('go-page',found_rew_seq_num);	   
	    $('#json-ef-no-text-rew-goto').show();
	    nontrivial_rew = true;
	}
	else {
	    $('#json-ef-no-text-rew-goto').hide();
	}

	var found_ff_seq_num = this._find_forward_text(seq_num);
	var nontrivial_ff = false;
	if ((found_ff_seq_num != null) && ((found_ff_seq_num - seq_num)>1)) {
	    $('#json-ef-no-text-ff-goto').data('go-page',found_ff_seq_num);	   
	    $('#json-ef-no-text-ff-goto').show();
	    nontrivial_ff = true;
	}
	else {
	    $('#json-ef-no-text-ff-goto').hide();
	}

	if (nontrivial_rew || nontrivial_ff) {
	    $('#json-ef-no-text-rew-ff').show();
	}
	else {
	    $('#json-ef-no-text-rew-ff').hide();
	}
    }
    

}

JsonEFPageViewer.prototype.show_hide_more_metadata = function()
{
    var shid_label = "#show-hide-metadata";
    var shid_block = shid_label + "-block";
    
    $(shid_label).click(function (event) {
	event.preventDefault();
	if ($(shid_block+':visible').length) {
	    $(shid_block).hide("slide", { direction: "up" }, 1000);
	    $(shid_label).html('Show metadata <span class="ui-icon ui-icon-triangle-1-e"></span>');
	}
	else {
	    $(shid_block).show("slide", { direction: "up" }, 1000);
	    $(shid_label).html('Hide metadata <span class="ui-icon ui-icon-triangle-1-s"></span>');
	}
    });
}

var ef_page_viewer = new JsonEFPageViewer();

$(document).ready(function() {
    console.log("*** JSONEF-page-viewer on doc ready called");

    var seq_num = null;

    $( "input[name='display-mode']").on( "change", function handleShape(event) {
	console.log("Refreshing page display");
	ef_page_viewer.display_ef_page_text(ef_page_viewer.getSeqNum());
    });
    
    
    var title = getURLParameter("title");
    if (title != null) {
	title = decodeURI(title);
	$('#ht-title').html(title);
    }

    var htid = getURLParameter("htid");
    if (htid != null) {
	ef_page_viewer.setHTID(htid);

	seq_num = getURLParameter("seq");

	var unit_type;
	if (seq_num == null) {
	    seq_num = 0;
	    unit_type = "item";
	}
	else {
	    // ensure it is numeric
	    seq_num = parseInt(seq_num);
	    unit_type = "page";
	}

	ef_page_viewer.display_view_and_download(seq_num,unit_type);
    }

    $('#ht-show-metadata').click(function(event) {
	$('#ht-metadata').show();
    });

    $('#action-go-first').click(function(event) {
	ef_page_viewer.display_ef_page_text(1);
    });

    $('#action-go-prev').click(function(event) {
	if (ef_page_viewer.beforeFirstPage()) {
	    ef_page_viewer.display_ef_page_text(ef_page_viewer.getSeqNum()-1);
	}
    });

    $('#action-go-next').click(function(event) {
	if (ef_page_viewer.beforeLastPage()) {
	    ef_page_viewer.display_ef_page_text(ef_page_viewer.getSeqNum()+1);
	}
    });

    $('#action-go-last').click(function(event) {
	ef_page_viewer.display_ef_page_text(ef_page_viewer.getPageCount());
    });

    $('#action-go-page').click(function(event) {
	var seq_num = parseInt($('#input-go-page').val());
	
	if (!isNaN(seq_num)) {
	    if (ef_page_viewer.isValidPageNum(seq_num)) {
		ef_page_viewer.display_ef_page_text(seq_num);
	    }
	    else {
		htrc_alert("Page number out of range.<br />Please enter a value between 1-"
			   + ef_page_viewer.getPageCount());
	    }
	}
	else {
	    htrc_alert("No page number given");
	}
	    
    });


    $('#json-ef-no-text-rew-goto').click(function(event) {
	var go_page_seq_num = $('#json-ef-no-text-rew-goto').data('go-page');	
	ef_page_viewer.display_ef_page_text(go_page_seq_num);
    });

    $('#json-ef-no-text-ff-goto').click(function(event) {
	var go_page_seq_num = $('#json-ef-no-text-ff-goto').data('go-page');	
	ef_page_viewer.display_ef_page_text(go_page_seq_num);
    });



    if (htid != null) {
	
	var ef_accessapi_args = { "download-id": htid };

	store_search_xhr = new window.XMLHttpRequest();
	
	$.ajax({
	    type: "GET",
	    async: true,
	    //timeout: 60000,
	    cache: false,
	    headers: { "cache-control": "no-cache" },
	    url: ef_accessapi_url,
	    data: ef_accessapi_args,
	    dataType: "json",
	    xhr : function() {
		return store_search_xhr;
	    },
	    success: function(jsonData) {
		ef_page_viewer.setEFJsonData(jsonData);
		ef_page_viewer.setPageCount(jsonData.features.pageCount);
		
		iprogressbar.cancel();
	    
		var $metadata_table = ef_page_viewer.hashmap_to_html_table(jsonData.metadata);
		$('#show-hide-metadata-block').html($metadata_table);
		ef_page_viewer.show_hide_more_metadata();
		
		var $vol_info = $('#vol-info');
		var rights = getURLParameter("rights");
		if (rights != null) {
		    var rights_pp = facet_filter.prettyPrintTerm("rightsAttributes_s",rights)
		    
		    $vol_info.append("<span>Copyright status: " + rights_pp + "</span><br />");
		}
		$vol_info.append('<span>Showing page <span id="seq-num">' + seq_num + '</span> of '
				 + ef_page_viewer.getPageCount() + ' pages</span>');

		ef_page_viewer.display_ef_page_text(seq_num);

		var download_ef_href = ef_accessapi_url+'?download-id='+ef_page_viewer.getHTID();
		$('#download-json-ef').attr('href',download_ef_href);

		download_ef_href += "-seq-" + ef_page_viewer.getPaddedSeqNum();
		$('#download-json-ef-page').attr('href',download_ef_href);

		//ef_page_viewer.display_ef_page_text(seq_num); // ****

		$('#json-page-viewer-container-loading').hide(); // ****
		$('#json-page-viewer-container-dynamic-load').show("slide", { direction: "up" }, 1000); // ****

		
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		$('.search-in-progress').css("cursor","auto");
		iprogressbar.cancel();
		$('#json-page-viewer-container-loading').hide(); // ****
		$('#json-page-viewer-container-dynamic-load').show("slide", { direction: "up" }, 1000); // ****

		if ((jqXHR.readyState == 0) && (jqXHR.status == 0)) {
		    console.warn("Interrupted call to download HathiTrust ID: " + htid + " from URL: " + ef_accessapi_url);
		}
		else {
		    
		    var mess = "<b>Download HathiTrust ID '"+htid+"' failed to access URL:";
		    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +'</div></b>';
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown)
		}
	    }
	});
    }
    else {
	iprogressbar.cancel();
	$('#json-page-viewer-container-loading').hide(); // ****
	$('#json-page-viewer-container-dynamic-load').show("slide", { direction: "up" }, 1000); // ****

	htrc_alert("Missing URL parameter 'htid'");
    }
   	
});
