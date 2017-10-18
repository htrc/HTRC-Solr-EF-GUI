"use strict";

var store_shoppingcart_ids = [];

var $selected_items = $([]);


var dragging_started = false;

function make_draggable($elem)
{
    $elem.draggable({
	revert: "invalid",
	cursorAt: { left: 5, top: 5 },

	create: function() {
	    console.log("draggable create()");
	},	

	helper: function() {
	    var $dragging_helper = $('<div>')
	    	.attr("id","dragging-helper")
		.attr("class","ui-selected")
	    var $dragging_helper_label = $('<span>')
		.attr("id","dragging-helper-label")
		.attr("class","nobr");
	    
	    $dragging_helper.append($dragging_helper_label);
    
	    //$selected_items = $("#search-results .ui-selected"); // ****
	    $selected_items = $("#search-results .ui-draggable");
	    var num_selected_items = $selected_items.length;
	    
	    var units = (num_selected_items == 1) ? "item" : "items";
	    var label = num_selected_items + " selected " + units;
	    $dragging_helper_label.html(label);

	    $('#droppable-targets').append($dragging_helper);
	    
	    return $dragging_helper;
	},

	start: function(ev, ui) {
	    console.log("draggable start()");
	    dragging_started = true;
	},
		
	//drag: function(ev, ui) { // ****
	//    //console.log("draggable drag()");
	//},

	stop: function() {
	    console.log("draggable stop()");
	    dragging_started = false;
	},	


    });
}

function make_selectable()
{	
    var selectable_prev_pos = -1;
    
    $('#search-results').selectable({
	cancel: 'a,span,.htrc-delete-container',

	distance: 2,
	create: function(ev, ui) {
	    console.log("selectable create()");
	},

	start: function(ev, ui) {
	    console.log("selectable start()");
	    //selection_initiated = true;  // ****
	    //selection_started = true;
	    //selection_started_id = null;
	    //selection_stopped_id = null;
	},
	
	selected: function(ev, ui) {
	    console.log("selectable selected()");
	    //selection_curr_id = $(ui.selected).attr("id"); // ****
	    //if (selection_started) {
	    //	selection_started_id = selection_curr_id;
	    //	selection_started = false;
	    //}
	},
	
	unselecting: function(ev, ui) {
	    console.log("selectable unselecting()");
	},

	unselected: function(ev, ui) {
	    console.log("selectable unselected() -- away to destroy draggable");
	    var $ui_unselected = $(ui.unselected);
	    if ($ui_unselected.hasClass("ui-draggable")) {
		$ui_unselected.draggable("destroy");
	    }
	},

	
	stop: function(ev, ui) {
	    console.log("selectable stop()");
	    //selection_stopped_id = selection_curr_id; // ****
	    
	    $('#search-results > div.ui-selected').each(function() {
		var $this = $(this);
		if (!$this.hasClass("ui-draggable")) {
		
		    console.log("** making draggable, this = " + this);
		
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
	//console.log("*** clicked on id=" + $this.attr("id") + ", selection_initiated = " + selection_initiated); // ****
	//console.log("*** start id = " + selection_started_id + ", stopped id = " + selection_stopped_id);

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
		console.log("*** control key is down: destroying this draggable and deselecting it");
		$this.draggable("destroy");
		$this.find(".ui-selected").removeClass("ui-selected"); // in case an inner element selected from a rubber-band drag
		$this.removeClass("ui-selected");
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
		console.log("*** destroying draggables, reseting selectable, making this item selected");
		
		// reset #search-results back to being fully selectable
		$('#search-results > div.ui-draggable').removeClass("ui-selected");
		$('#search-results > div.ui-draggable').draggable("destroy");
		$('#search-results').selectable("destroy");
		make_selectable();
		
		// make this one item selected
		$this.addClass("ui-selected");
		make_draggable($this);

		selectable_prev_pos = selectable_curr_pos;
	    }
	}
	
	//selection_initiated = false;
	//selection_started_id = null;
	//selection_stopped_id = null;
		
    });        
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
	    $('#search-results').selectable("destroy");
	    $('#search-results > div.ui-draggble').draggable("destroy");
	    make_selectable();
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
	    console.log("*** XSession ID = " + getXSessionId());

	    $selected_items.each(function() {
		var $this = $(this);

		var item_id = $this.find('span[name]').attr("name");
		store_shoppingcart_ids.push(item_id);
		
		// Change immediate delete (cross) behaviour to view shoppingcart
		var $close_div = $this.find(".htrc-delete");
		var $cart_marker = $('<div>')
		    .attr("class","shoppingcart-marker");
		
		$close_div.css("padding",1);
		$close_div.attr("title","Open shopping cart");
		$close_div.html($cart_marker);
		$close_div.off("click.deleteitem");
		$close_div.on("click.openshoppingcart",open_shoppingcart);
		
		$this.draggable("destroy");
		$this.removeClass("ui-selected");
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
	    
	    $('#search-results').selectable("destroy");
	    $('#search-results > div.ui-draggble').draggable("destroy");
	    make_selectable();

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

$(document).ready(function() {
    
    $('body').keyup(function(ev) {	
	if (ev.keyCode == 27){
	    // reset selctable area
	    if ($("#search-results .ui-draggable").length>0) {
		console.log("**** Detected escape keyup: away to destroy draggables and reset");
		$('#search-results > div.ui-draggable').removeClass("ui-selected");
		$('#search-results > div.ui-draggable').draggable("destroy");
		$('#search-results').selectable("destroy");
		make_selectable();
	    }		
	}
    });


    $('body').click(function(ev) {
	// ev.target is inner element => check ancestors to see if within #search-results area
	// Only if it *isn't* an ancestor should we look to reset

	if (dragging_started) { return; }
		
	var click_outside_search_results = ($(ev.target).closest('#search-results').length == 0);
	
	if (click_outside_search_results) {
	    if ($("#search-results .ui-draggable").length>0) {
		console.log("**** Detected outside click: away to destroy draggables and reset");
		$('#search-results > div.ui-draggable').removeClass("ui-selected");
		$('#search-results > div.ui-draggable').draggable("destroy");
		$('#search-results').selectable("destroy");
		make_selectable();
	    }
	}	
    });
})
