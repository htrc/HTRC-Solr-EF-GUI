
// =====
// JavaScript Library for parsing Lucene/Solr query syntax:
//   https://github.com/thoward/lucene-query-parser.js/wiki

function query_breakdown_single_term_or_phrase(term)
{
    var processed_term;
    
    if (term.indexOf(' ') > 0) {
	// needs to be a phrase
	processed_term = "\"" + term + "\"";
    }
    else {
	processed_term = term;
    }
    
    return processed_term;
}
    
function query_breakdown_tostring(parse_tree)
{
    var query_str = "";

    if (parse_tree.left) {

	if (parse_tree.field) {
	    query_str += parse_tree.field + ":(";
	}
	else {
	    if (parse_tree.left.right) {
		// sign of a complex structure
		query_str += "(";
	    }
	}
	
	query_str += query_breakdown_tostring(parse_tree.left);

	if ((!parse_tree.field) && (parse_tree.left.right)) {
	    query_str += ")";
	}
	
	if (parse_tree.operator) {
	    // RHS nested node

	    if (parse_tree.operator == "<implicit>") {
		query_str += " ";
	    }
	    else {
		query_str += " " + parse_tree.operator + " ";
	    }

	    if ((parse_tree.operator == "AND") && (parse_tree.right.right)) {
		query_str += "(";
	    }
	    query_str += query_breakdown_tostring(parse_tree.right);
	    if ((parse_tree.operator == "AND") && (parse_tree.right.right)) {
		query_str += ")";
	    }

	}

	if (parse_tree.field) {
	    query_str += ")";
	}
    }
    else {
	// leaf
	if (parse_tree.prefix) {
	    query_str += parse_tree.prefix;;
	}

	if ((parse_tree.field) && (parse_tree.field != "<implicit>")) {
	    query_str += parse_tree.field + ":";
	}

	if (parse_tree.term_min) {
	    // evidence of a range
	    if (parse_tree.inclusive === true) {
		query_str += "[";
	    }
	    else if (parse_tree.inclusive === false) {
		query_str += "{";
	    }
	    else if (parse_tree.inclusive_min === true) {
		query_str += "[";
	    }
	    else if (parse_tree.inclusive_min === false) {
		query_str += "{";
	    }
	    else {
		console.error("Unrecognized opening inclusive range in parse_breakdown()");
	    }
	    
	    query_str += query_breakdown_single_term_or_phrase(parse_tree.term_min);
	    query_str += " TO ";
	    query_str += query_breakdown_single_term_or_phrase(parse_tree.term_max);

	    if (parse_tree.inclusive === true) {
		query_str += "]";
	    }
	    else if (parse_tree.inclusive === false) {
		query_str += "}";
	    }
	    else if (parse_tree.inclusive_max === true) {
		query_str += "]";
	    }
	    else if (parse_tree.inclusive_max === false) {
		query_str += "}";
	    }
	    else {
		console.error("Unrecognized closing inclusive range in parse_breakdown()");
	    }
	}
	else {
	    query_str += query_breakdown_single_term_or_phrase(parse_tree.term);

	    if (parse_tree.proximity) {
		query_str += "^" + parse_tree.proximity;
	    }
	    if (parse_tree.boost) {
		query_str += "~" + parse_tree.boost;
	    }
	    if (parse_tree.similarity) {
		query_str += "~" + parse_tree.similarity;
	    }

	}
    }
	

    return query_str;
}

function query_breakdown_has_removed_id_INCOMPLETE(parse_tree)
{
    if (parse_tree.operator) {
	var left_has_id = query_breakdown_has_id(parse_tree.left);
	if (left_has_id) {
	    return true;
	}

	var right_has_id = query_breakdown_has_removed_id(parse_tree.right);
	if (right_has_id) {
	    return true;
	}
    }

    return false;
}

function query_has_removed_id(query_str)
{
    return (query_str.indexOf(" -id:")>0);
}

function query_breakdown_only_volume_metadata(parse_tree)
{
    if (parse_tree.left) {

	var left_only_vmd = query_breakdown_only_volume_metadata(parse_tree.left);
	
	if (parse_tree.operator) {
	    var right_only_vmd = query_breakdown_only_volume_metadata(parse_tree.right);
	
	    if (left_only_vmd && right_only_vmd) {
		return true;
	    }
	    else {
		return false;
	    }
	}
	else {
	    return left_only_vmd;
	}
    }
    else {	
	if ((parse_tree.field) && (parse_tree.field != "<implicit>")) {
	    var field =  parse_tree.field;
	    if (field.match(/^volume/) || field.match(/_t$/)) {
		// positively established
		return true;
	    }
	}

	// Get to here => can't explicitly determine only volume-level
	return false;
    }
}

function query_breakdown_only_page_text(parse_tree)
{
    if (parse_tree.left) {

	var left_only_pt = query_breakdown_only_page_text(parse_tree.left);
	
	if (parse_tree.operator) {
	    var right_only_pt = query_breakdown_only_page_text(parse_tree.right);
	
	    if (left_only_pt && right_only_pt) {
		return true;
	    }
	    else {
		return false;
	    }
	}
	else {
	    return left_only_pt;
	}
    }
    else {	
	if ((parse_tree.field) && (parse_tree.field != "<implicit>")) {
	    var field =  parse_tree.field;
	    if (field.match(/_htrctokentext$/)) {
		// positively established
		return true;
	    }
	}

	// Get to here => can't explicitly determine only volume-level
	return false;
    }
}

function query_breakdown_monitor_leaf(leaf,monitor)
{

    if ((leaf.field) && (leaf.field != "<implicit>")) {
	var field =  leaf.field;
	var term =  leaf.term;

	//console.log("*** monitor leaf: " + field +":" + term); // ****
	
	// update monitor
	var last_pos = monitor.length-1;
	if (last_pos>=0) {
	    var current_AND = monitor[last_pos];
	    if (term in current_AND) {
		var field_lookup = current_AND[term];
		if (field in field_lookup) {
		    field_lookup[field]++;
		}
		else {
		    field_lookup[field] = 1;
		}
	    }
	    else {
		current_AND[term] = {};
		current_AND[term][field] = 1;
	    }
	}
	else {
	    // monitor has no entries at all, at this stage
	    var term_rec = {};
	    term_rec[term] = {};
	    term_rec[term][field] = 1;
	    monitor.push( term_rec );
	}
	
	// still on track
	return true;
    }
    else {
	// no field explicitly mentioned => can't be the case that all fields are present in query
	return false;
    }
}

function query_breakdown_monitor_always_OR(parse_tree,monitor)
{
    if (parse_tree.left) {

	if (parse_tree.operator) {
	    if (parse_tree.operator == "OR") {
		
		var left_on_track = query_breakdown_monitor_always_OR(parse_tree.left,monitor);
		if (!left_on_track) {
		    return false;
		}

		// still on track
		var right_on_track = query_breakdown_monitor_always_OR(parse_tree.right,monitor);
		return right_on_track;
	    }
	    else {
		return false;
	    }
	}
	else {
	    // going through bracket
	    var left_on_track = query_breakdown_monitor_always_OR(parse_tree.left,monitor);
	    return left_on_track;
	}
    }
    else {
	return query_breakdown_monitor_leaf(parse_tree,monitor);
    }	
}


function query_breakdown_monitor_rhs_AND_chain(parse_tree,monitor)
{
    // Query needs to conform to Conjuction (AND) or Disjunction (OR) terms
    
    if (parse_tree.left) {

	if (parse_tree.operator) {
	    if (parse_tree.operator == "AND") {

		monitor.push({});
		
		var left_on_track = query_breakdown_monitor_always_OR(parse_tree.left,monitor);
		if (!left_on_track) {
		    return false;
		}

		monitor.push({});

		// still on track
		var right_on_track = query_breakdown_monitor_rhs_AND_chain(parse_tree.right,monitor);
		return right_on_track;	
	    }
	    else if (parse_tree.operator == "OR") {
		// still OK if everything from here in the 'right' branch is all OR terms

		var left_on_track = query_breakdown_monitor_always_OR(parse_tree.left,monitor);
		if (!left_on_track) {
		    return false;
		}

		var right_on_track = query_breakdown_monitor_always_OR(parse_tree.right,monitor);		    
		return right_on_track;
	    }
	}
	else {
	    // going through a 'brackets' node => treat as transparent node
	    var left_on_track = query_breakdown_monitor_rhs_AND_chain(parse_tree.left,monitor);
	    return left_on_track;
	}
    }
    else {
	return query_breakdown_monitor_leaf(parse_tree,monitor)
    }
}

function query_breakdown_volume_title_simplification(volume_monitor)
{
    var simplified_query_str = "";
    var simplifies = true;
    
    for (var i=0; i<volume_monitor.length; i++) {
	var or_terms = volume_monitor[i];
	var or_keys = Object.keys(or_terms);
	
	for (var orkey_pos=0; orkey_pos<or_keys.length; orkey_pos++) {
	    var orkey = or_keys[orkey_pos];
	    
	    var field_lookup = or_terms[orkey];
	    var field_keys = Object.keys(field_lookup);
	    
	    if (field_keys.length == 1) {
		if ('title_t' in field_lookup) {
		    simplified_query_str += " " + orkey;
		}
		else {
		    simplifies = false;
		    break;
		}
	    }
	    else {
		simplifies = false;
		break;
	    }
	}
    }

    return { 'simplifies': simplifies, 'simplified_query_str': simplified_query_str };
}

function query_breakdown_volume_allfields_simplification(volume_monitor)
{
    var simplified_query_str = "";
    var simplifies = true;
    
    for (var i=0; i<volume_monitor.length; i++) {
	var or_terms = volume_monitor[i];
	var or_keys = Object.keys(or_terms);

	for (var orkey_pos=0; orkey_pos<or_keys.length; orkey_pos++) {
	    var orkey = or_keys[orkey_pos];
	    
	    var field_lookup = or_terms[orkey];
	    var field_keys = Object.keys(field_lookup);
	    
	    for (var vmi = 0; vmi < volume_metadata_fields_common.length; vmi++) {
		var vm_field = volume_metadata_fields_common[vmi];
		
		if (!(vm_field in field_lookup)) {
		    simplifies = false;
		    break;
		}
	    }

	    if (simplifies) {
		simplified_query_str += " " + orkey;
	    }
	    else {
		break;
	    }
	}
    }

    return { 'simplifies': simplifies, 'simplified_query_str': simplified_query_str };
}

function query_breakdown_volume_simplification(parse_tree)
{
    var volume_monitor = [];

    var volume_on_track = query_breakdown_monitor_rhs_AND_chain(parse_tree,volume_monitor);

    if (volume_on_track) {
	// study 'volume__monitor' to determine if the form version of the query
	// can be simplified: either to just a title search, or all fields search
	// If so, return a freshly build simplified parse tree if it was
	console.log("**** volume is in Sum-of-Prods format");
	console.log("*** monitor = " + JSON.stringify(volume_monitor));

	var title_simplified_info = query_breakdown_volume_title_simplification(volume_monitor);
	
	if (title_simplified_info.simplifies) {
	    console.log("**** volume expression simplifies as only specifies title_t terms");
	    parse_tree = lucenequeryparser.parse(title_simplified_info.simplified_query_str);
	}
	else {
	    var allfields_simplified_info = query_breakdown_volume_allfields_simplification(volume_monitor);
	    if (allfields_simplified_info.simplifies) {
		console.log("**** volume expression simplifies as only specifies all fields present");
		parse_tree = lucenequeryparser.parse(allfields_simplified_info.simplified_query_str);
		$('#search-all-vfields').prop("checked",true);
	    }	    
	}
	
    }
    else {
	console.log("**** volumedoes NOT meeting Sum-of-Prods form");
    }
    
    return parse_tree;
}




function query_breakdown(query_str)
{
    // determine if the query can be displayed using one of the query forms (page, volume, combined)
    // or needs to be a raw advanced query
    // Example records returned:
    //  { 'form-friendly': true, 'form-type': QueryTabEnum.Combined,
    //     'volume-q': "title_t:Sherlock AND genre_t:Mystery", 'page-q': "violin" }
    // OR
    //  { 'form-friendly': false, 'raw-q': "X OR Y ... Z -id:XXX" }


    // Solr syntax allows for terms of the form -field:term, whereas Lucene does not
    // We use this syntax to remove documents by id so ...
    // => need to process the query as a string initial to determine if such syntax is present
    //    as it will not parse with the luceneparser class
    
    // Scan for any IDs => presence means needs to be raw query 
    var has_removed_id = query_has_removed_id(query_str);
    if (has_removed_id) {
	
	return { 'form-friendly': false, 'raw-q': query_str }
    }

    // If get to here, then no -id:xxx entries in query_str
    var parse_tree = lucenequeryparser.parse(query_str);

    console.log("*** reconstructed query = " + query_breakdown_tostring(parse_tree));

    var only_volume_metadata = query_breakdown_only_volume_metadata(parse_tree);
    if (only_volume_metadata) {
	
	return { 'form-friendly': true, 'form-type': QueryTabEnum.Volume,
		 'volume-q': parse_tree };
    }

    var only_page_text = query_breakdown_only_page_text(parse_tree);
    if (only_page_text) {
	
	return { 'form-friendly': true, 'form-type': QueryTabEnum.Page,
		 'page-q': parse_tree };
    }
    
    return { 'form-friendly': false, 'raw-q': query_str }
}

function select_optimal_query_tab(text_q)
{
    var query_ui_breakdown = query_breakdown(text_q);

    if (query_ui_breakdown['form-friendly']) {
	var form_type = query_ui_breakdown['form-type'];

	if (form_type == QueryTabEnum.Volume) {
	    var parse_tree = query_ui_breakdown['volume-q'];
	    var simplified_parse_tree = query_breakdown_volume_simplification(parse_tree);
	    
	    var query_str_simplified = query_breakdown_tostring(simplified_parse_tree);

	    $('#tab-volume').click();
	    $('#vq').val(query_str_simplified);


	}
	else if (form_type == QueryTabEnum.Page) {
	    var parse_tree = query_ui_breakdown['page-q'];
	    var simplified_parse_tree = parse_tree.left.left;
	    simplified_parse_tree.field = "<implicit>";
	    var query_str_simplified = query_breakdown_tostring(simplified_parse_tree);

	    $('#tab-page').click();
	    $('#q').val(query_str_simplified);
	}
	else {
	    console.error("select_optimal_query_tab(): Unrecognized form type '" + form_type + "'");
	}
    }
    else {
	$('#tab-advanced').click();
	$('#advanced-q').val(text_q);
    }
    
}
