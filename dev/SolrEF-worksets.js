
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
	    //var describe_url = "http://acbres224.ischool.illinois.edu:8080/dcWSfetch/getWsDescripWithVolMeta?id=" + workset_id;
	    var describe_url = "https://solr1.ischool.illinois.edu/dcWSfetch/getWsDescripWithVolMeta?id=" + workset_id;
	    
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


function workset_enrich_results(itemURLs)
{
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
    
    //var sparql_url = "http://acbres224.ischool.illinois.edu:8890/sparql";
    var sparql_url = "https://solr1.ischool.illinois.edu/triple-store/sparql";
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
