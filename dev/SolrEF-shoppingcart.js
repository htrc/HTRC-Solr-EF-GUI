"use strict";

var store_shoppingcart_ids = [];
var store_shoppingcart_ids_hash = {};

var $selected_items = $([]);

var dragging_started = false;

var shoppingcart_debug = false;

function update_select_all_none_buttons()
{
    var num_selected_items = $("#search-results .ui-draggable").length;
    if (num_selected_items == 0) {
	$('#sr-deselect-all').prop('disabled',true);
	$('#sr-invert-selection').prop('disabled',true);
    }
    else {
	$('#sr-deselect-all').prop('disabled',false);
	$('#sr-invert-selection').prop('disabled',false);
    }    
}
    
function make_draggable($elem)
{
    $elem.draggable({
	revert: "invalid",
	cursorAt: { left: 5, top: 5 },

	create: function() {
	    if (shoppingcart_debug) {
		console.log("draggable create()");
	    }
	},	

	helper: function() {
	    var $dragging_helper = $('<div>')
	    	.attr("id","dragging-helper")
		.attr("class","ui-selected")
		.css("z-index",5);
	    
	    var $dragging_helper_label = $('<span>')
		.attr("id","dragging-helper-label")
		.attr("class","nobr");
	    
	    $dragging_helper.append($dragging_helper_label);
    
	    $selected_items = $("#search-results .ui-draggable");
	    var num_selected_items = $selected_items.length;
	    
	    var units = (num_selected_items == 1) ? "item" : "items";
	    var label = num_selected_items + " selected " + units;
	    $dragging_helper_label.html(label);

	    $('#droppable-targets').append($dragging_helper);
	    
	    return $dragging_helper;
	},

	start: function(ev, ui) {
	    if (shoppingcart_debug) {
		console.log("draggable start()");
	    }
	    dragging_started = true;
	},
		
	//drag: function(ev, ui) { // ****
	//    //console.log("draggable drag()");
	//},

	stop: function() {
	    if (shoppingcart_debug) {
		console.log("draggable stop()");
	    }
	    dragging_started = false;
	},	
    });

    $elem.find('input.sr-input-item').prop("checked",true);

    update_select_all_none_buttons();
}

function make_undraggable($elem)
{
    // in case an inner element also selected (such as from from a rubber-banding drag)
    $elem.find(".ui-selected").removeClass("ui-selected"); 
    $elem.removeClass("ui-selected");
    
    if ($elem.hasClass("ui-draggable")) {
	$elem.draggable("destroy");
    }

    $elem.find('input.sr-input-item').prop("checked",false);
    
    update_select_all_none_buttons();
}

function make_selectable()
{	
    var selectable_prev_pos = -1;

    if ($('#search-results').hasClass("ui-selectable")) {
	$('#search-results').selectable("destroy");
    }
	
    $('#search-results').selectable({
	cancel: 'a,span,.htrc-delete-container',
	//filter: ":not(.sr-input-item)",
	
	distance: 2,
	create: function(ev, ui) {
	    console.log("selectable create()");
	},

	start: function(ev, ui) {
	    if (shoppingcart_debug) {
		console.log("selectable start()");
	    }
	},
	
	selected: function(ev, ui) {
	    if (shoppingcart_debug) {
		console.log("selectable selected()");
	    }
	},
	
	unselecting: function(ev, ui) {
	    if (shoppingcart_debug) {
		console.log("selectable unselecting()");
	    }
	},

	unselected: function(ev, ui) {
	    if (shoppingcart_debug) {
		console.log("selectable unselected() -- away to destroy draggable");
	    }
	    var $ui_unselected = $(ui.unselected);
	    make_undraggable($ui_unselected);
	},

	
	stop: function(ev, ui) {
	    if (shoppingcart_debug) {
		console.log("selectable stop()");
	    }
	    
	    $('#search-results > div.ui-selected').each(function() {
		var $this = $(this);
		if (!$this.hasClass("ui-draggable")) {
		    if (shoppingcart_debug) {
			console.log("***   making draggable, this = " + this);
		    }
		    make_draggable($this);
		}
	    });
	}
    });
}


function make_clickable()
{
    var selectable_prev_pos = -1;
    
    $('#search-results > div.ui-selectee').on("click.drag", function(ev) {
	var $this = $(this);
	if (shoppingcart_debug) {
	    console.log("*** clickable item() : ev.target = " + ev.target + ", this = " + this);
	    console.log("***                  : ev.target.class = " + $(ev.target).attr("class") + ", this.id = " + $(this).attr("id"));
	}

	if ($(ev.target).hasClass("sr-input-item")) {
	    // Don't want to respond to click here => let the 'change' listener for the checkbox do its thing later on!
	    return;
	}

	var opt_selected_text = getSelectedText();
	if (opt_selected_text != "") {
	    // the user has selected some text within the item, allow this to
	    // stand, and do not allow the whole item to be selected until the
	    // text highlight is no longer present
	    return;
	}
	
	var selectable_curr_id = $(this).attr("id");
	var selectable_curr_pos = selectable_curr_id.replace(/^seqs-outer-div-/,"");
	
	if (ev.ctrlKey) {
	    if ($this.hasClass("ui-selected")) {
		// deselect it
		if (shoppingcart_debug) {
		    console.log("*** control key is down: destroying this draggable and deselecting it");
		}
		make_undraggable($this);
	    }
	    else {
		// make this one item selected
		$this.addClass("ui-selected");
		make_draggable($this);
		selectable_prev_pos = selectable_curr_pos;
	    }
	}
	else {
	   		    
	    if (ev.shiftKey && selectable_prev_pos > -1) {
		
		var start_pos = Math.min(selectable_prev_pos, selectable_curr_pos);
		var end_pos   = Math.max(selectable_prev_pos, selectable_curr_pos);

		if (start_pos != end_pos)  {
		    for (var pos=start_pos; pos<=end_pos; pos++) {
			var $elem = $('#seqs-outer-div-'+pos);
			$elem.addClass('ui-selected');
			make_draggable($elem);
		    }
		    
		    //selectable_prev_pos = -1; // ****
		    selectable_prev_pos = selectable_curr_pos;
		}
	    }
	    else {
	    
		// make it the only selected item
		if (shoppingcart_debug) {
		    console.log("*** destroying draggables, reseting selectable, making this item selected");
		}
		
		// reset #search-results back to being fully selectable
		selectable_and_draggable_hard_reset();
		
		// make this one item selected
		$this.addClass("ui-selected");
		make_draggable($this);

		selectable_prev_pos = selectable_curr_pos;
	    }
	}		
    });        
}

function convert_close_to_shoppingcart_action($close_button)
{
    var $cart_marker = $('<div>')
	.attr("class","shoppingcart-marker");
		
    $close_button.css("padding",1);
    $close_button.attr("title","Open shopping cart");
    $close_button.html($cart_marker);
    $close_button.off("click.deleteitem");
    $close_button.on("click.openshoppingcart",open_shoppingcart);
}


function make_selectable_and_draggable($search_results)
{        
    $("#trashcan-drop").droppable({
	accept: ".ui-draggable",
	classes: {
	    "ui-droppable-active": "ui-state-active",
	    "ui-droppable-hover": "ui-state-highlight"
	},
	tolerance: "pointer",
	drop: function(event,ui) {
	    $selected_items.each(function() {
		var $close_div = $(this).find(".htrc-delete");
		$close_div.trigger("click");
	    });
	    selectable_and_draggable_hard_reset();
	}
    });

    $("#shoppingcart-drop").droppable({
	accept: ".ui-draggable",
	classes: {
	    "ui-droppable-active": "ui-state-active",
	    "ui-droppable-hover": "ui-state-highlight"
	},
	tolerance: "pointer",
	drop: function(event,ui) {
	    if (shoppingcart_debug) {
		console.log("*** XSession ID = " + getXSessionId());
	    }

	    $selected_items.each(function() {
		var $this = $(this);

		var item_id = $this.find('span[name]').attr("name");
		store_shoppingcart_ids.push(item_id);
		store_shoppingcart_ids_hash[item_id] = item_id;
		
		// Change delete (by clilcking on the cross) behaviour to open/view shoppingcart
		var $close_button = $this.find(".htrc-delete");

		convert_close_to_shoppingcart_action($close_button);
		
		make_undraggable($this);
	    });

	    var shoppingcart_len = store_shoppingcart_ids.length;
	    if (shoppingcart_len == 1) {
		$('#shoppingcart-label').html("(1 item)")
		$('#shoppingcart-drop-wrapper').attr("title","Click to open shopping cart");
	    }
	    else {
		$('#shoppingcart-label').html("(" + shoppingcart_len + " items)");
		if (shoppingcart_len == 0) {
		    $('#shoppingcart-drop-wrapper').attr("title","");
		}
		else {
		    $('#shoppingcart-drop-wrapper').attr("title","Click to open shopping cart");
		}
	    }

	    selectable_and_draggable_hard_reset();
	}
    });

    $("#shoppingcart-drop").click(open_shoppingcart);
	
    make_selectable();
    make_clickable();    
}

function open_shoppingcart()
{
    // (id:inu.32000009471279)+OR+(id:mdp.39015001149007)
    
    var ids_escaped = store_shoppingcart_ids.map(escape_solr_query).map(function(id){return "(id:"+id+")"});	
    var ids_or_str = ids_escaped.join(" OR ");	
    
    var load_shoppingcart_url = window.location.pathname + "?solr-q=" + ids_or_str;
    var win = window.open(load_shoppingcart_url, '_blank');
    if (win) {
	// => Browser has allowed it to be opened
	win.focus();
    }
    else {
	// => Browser has blocked it
	alert('New window/tab request blocked by browser.\nPlease enable popups for this website');
    }
}

function load_solr_q(solr_q)
{
    initialize_new_solr_search();

    doc_unit  = " volume ";
    doc_units = " volumes ";

    
    var arg_start = 0;
    var group_by_vol_checked = false;

    initiate_new_solr_search(solr_q,arg_start,group_by_vol_checked);
}

function selectable_and_draggable_hard_reset()
{
    $('#search-results > div.ui-draggable').removeClass("ui-selected");
    $('#search-results > div.ui-draggable').draggable("destroy");
    $('#search-results').selectable("destroy");
    make_selectable();
	
    $('#search-results input.sr-input-item').prop("checked",false);

    $('#sr-deselect-all').prop('disabled',true);
    $('#sr-invert-selection').prop('disabled',true);
}

$(document).ready(function() {
    
    $('body').keyup(function(ev) {	
	if (ev.keyCode == 27){
	    // reset selctable area
	    if ($("#search-results .ui-draggable").length>0) {
		if (shoppingcart_debug) {
		    console.log("**** Detected escape keyup: away to destroy draggables and reset");
		}
		selectable_and_draggable_hard_reset();
	    }		
	}
    });


    $('body').click(function(ev) {
	// ev.target is inner element => check ancestors to see if within #search-results area
	// Only if it *isn't* an ancestor should we look to reset

	if ($(ev.target).hasClass("sr-item-multisel")) {
	    // click on one of the multiple select/deselect/invert buttons
	    return;
	}
	
	if (dragging_started) { return; }
		
	var click_outside_search_results = ($(ev.target).closest('#search-results').length == 0);
	
	if (click_outside_search_results) {
	    if ($("#search-results .ui-draggable").length>0) {
		if (shoppingcart_debug) {
		    console.log("**** Detected outside click: away to destroy draggables and reset");
		}
		selectable_and_draggable_hard_reset();
	    }
	}	
    });
})
