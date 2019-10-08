// Utils functions

String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// Based on https://love2dev.com/blog/javascript-remove-from-array/
function arrayRemoveItem(arr, value) {

    var filtered_arr = arr.filter(function(ele) {
	return ele != value;
    });

    return filtered_arr;
}

function escapeRegExp(string)
{
    // https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function strtrim(s)
{
    return s.trim();
}


function camelCaseToDisplayLabel(cc)
{
    var label = cc
	.replace(/([A-Z])/g, ' $1')
	.replace(/^./, function(str){ return str.toUpperCase(); });

    return label;
}


function getURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i=0; i<sURLVariables.length; i++) {
	var sParameterName = sURLVariables[i].split('=');
	if (sParameterName[0] == sParam)
	{
	    return sParameterName[1];
	}
    }

    return null;
}

function setURLParameter(sParam,sVal)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i=0; i<sURLVariables.length; i++) {
	var sParameterName = sURLVariables[i].split('=');
	if (sParameterName[0] == sParam)
	{
	    sURLVariables[i]=sParameterName[0]+'='+sVal;
	}
    }

    window.location.search = '?' + sURLVariables.join('&');
}

// https://stackoverflow.com/questions/824349/modify-the-url-without-reloading-the-page
function scrollToElement(pageElement)
{
    var positionX = 0;
    var positionY = 0;    

    while (pageElement != null) {
        positionX += pageElement.offsetLeft;        
        positionY += pageElement.offsetTop;        
        pageElement = pageElement.offsetParent;        
        window.scrollTo(positionX, positionY);    
    }
}


// From: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4()
{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

var store_shoppingcart_id = null; // **** // move to be with other store_.* vars, or wrap in with ShoppingCart API idea

function getShoppingcartId()
{
    if (store_shoppingcart_id != null) {
	return store_shoppingcart_id;
    }

    // Shoppingcart ID has not been explicitly set, or already
    // initialized through an earlier call to getShoppingcartId()
    // => First look to see if there is a logged in username that can be used
    var shoppingcart_id = null;

    if (typeof(Storage) !== "undefined") {

	shoppingcart_id = sessionStorage.getItem("shoppingcart-id");
	var username = sessionStorage.getItem("htrc-username");

	if ((shoppingcart_id != null) && (username != null) && (!shoppingcart_id.match(/^shoppingcart-username-/))) {
	    // Trigger upgrade  // ******
	    shoppingcart_id = shoppingcart_id.replace(/^shoppingcart-([^-]+)-(.*)$/,"shoppingcart-username-"+username);
	}
	
	if (shoppingcart_id == null) {
	    // See if it can be based around a logged in username
	    if (username != null) {
		shoppingcart_id = "shoppingcart-username-"+username;
	    }
	}
    }

    if (shoppingcart_id == null) {
	var xsid = document.cookie.match(/XSESSIONID=[^;]+/);

	if (xsid != null) {
	    if (xsid instanceof Array) {
		xsid = xsid[0].substring(11);
	    }
	    else {
		xsid = xsid.substring(11);
	    }
	    if (xsid.startsWith("node")) {
		xsid = xsid.replace(/\.node\d+$/,"");
	    }
	    
	    shoppingcart_id = "session-xsid-" + xsid;
	}
	else {
	    shoppingcart_id = "session-rnd-"+uuidv4(); // probably running local server spawned from Eclipse
	}

	if (shoppingcart_primary_machine != null) {
	    shoppingcart_id += "-primary-"+ shoppingcart_primary_machine;
	}
    }

    if (typeof(Storage) !== "undefined") {	
	sessionStorage.setItem("shoppingcart-id",shoppingcart_id);
    }

    store_shoppingcart_id = shoppingcart_id;
    
    return shoppingcart_id;
}


function setShoppingcartId(shoppingcart_id)
{
    if (typeof(Storage) !== "undefined") {

	sessionStorage.setItem("shoppingcart-id",shoppingcart_id);
    }
    else {
	console.log("Unable to use browser's sessionStorage API");
	console.log("Shopping-cart ID '"+shopingcart_id+"' will be held in memory");	
    }

    store_shoppingcart_id = shoppingcart_id;
}



function getSelectedText()
{
    // retrieve highlighted text the user has selected
    // return empty string if none present
    
    var text = "";

    if (window.getSelection) {
	text = window.getSelection().toString();
    }
    else if (document.selection && document.selection.type != "Control") {
	text = document.selection.createRange().text;
    }

    return text;
}


function escape_solr_query(query)
{

    // consider adding in \, also? // ****
    var pattern = /([\,\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\\/\"])/g;
    
    var escaped_query = query.replace(pattern, "\\$1");

    return escaped_query;
}


/*
function __ajax_error_console(jqXHR, textStatus, errorThrown)
{        
    console.log('====');
    console.log('Detected Network AJAX Error/Abort');
    console.log('====');
    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('responseText:' + jqXHR.responseText);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

}

function __ajax_error(jqXHR, textStatus, errorThrown)
{
    
    if (errorThrown != "") {
	var mess = 'Network AJAX Error: An error occurred...<br />';
	mess += '<pre>';
	mess += '  Status: ' + textStatus + '\n';
	mess += '  Error: ' + errorThrown + '\n';
	mess += '</pre>';
	mess += '<hr />View the web console (F12 or Ctrl+Shift+I, Console tab) for more information.';

	htrc_alert(mess);
    }

    __ajax_error_console(jqXHR, textStatus, errorThrown);
}
*/

function ajax_message_error_console(mess,jqXHR, textStatus, errorThrown)
{        
    console.error(mess);

    console.log('====');
    console.log('Detected Network AJAX Error/Abort');
    console.log('====');
    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('responseText:' + jqXHR.responseText);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

}

function ajax_message_error(mess, jqXHR, textStatus, errorThrown)
{    
    var full_mess = mess + "<br />";

    if (errorThrown != "") {
	full_mess += 'Network AJAX Error: An error occurred...<br />';
	full_mess += '<pre>';
	full_mess += '  Status: ' + textStatus + '\n';
	full_mess += '  Error: ' + errorThrown + '\n';
	full_mess += '</pre>';

    }

    // Check to see if the alert dialog is already displaying a message
    // and if it is, then append the new message into the existing one
    
    if ($('#htrc-alert-footer').length > 0) {
	// In the situation where we already have a footer
	$('#htrc-alert-footer').remove();
    }
    
    var curr_alert_mess = $('#htrc-alert-body').html();
    if (curr_alert_mess != "") {
	full_mess = curr_alert_mess + "\n<hr />\n" + full_mess;
    }

    var footer = '<div id="htrc-alert-footer"><hr />View the web console (F12 or Ctrl+Shift+I, Console tab) for more information.</div>';
    full_mess += footer;

    htrc_alert(full_mess);

    ajax_message_error_console(mess,jqXHR,textStatus,errorThrown);
}


function load_async_scripts(async_script_urls, on_complete_callback) {

    var num_scripts = async_script_urls.length;
    var num_loaded_scripts = 0;
    
    for (var i=0; i<num_scripts; i++) {
	
	var script_url = async_script_urls[i];
	var full_url = script_prefix+script_url;
	$.ajax({
	    url: full_url,
	    dataType: "script",
	    success: function() {
		num_loaded_scripts++;
		if (num_loaded_scripts == num_scripts) {
		    on_complete_callback();
		}
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		var mess = "Failed to dynamically load JavaScript file: " + full_url;
		ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	    }
        });
	
    }    
}
