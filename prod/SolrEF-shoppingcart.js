//"use strict";

var store_shoppingcart_ids = [];
var store_shoppingcart_ids_hash = {};

var dragging_started = false;

var shoppingcart_debug = false;
//var shoppingcart_debug = true;

function retrieve_shoppingcart(url_pos)
{
    // Fire off Ajax call to Retrieve shopping cart 
    var shoppingcart_key = getShoppingcartId();

    var url = ef_shoppingcart_url[url_pos];
    
    $.ajax({
	type: "POST",
	url: url,
	data: {
	    'action': 'shoppingcart',
	    'mode': 'get-silentfail',
	    'key': shoppingcart_key
	},
	dataType: "text",
	success: function(textData) {
	    console.log("Retrieved shopping cart '" + shoppingcart_key + "': " + textData);
	    if (textData != "") {
		var cart = JSON.parse(textData);
		store_shoppingcart_ids = cart.cart.vol_ids_;	 // ******

		if (store_query_display_mode != QueryDisplayModeEnum.ShoppingCart) {
		    mark_shoppingcart_items_in_resultset();
		}
		
		update_shoppingcart_count();
	    }
	    //console.log("Shopping cart: " + add_shoppingcart_ids.length + "item(s) successfully added");

	    // if search results finished, set_shoppingcart_icons(); // ******
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		console.log("Warning: failed to retrieve shopping-cart id="+shoppingcart_id+ " from: " + url);
		console.log("Trying next URL:" + ef_shoppingcart_url[next_url_pos]);
		retrieve_shoppingcart(next_url_pos)
	    }
	    else {
		//$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
		if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapit_failed = true;
		    var mess = '<b>Failed to retrieve shopping-cart information when accessing URL:'
		    mess +=    '<div style="margin: 0 0 0 10px">' + ef_accessapi_url + '</div>';
		    mess +=    'Items in shopping-cart currently unavailable.</b>';
		    
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to retrieve shopping-cart information",jqXHR,textStatus,errorThrown);
		}
	    }
	}
    });
}


function update_select_all_none_buttons()
{
    var num_selected_items;
    if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	num_selected_items = $('#search-results input.sr-input-item:checked').length;
    }
    else {
	num_selected_items = $("#search-results .ui-draggable").length;
    }
    
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
    
	    var $my_selected_items = $("#search-results .ui-draggable");
	    var num_selected_items = $my_selected_items.length;
	    
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
/*
	    var trashcan_title = $('#trashcan-drop').attr('title')
	    if (trashcan_title != "") {
		$('#trashcan-drop').attr('disabled-title',trashcan_title);
		$('#trashcan-drop').tooltip('disable');
		$('#trashcan-drop').removeAttr('title');
	    }
*/
	},
		
	//drag: function(ev, ui) { // ****
	//    //console.log("draggable drag()");
	//},

	stop: function() {
	    if (shoppingcart_debug) {
		console.log("draggable stop()");
	    }
	    dragging_started = false;
/*
	    var trashcan_title = $('#trashcan-drop').attr('disabled-title')
	    if (trashcan_title != "") {
		$('#trashcan-drop').attr('title',trashcan_title)
		$('#trashcan-drop').removeAttr('disabled-title')
		$('#trashcan-drop').tooltip('enable');
	    }
*/
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
	    if (shoppingcart_debug) {
		console.log("selectable create()");
	    }
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

function make_unselectable()
{
    $('#search-results').find(".ui-selected").removeClass("ui-selected"); // ****
    
    if ($('#search-results').hasClass("ui-selectable")) {
	$('#search-results').selectable("destroy");
    }
}


function make_clickable()
{    
    var selectable_prev_pos = -1;
    
    $('#search-results > div.ui-selectee').on("click.drag", function(ev) {
	if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	    if (shoppingcart_debug) {
		console.log("*** preventing click.drag");
	    }
	    return;
	}

	var $this = $(this);
	if (shoppingcart_debug) {
	    console.log("*** clickable item() : ev.target = " + ev.target + ", this = " + this);
	    console.log("***                  : ev.target.class = " + $(ev.target).attr("class") + ", this.id = " + $(this).attr("id"));
	}

	if ($(ev.target).hasClass("sr-input-item")) {
	    // Don't want to respond to click here
	    // => let the 'change' listener for the checkbox do its thing later on!
	    return;
	}

	if ((ev.target.nodeName == "A") || ($(ev.target).hasClass("show-hide-seqs"))) {
	    // user has clicked on a hyperlink
	    // => return to allow it to do its own thing (follow the link)
	    //    and prevent element becoming select
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

function delete_item_from_shoppingcart(url_pos,item_id)
{
    // Delete this id
    var shoppingcart_key = getShoppingcartId();

    var url = ef_shoppingcart_url[url_pos];
    
    $.ajax({
	type: "POST",
	url: url, 
	data: {
	    'action': 'shoppingcart',
	    'mode': 'del-ids',
	    'key': shoppingcart_key,
	    'ids': item_id
	},
	dataType: "text",
	success: function(textData) {
	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		delete_item_from_shoppingcart(next_url_pos,item_id)
	    }
	    else {

		console.log("Deleted Shopping item id:" + item_id);
	    
		// **** consider wrapping up the following two lines in a more ADT-flavours method
		store_shoppingcart_ids=arrayRemoveItem(store_shoppingcart_ids,item_id);
		delete store_shoppingcart_ids_hash[item_id];
		update_shoppingcart_count();
	    }
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		console.log("Warning: failed to delete shopping-cart id="+shoppingcart_id+ " from: " + url);
		console.log("Trying next URL:" + ef_shoppingcart_url[next_url_pos]);
		delete_item_from_shoppingcart(next_url_pos,item_id);
	    }
	    else {
	    
		//$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
		if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapi_failed = true;
		    var mess = "<b>Failed to delete item '"+item_id+"' from shopping-cart when accessing URL: ";
		    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to delete item",jqXHR,textStatus,errorThrown);
		}
	    }
	}
    });		    
}

function delete_item_if_shoppingcart(item_id,$close_div)
{
    if (store_query_display_mode == QueryDisplayModeEnum.ShoppingCart) {
	delete_item_from_shoppingcart(0,item_id)
	/*
	// Delete this id
	var shoppingcart_key = getShoppingcartId();
	
	$.ajax({
	    type: "POST",
	    url: ef_accessapi_url, 
	    data: {
		'action': 'shoppingcart',
		'mode': 'del-ids',
		'key': shoppingcart_key,
		'ids': item_id
	    },
	    dataType: "text",
	    success: function(textData) {
		console.log("Deleted Shopping item id:" + item_id);

		// **** consider wrapping up the following two lines in a more ADT-flavours method
		store_shoppingcart_ids=arrayRemoveItem(store_shoppingcart_ids,item_id);
		delete store_shoppingcart_ids_hash[item_id];
		update_shoppingcart_count();
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		//$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
		if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapi_failed = true;
		    var mess = "<b>Failed to delete item '"+item_id+"' from shopping-cart when accessing URL: ";
		    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to delete item",jqXHR,textStatus,errorThrown);
		}
	    }
	});		    
*/
    }
}
    
function do_delete_drop_action()
{
    var delete_list = []
    
    if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	var $my_checkboxes = $('#search-results input.sr-input-item:checked');

	$my_checkboxes.each(function() {
	    var $close_div = $(this).parent().parent().find(".htrc-delete");
	    
	    delete_list.push($close_div);
	    $close_div.trigger("click");
	    delete_item_if_shoppingcart(item_id,$close_div);
	});
    }		       
    else {
	var $my_selected_items = $("#search-results .ui-draggable");
    
	$my_selected_items.each(function() {
	    var $close_div = $(this).find(".htrc-delete");
	    var shoppingcart_marker = $close_div.find(".shoppingcart-marker");	    
	    if (shoppingcart_marker.length > 0) {
		var item_id = $(this).find("span[name]").attr("name");		
		console.log("The item " + item_id + " is already in the shoppingcat. Ignoring request to delete it from the result set")
	    }
	    else {
		delete_list.push($close_div);
		$close_div.trigger("click");		
		//delete_item_if_shoppingcart(item_id,$close_div); // **** looks like this can be removed now
	    }	    
	});
    }
    selectable_and_draggable_hard_reset();
}

function mark_shoppingcart_items_in_resultset()
{
    // cross-check shoppingcart ids with those in the displayed resultset
    // and change 'x' to be a shoppingcart logo
    
    for (var i=0; i<store_shoppingcart_ids.length; i++) {
	var id = store_shoppingcart_ids[i];
	
	var span_id = $('span[name="'+id+'"]');
	var $span_id = $(span_id);
	//console.log("***### span_id len = " + $span_id.length);
	
	if ($span_id.length>0) {
	    var $close_button = $span_id.parent().find('.htrc-delete')
	    
	    convert_close_to_shoppingcart_action($close_button);
	    var $item_div = $span_id.parent().parent();
	    
	    make_undraggable($item_div);
	}
    }
}

function update_shoppingcart_count()
{
    // console.log("**** update_shoppingcart_count()"); // ****
    
    var shoppingcart_len = store_shoppingcart_ids.length;
    if (shoppingcart_len == 1) {
	$('#shoppingcart-label').html("(1 item)")
	$('#shoppingcart-info-label').html("(1 item)")
	$('#shoppingcart-drop-wrapper').attr("title","Click to open shopping cart");
    }
    else {
	$('#shoppingcart-label').html("(" + shoppingcart_len + " items)");
	$('#shoppingcart-info-label').html("(" + shoppingcart_len + " items)");
	if (shoppingcart_len == 0) {
	    $('#shoppingcart-drop-wrapper').attr("title","");
	}
	else {
	    $('#shoppingcart-drop-wrapper').attr("title","Click to open shopping cart");
	}
    }
}

function add_items_to_shoppingcart(url_pos,add_shoppingcart_ids)
{
    var shoppingcart_key = getShoppingcartId();

    var url = ef_shoppingcart_url[url_pos];
    
    // Fire off Ajax call to save these new IDs under the shoppingcart_id on the server
    $.ajax({
	type: "POST",
	url: url, 
	data: {
	    'action': 'shoppingcart',
	    'mode': 'add-ids',
	    'key': shoppingcart_key,
	    'ids': add_shoppingcart_ids.join(",")
	},
	dataType: "text",
	success: function(textData) {
	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		add_items_to_shoppingcart(next_url_pos,add_shoppingcart_ids)
	    }
	    else {
		console.log("Saved Shopping:" + textData);
		console.log("Shopping cart: " + add_shoppingcart_ids.length + " item(s) successfully added");
	    }
	},
	error: function(jqXHR, textStatus, errorThrown) {

	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		console.log("Warning: failed to add items to shopping-cart id="+shoppingcart_id+ "through: " + url);
		console.log("Trying next URL:" + ef_shoppingcart_url[next_url_pos]);
		add_items_to_shoppingcart(next_url_pos,add_shoppingcart_ids)
	    }
	    else {	    
		//$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
		if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapi_failed = true;
		    
		    var mess = "<b>Failed to add item '"+item_id+"' to shopping-cart when accessing URL: ";
		    mess += '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to add item",jqXHR,textStatus,errorThrown);
		}
	    
	    }
	}
    });
}

function do_shoppingcart_drop_action()
{
    var $my_selected_items = $("#search-results .ui-draggable");
    var shoppingcart_key = getShoppingcartId();

    console.log("*** Shopping cart key = " + shoppingcart_key);
	
    var add_shoppingcart_ids = [];

    if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	var $my_checkboxes = $('#search-results input.sr-input-item:checked');

	$my_checkboxes.each(function() {
	    var item_id = $(this).parent().parent().find('span[name]').attr("name");
	    if (!store_shoppingcart_ids_hash.hasOwnProperty(item_id)) {
		store_shoppingcart_ids.push(item_id);
		store_shoppingcart_ids_hash[item_id] = item_id;
		add_shoppingcart_ids.push(item_id);
	    }
	    else {
		console.log("Skipping add, as " + item_id + " is already in the shoppingcart");
	    }
	});

    }
    else {
	$my_selected_items.each(function() {
	    var $this = $(this);
	    
	    var item_id = $this.find('span[name]').attr("name");
	    if (!store_shoppingcart_ids_hash.hasOwnProperty(item_id)) {
		store_shoppingcart_ids.push(item_id);
		store_shoppingcart_ids_hash[item_id] = item_id;
		add_shoppingcart_ids.push(item_id);

		// Change delete (by clilcking on the cross) behaviour to open/view shoppingcart
		var $close_button = $this.find(".htrc-delete");
		
		convert_close_to_shoppingcart_action($close_button);
	    
		make_undraggable($this);
	    }
	    else {
		console.log("Skipping add, as " + item_id + " is already in the shoppingcart");
	    }

	});
    }

    //console.log("**** add the followig items to the shopping cart" + add_shoppingcart_ids.join(","));


    if (add_shoppingcart_ids.length>0) {
	add_items_to_shoppingcart(0,add_shoppingcart_ids);
	/*
	// Fire off Ajax call to save these new IDs under the shoppingcart_id on the server
	$.ajax({
	    type: "POST",
	    url: ef_accessapi_url, 
	    data: {
		'action': 'shoppingcart',
		'mode': 'add-ids',
		'key': shoppingcart_key,
		'ids': add_shoppingcart_ids.join(",")
	    },
	    dataType: "text",
	    success: function(textData) {
		console.log("Saving Shopping:" + textData);
		console.log("Shopping cart: " + add_shoppingcart_ids.length + " item(s) successfully added");
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		//$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
		if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapi_failed = true;

		    var mess = "<b>Failed to add item '"+item_id+"' to shopping-cart when accessing URL: ";
		    mess += '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to add item",jqXHR,textStatus,errorThrown);
		}
		
	    }
	});
	*/
	
	update_shoppingcart_count();
    }
    
    selectable_and_draggable_hard_reset();
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
	    do_delete_drop_action();	    
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
	    do_shoppingcart_drop_action();
	}
    });

    $("#shoppingcart-drop").off('click.shoppingcart');
    $("#shoppingcart-drop").on('click.shoppingcart',open_shoppingcart);

    if (store_interaction_style != InteractionStyleEnum.Checkboxes) {

	make_selectable();
	make_clickable();
    }
    else {
	make_unselectable();
    }
}

function open_shoppingcart()
{
    // (id:inu.32000009471279)+OR+(id:mdp.39015001149007)

    if (store_shoppingcart_ids.length==0) {
	console.log("Shopping-cart is empty. Nothing to view.");
	return
    }

    // ****
    //var ids_escaped = store_shoppingcart_ids.map(escape_solr_query).map(function(id){return "(id:"+id+")"});	
    //var ids_or_str = ids_escaped.join(" OR ");	
    //var load_shoppingcart_url = window.location.pathname + "?shoppingcart-q=" + ids_or_str;
    
    var shoppingcart_key = getShoppingcartId();
    var load_shoppingcart_url = window.location.pathname + "?shoppingcart-key-q=" + shoppingcart_key;    

    window.location.href = load_shoppingcart_url;
    //var win = window.open(load_shoppingcart_url);
/*    
    var win = window.open(load_shoppingcart_url, '_blank');
    if (win) {
	// => Browser has allowed it to be opened
	win.focus();
    }
    else {
	// => Browser has blocked it
	alert('New window/tab request blocked by browser.\nPlease enable popups for this website');
    }
*/
}

function selectable_and_draggable_hard_reset()
{
    $('#search-results > div.ui-draggable').removeClass("ui-selected");
    $('#search-results > div.ui-draggable').draggable("destroy");
    make_unselectable();

    //if ($('#search-results').hasClass("ui-selectable")) { // ****
//	$('#search-results').selectable("destroy");
  //  }

    if (store_interaction_style != InteractionStyleEnum.Checkboxes) {
	make_selectable();
    }
    
    $('#search-results input.sr-input-item').prop("checked",false);

    $('#sr-deselect-all').prop('disabled',true);
    $('#sr-invert-selection').prop('disabled',true);
/*
    var trashcan_title = $('#trashcan-drop').attr('disabled-title')
    if (trashcan_title != "") {
	$('#trashcan-drop').attr('title',trashcan_title)
	$('#trashcan-drop').removeAttr('disabled-title')
	$('#trashcan-drop').tooltip();
	$('#trashcan-drop').tooltip('enable');
    }
*/
}

function export_shoppingcart()
{
    var shoppingcart_key = getShoppingcartId();
    //console.log("*** Shopping cart key = " + shoppingcart_key);

    var export_shoppingcart_url = export_shoppingcart_base_url + '/uploadworkset?id='+shoppingcart_key+'&s=solr';
    
    var win = window.open(export_shoppingcart_url, '_blank');
    if (win) {
	// => Browser has allowed it to be opened
	win.focus();
    }
    else {
	// => Browser has blocked it
	alert('New window/tab request blocked by browser.\nPlease enable popups for this website');
    }

}

function delete_items_from_shoppingcart(url_pos,del_shoppingcart_ids)
{
    var shoppingcart_key = getShoppingcartId();

    var url = ef_shoppingcart_url[url_pos];

    $.ajax({
	type: "POST",
	url: url, 
	data: {
	    'action': 'shoppingcart',
	    'mode': 'del',
	    'key': shoppingcart_key
	},
	dataType: "text",
	success: function(textData) {
	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		delete_items_from_shoppingcart(next_url_pos,del_shoppingcart_ids)
	    }
	    else {
		console.log("Deleted Shopping:" + textData);
		console.log("Shopping cart: " + del_shoppingcart_ids.length + " item(s) successfully deleted");
		
		var empty_shoppingcart_search = window.location.search;
		empty_shoppingcart_search = empty_shoppingcart_search.replace(/shoppingcart-q=.*?(&|$)/,"shoppingcart-q=$1");
		var empty_shoppingcart_url = window.location.pathname + empty_shoppingcart_search + window.location.hash;
		window.history.replaceState(null,"Empty Shopping Cart",empty_shoppingcart_url);
		// **** consider wrapping up the following two lines in a more ADT-flavours method
		store_shoppingcart_ids = [];
		store_shoppingcart_ids_hash = {};
		load_solr_q(""); // trigger display of empty shopping cart page
	    
		//setURLParameter("shoppingcart-q",""); // causes page reload, which is what we want // **** no longer want
	    }
	},
	error: function(jqXHR, textStatus, errorThrown) {

	    var next_url_pos = url_pos +1;
	    if (next_url_pos < ef_shoppingcart_url.length) {
		console.log("Warning: failed to delete items to shopping-cart id="+shoppingcart_id+ "through: " + url);
		console.log("Trying next URL:" + ef_shoppingcart_url[next_url_pos]);
		delete_items_from_shoppingcart(next_url_pos,del_shoppingcart_ids)
	    }
	    else {	    
	    
		//$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
		if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		    ef_accessapi_failed = true;
		    
		    var mess = "<b>Failed to delete all items from shopping-cart key '"+shoppingcart_key+"' when accessing URL: ";
		    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		    ajax_message_error(jqXHR, textStatus, errorThrown);
		}
		else {
		    ajax_message_error_console("Failed to delete all items",jqXHR, textStatus, errorThrown);
		}
	    }
	}
    });
}

function empty_shoppingcart()
{
    var shoppingcart_key = getShoppingcartId();
    //console.log("*** Shopping cart key = " + shoppingcart_key);

    //var url = ef_shoppingcart_url[url_pos];
    
    var shoppingcart_q = getURLParameter("shoppingcart-q");
    var raw_fielded_ids = shoppingcart_q.split("%20OR%20");
    var del_shoppingcart_ids = raw_fielded_ids.map(function(fielded_id){return fielded_id.match(/\(id:(.*)\)/)});

    delete_items_from_shoppingcart(0,del_shoppingcart_ids);
    /*
    $.ajax({
	type: "POST",
	url: ef_accessapi_url, 
	data: {
	    'action': 'shoppingcart',
	    'mode': 'del',
	    'key': shoppingcart_key
	},
	dataType: "text",
	success: function(textData) {
	    console.log("Deleting Shopping:" + textData);
	    console.log("Shopping cart: " + del_shoppingcart_ids.length + " item(s) successfully deleted");

	    var empty_shoppingcart_search = window.location.search;
	    empty_shoppingcart_search = empty_shoppingcart_search.replace(/shoppingcart-q=.*?(&|$)/,"shoppingcart-q=$1");
	    var empty_shoppingcart_url = window.location.pathname + empty_shoppingcart_search + window.location.hash;
	    window.history.replaceState(null,"Empty Shopping Cart",empty_shoppingcart_url);
	    // **** consider wrapping up the following two lines in a more ADT-flavours method
	    store_shoppingcart_ids = [];
	    store_shoppingcart_ids_hash = {};
	    load_solr_q(""); // trigger display of empty shopping cart page
	    
	    //setURLParameter("shoppingcart-q",""); // causes page reload, which is what we want // **** no longer want
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    //$('.search-in-progress').css("cursor","auto"); // Do this, but over the shoppingcart icon? // ******
	    if ((runtime_mode == "dev") || (runtime_mode == "prod" && !ef_accessapi_failed)) {
		ef_accessapi_failed = true;

		var mess = "<b>Failed to delete all items from shopping-cart key '"+shoppingcart_key+"' when accessing URL: ";
		mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		ajax_message_error(jqXHR, textStatus, errorThrown);
	    }
	    else {
		ajax_message_error_console("Failed to delete all items",jqXHR, textStatus, errorThrown);
	    }
	}
    });
    */
    
    update_shoppingcart_count();
    
    selectable_and_draggable_hard_reset();
}


$(document).ready(function() {
    
    $('body').keyup(function(ev) {
	if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	    return;
	}

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
	if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	    if (shoppingcart_debug) {
		console.log("*** in checkbox only mode => returning");
	    }
	    return;
	}
		    
	// ev.target is inner element => check ancestors to see if within #search-results area
	// Only if it *isn't* an ancestor should we look to reset

	if ($(ev.target).hasClass("sr-item-multisel")) {
	    // clicked on one of the multiple select/deselect/invert buttons
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
