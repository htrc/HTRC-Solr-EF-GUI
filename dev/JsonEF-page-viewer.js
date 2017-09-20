
var store_ef_data    = null;
var store_seq_num    = null;
var store_page_count = null;

function hashmapToHtmlTable(hashmap)
{
    var $table = $("<table />").attr('border',1);

    for (var key in hashmap) {
	var $tr = $('<tr />');
	
	var val = hashmap[key];

	$tr.append($('<td />').html(key)).append($('<td />').html(val));

	$table.append($tr);
    }

    return $table;
}

function display_ef_page_text(seq_num)
{
    store_seq_num = seq_num;
    
    var pages = store_ef_data.features.pages;
    var page = pages[seq_num];
    console.log("Generating POS text for seq-num: " + seq_num);
    
    var bodyPOSMap = page.body.tokenPosCount;
    
    var pos_keys = [];
    for (var pos_key in bodyPOSMap) {
	pos_keys.push(pos_key);
    }
    
    var keys_html = pos_keys.join(" ",pos_keys);
    
    $('#json-dump').html(keys_html);
}


$(document).ready(function() {

    var seq_num = null;
    
    var title = getURLParameter("title");
    if (title != null) {
	title = decodeURI(title);
	$('#ht-title').html(title);
    }
	
    var htid = getURLParameter("htid");
    if (htid != null) {

	var babel_url = babel_prefix_url + "?id=" + htid + ";view=1up";
	
	seq_num = getURLParameter("seq");
	
	if (seq_num == null) {
	    seq_num = 0;
	}
	else {
	    // ensure it is numeric
	    seq_num = parseInt(seq_num);
	}
	
	babel_url += ";seq=" + seq_num;	
	    
	var $alink = $('<a />')
	    .attr('href',babel_url)
	    .html("@ HathiTrust");

	$('#goto-ht').html($alink);
	
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

    var ef_download_args = { "download-id": htid };
    
    $.ajax({
	type: "GET",
	url: ef_download_url,
	data: ef_download_args,
	dataType: "json",
	success: function(jsonData) {
	    store_ef_data = jsonData;
	    
	    console.log(JSON.stringify(jsonData, null, 4));
	    var $metadata_table = hashmapToHtmlTable(jsonData.metadata);
	    $('#ht-metadata').html($metadata_table);

	    store_page_count = jsonData.features.pageCount;
	    console.log("Page count: " + store_page_count);

	    display_ef_page_text(seq_num);
	    
	},	
	error: ajax_error
    });

    
	
});
