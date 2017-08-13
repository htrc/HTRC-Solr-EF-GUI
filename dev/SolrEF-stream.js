
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

    // DUPLICATE BLOCK?

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
