
//var base_domain_url = "//solr1.htrc.illinois.edu"; // ****
//var base_domain_url="https://solr1.htrc.illinois.edu"
//var base_domain_url="https://solr2.htrc.illinois.edu"
var base_domain_url=window.location.protocol + "//" + window.location.hostname;

var solr_prefix_url = base_domain_url+"/solr/";
var robust_solr_prefix_url = base_domain_url+"/robust-solr/";
//var solr_collection = "faceted-htrc-full-ef20"; // ****
var solr_collection = "solr3456-faceted-htrc-full-ef16"
var do_solr_field_optimization = 0;

//var solr_search_action = solr_prefix_url+solr_collection+"/select";
//var solr_stream_action = solr_prefix_url+solr_collection+"/stream";
var solr_search_action = robust_solr_prefix_url+solr_collection+"/select";
var solr_stream_action = robust_solr_prefix_url+solr_collection+"/stream";

var babel_prefix_url = "https://babel.hathitrust.org/cgi/pt";
var image_server_base_url = "https://babel.hathitrust.org/cgi/imgsrv/image";

//var ef_download_url  = "http://solr1.htrc.illinois.edu:8080/get";
//var ef_download_url  = "http://localhost:8080/htrc-access-ef/get";
var ef_download_url  = base_domain_url+"/htrc-ef-access/get";

var workset_base_url    = base_domain_url+"/dcWSfetch/";
var publish_workset_url = base_domain_url+"/fetchCollection";

//var sparql_url = "https://solr1.htrc.illinois.edu/triple-store/sparql";
var sparql_url = base_domain_url+"/triple-store/sparql";

var worksets_api_url = base_domain_url+"/worksets-api/worksets";


//var num_found_vol_limit_str  = "100,000";
var num_found_vol_limit_str  = "4,000,000";
//var num_found_page_limit = 700000;
//var num_found_page_limit = 4000000;
var num_found_page_limit = 40000000;
//var num_found_page_limit = 80000000; // potentially too high, causing JSON syntax error
var num_found_vol_limit  = num_found_vol_limit_str.replace(/,/g,"");

var num_results_per_page = 15;
var num_found=0;

var arg_indent = "on";
var arg_wt     = "json";

//var export_ef_limit = 1000;
// The following used to be 5000, but this triggered 'Form too large: 210024 > 200000' in Jetty
// Limit can be increased, but seems to be a Jetty specific way
var export_ef_limit = 4000; 
    

var SolrEFSettings = {
    iprogressbar_delay_threshold: 3000 // used to be 5000 msecs
}


$.ajax({
    type: "GET", 
    url: worksets_api_url,
    data: 'vis=public',
    dataType: "json",
    success: function(json_data) {
	console.log("Updating static list of worksets_public_lookup with dynamically retrieved information");
	if (json_data.hasOwnProperty('graph')) {
	    $.each(json_data["graph"], function (wsid_index, wsid_val) {
		var workset_id_url = wsid_val["id"];
		var workset_title = wsid_val["title"];
		worksets_public_lookup[workset_id_url] = workset_title;
	    });
	}
    }
});

var solr_total_num_vols  = 15000000;
var solr_total_num_pages = 5700000000;

$.ajax({
    type: "GET", 
    url: solr_search_action,
    //data: 'q=volumeid_s:*',
    data: 'q=*:*', // technically this works out total of pages *and* vols, but is quicker to return than strict volumeid_s count
    dataType: "json",
    success: function(json_data) {
	if (json_data.hasOwnProperty('response')) {
	    var num_found = json_data["response"].numFound;
	    if (num_found !== undefined) {
		console.log("Dynamically retrieved number of pages in collection: " + num_found);
		solr_total_num_pages = num_found;
	    }
	}
    }
});


$.ajax({
    type: "GET", 
    url: solr_search_action,
    data: 'q=schemaVersion_s:*',
    dataType: "json",
    success: function(json_data) {
	if (json_data.hasOwnProperty('response')) {
	    var num_found = json_data["response"].numFound;
	    if (num_found !== undefined) {
		console.log("Dynamically retrieved number of volumes in collection: " + num_found);
		solr_total_num_vols = num_found;
	    }
	}
    }
});

