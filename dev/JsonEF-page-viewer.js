
var store_ef_data    = null;
var store_htid       = null;
var store_seq_num    = null;
var store_page_count = null;

var store_search_xhr = null;

function hashmap_to_html_table(hashmap)
{
    var $table = $("<table />");

    for (var key in hashmap) {
	var $tr = $('<tr class="oddevenline" />');
	
	var val = hashmap[key];

	$tr.append($('<td />').html(key)).append($('<td />').html(val));

	$table.append($tr);
    }

    return $table;
}

function posmap_to_text(block,pos_map,display_mode)
{
    var pos_keys = [];
    if (display_mode == "display-raw") {
	for (var pos_key in pos_map) {
	    pos_keys.push(pos_key);
	}
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
	//pos_keys = pos_keys.sort();
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
    }
    
    if (pos_keys.length>0) {
	var keys_html = '<i class="no-user-select">'+block.capitalize() + "</i>: " + pos_keys.join(", ",pos_keys) + "<hr />";
	$('#json-ef-page-'+block).html(keys_html);
    }
    else {
	$('#json-ef-page-'+block).html("");
    }

    return pos_keys.length;

}

function find_rewind_text(seq_num)
{
    var found_text = false;
    var found_seq_num = seq_num;

    var pages = store_ef_data.features.pages;    

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


function find_forward_text(seq_num)
{
    var found_text = false;
    var found_seq_num = seq_num;

    var pages = store_ef_data.features.pages;    

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

function display_view_and_download(htid,seq_num,unit_type)
{
    var babel_url = babel_prefix_url + "?id=" + htid + ";view=1up";
	
    babel_url += ";seq=" + seq_num;	
	    
    var $alink = $('<a />')
	.attr('href',babel_url)
	.attr('target','_blank')
	.html("View this "+unit_type+" @ the HathiTrust Digital Library");

    $('#goto-ht').html($alink);
    
    var rights = getURLParameter("rights");
    if ((rights != null) && (rights == "pd")) {
	// If Image of page available, display a thumbnail of that linked to HT as well
	// Example image server URL
	//  https://babel.hathitrust.org/cgi/imgsrv/image?id=uc1.32106002115449;seq=7;width=1360	

	var $existing_img_thumbnail = $('#img-thumbnail');
	if ($existing_img_thumbnail.length>0) {
	    $existing_img_thumbnail.css("cursor", "progress");
	}
	var thumbnail_url = image_server_base_url + '?id='+htid+';seq='+seq_num+';height=110';
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

function display_ef_page_text(seq_num)
{
    store_seq_num = seq_num;

    var unit_type = ((seq_num == null) || (seq_num == 0)) ? "item" : "page";
    display_view_and_download(store_htid,seq_num,unit_type);
    
    var display_mode = $("#display-mode :radio:checked").attr('id');
	    
    var pages = store_ef_data.features.pages;
    var page = pages[seq_num-1];
    
    console.log("Generating POS text for seq-num: " + seq_num);
    $('#input-go-page').val(seq_num);
    $('#seq-num').html(seq_num);
    
    if (seq_num <= 1) {
	$('#action-go-first').prop('disabled', true);
	$('#action-go-prev').prop('disabled', true);
    }
    else {
	$('#action-go-first').prop('disabled', false);
	$('#action-go-prev').prop('disabled', false);
    }

    if (seq_num >= store_page_count) {
	$('#action-go-next').prop('disabled', true);
	$('#action-go-last').prop('disabled', true);
    }
    else {
	$('#action-go-next').prop('disabled', false);
	$('#action-go-last').prop('disabled', false);
    }
    

    var header_text_len = posmap_to_text("header",page.header.tokenPosCount, display_mode);
    var body_text_len   = posmap_to_text("body",  page.body.tokenPosCount, display_mode);
    var footer_text_len = posmap_to_text("footer",page.footer.tokenPosCount, display_mode);

    var text_len_total = header_text_len + body_text_len + footer_text_len;
    
    if (text_len_total>0) {
	$('#json-ef-no-text').hide();
	$('#json-ef-text-label').show();
    }
    else {
	$('#json-ef-text-label').hide();
	$('#json-ef-no-text').show();

	var found_rew_seq_num = find_rewind_text(seq_num);
	var nontrivial_rew = false;
	if ((found_rew_seq_num != null) && ((seq_num - found_rew_seq_num)>1)) {
	    $('#json-ef-no-text-rew-goto').data('go-page',found_rew_seq_num);	   
	    $('#json-ef-no-text-rew-goto').show();
	    nontrivial_rew = true;
	}
	else {
	    $('#json-ef-no-text-rew-goto').hide();
	}

	var found_ff_seq_num = find_forward_text(seq_num);
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

function show_hide_more_metadata()
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


$(document).ready(function() {

    var seq_num = null;

    //$("#display-mode input").checkboxradio();
    $( "input[name='display-mode']").on( "change", function handleShape(event) {
	console.log("Refreshing page display");
	display_ef_page_text(store_seq_num);
    });
    
    
    var title = getURLParameter("title");
    if (title != null) {
	title = decodeURI(title);
	$('#ht-title').html(title);
    }
	
    store_htid = getURLParameter("htid");
    if (store_htid != null) {

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
	
	display_view_and_download(store_htid,seq_num,unit_type);
    }

    $('#ht-show-metadata').click(function(event) {
	$('#ht-metadata').show();
    });

    $('#action-go-first').click(function(event) {
	display_ef_page_text(1);
    });

    $('#action-go-prev').click(function(event) {
	if (store_seq_num>1) {
	    display_ef_page_text(store_seq_num-1);
	}
    });

    $('#action-go-next').click(function(event) {
	if (store_seq_num<store_page_count) {
	    display_ef_page_text(store_seq_num+1);
	}
    });

    $('#action-go-last').click(function(event) {
	display_ef_page_text(store_page_count);
    });

    $('#action-go-page').click(function(event) {
	var seq_num = parseInt($('#input-go-page').val());
	
	if (!isNaN(seq_num)) {
	    if ((seq_num>0) && (seq_num<=store_page_count)) {
		display_ef_page_text(seq_num);
	    }
	    else {
		htrc_alert("Page number out of range.<br />Please enter a value between 1-" + store_page_count);
	    }
	}
	else {
	    htrc_alert("No page number given");
	}
	    
    });


    $('#json-ef-no-text-rew-goto').click(function(event) {
	var go_page_seq_num = $('#json-ef-no-text-rew-goto').data('go-page');	
	display_ef_page_text(go_page_seq_num);
    });

    $('#json-ef-no-text-ff-goto').click(function(event) {
	var go_page_seq_num = $('#json-ef-no-text-ff-goto').data('go-page');	
	display_ef_page_text(go_page_seq_num);
    });

    
    var ef_download_args = { "download-id": store_htid };

    store_search_xhr = new window.XMLHttpRequest();
    
    $.ajax({
	type: "GET",
	url: ef_download_url,
	data: ef_download_args,
	dataType: "json",
		xhr : function() {
	    return store_search_xhr;
	},
	success: function(jsonData) {
	    store_ef_data = jsonData;
	    store_page_count = jsonData.features.pageCount;

	    iprogressbar.cancel();
	    
	    //console.log(JSON.stringify(jsonData, null, 4));
	    var $metadata_table = hashmap_to_html_table(jsonData.metadata);
	    $('#show-hide-metadata-block').html($metadata_table);
	    show_hide_more_metadata();
	    
	    var $vol_info = $('#vol-info');
	    var rights = getURLParameter("rights");
	    if (rights != null) {
		var rights_pp = facet_filter.prettyPrintTerm("rightsAttributes_s",rights)
		
		$vol_info.append("<span>Copyright status: " + rights_pp + "</span><br />");
	    }
	    $vol_info.append('<span>Showing page <span id="seq-num">' + seq_num + '</span> of ' + store_page_count + ' pages</span>');

	    var download_ef_href = ef_download_url+'?download-id='+store_htid;
	    $('#download-json-ef').attr('href',download_ef_href);

	    display_ef_page_text(seq_num);
	    
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    $('.search-in-progress').css("cursor","auto");
	    iprogressbar.cancel();
	    ajax_error(jqXHR, textStatus, errorThrown)
	}
    });

    
	
});