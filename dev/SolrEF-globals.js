"use strict";

var QueryTabEnum = {
    Page: 0,
    Volume: 1,
    Combined: 2,
    Advanced: 3
};

var solref_verbosity = 1;

var store_query_tab_selected = null;
var store_interaction_style = null;

var store_search_xhr = null;

var group_by_vol_checked = 0;
var doc_unit  = "";
var doc_units = "";
