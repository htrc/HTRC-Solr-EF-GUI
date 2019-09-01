function solr_ef_login()
{
    // Simplified
    $('#navbar-username').html('Settings');
    $('#navbar-login').hide();
    $('#navbar-logout').show();
}

function solr_ef_login_THROUGH_POPUP()
{
    htrc_login({
	"Sign In" : function() {

	    var $iframe_contents = $('#loginFrame').contents();
	    var username = $iframe_contents.find('#username').val();
	    var password = $iframe_contents.find('#password').val();
	    
	    if ((username != "")  && (password != "")) {
		if (typeof(Storage) !== "undefined") {
		    sessionStorage.setItem("htrc-username", username);
		}
		$iframe_contents.find("#error-message").hide();
		$('#navbar-username').html(username);
		$('#navbar-login').hide();
		$('#navbar-logout').show();
		$(this).dialog("close");
	    }
	    else {
		$iframe_contents.find("#error-message").show();
	    }
	},
	"Cancel"  : function() {
	    $(this).dialog("close");
	}

    });
    
}

function solr_ef_logout()
{
    $('#navbar-logout').hide();
    $('#navbar-login').show();
    if (typeof(Storage) !== "undefined") {
	sessionStorage.removeItem("htrc-username");
    }

}

function authentication_check_for_publish_workset()
{
    var react_component = $('#solr-ef-search-type').data("react-component");
    if (react_component) {
	$.ajax({
	    url: '/isauthenticated',
	    dataType: "json",
	    success: function() {}, // already logged in => nothing to do
	    error: function () {
		$('#export-ef-to-registry-text').html("Save as Workset (login needed)");
	    }
	});
    }
}


function solr_ef_login_to_publish()
{
    var react_component = $('#solr-ef-search-type').data("react-component");
    console.log("**** react component = " + react_component);

    if (react_component) {
	solr_ef_login_to_publish_react()
    }
    else {
	solr_ef_login_to_publish_FAKED()
    }
}

function solr_ef_login_to_publish_react()
{
    $.ajax({
	url: '/isauthenticated',
	dataType: "json",
	success: function (json_data) {
	    console.log("*** is authenticated: " + JSON.stringify(json_data));
	    $('#publish-username').val(json_data.user);
	    $("#htrc-publish-dialog").dialog( "open" );
	},
	error: function () {
	    console.log("**** user is not currently authenticated");
	    var auto_publish = getURLParameter("auto-publish");
	    if (auto_publish == null) {
		var update_search = window.location.search;
		if (update_search == "") {
		    update_search = "?auto-publish=true";
		}
		else {
		    update_search += "&auto-publish=true";
		}
		
		var updated_url = window.location.pathname + update_search + window.location.hash;
		window.history.replaceState(null,null,updated_url);
	    }

	    window.location.replace("/signin");
	    //document.location.href = 
	}
    });

}

function solr_ef_login_to_publish_FAKED()
{
    var needs_login = true;
    var username = "";
    
    if (typeof(Storage) !== "undefined") {
	username = sessionStorage.getItem("htrc-username");
	if ((username != null) && (username != "")) {
	    needs_login = false;
	}
    } 

    if (needs_login) {
	htrc_login({
	    "Sign In" : function() {
		
		var $iframe_contents = $('#loginFrame').contents();
		username = $iframe_contents.find('#username').val();
		var password = $iframe_contents.find('#password').val();
		
		if ((username != "")  && (password != "")) {
		    if (typeof(Storage) !== "undefined") {
			sessionStorage.setItem("htrc-username", username);
		    } 
		    $iframe_contents.find("#error-message").hide();		
		    $(this).dialog("close");
		    $('#navbar-username').html(username);
		    $('#navbar-login').hide();
		    $('#navbar-logout').show();
		    $('#publish-username').val(username);
		    $("#htrc-publish-dialog").dialog( "open" );
		}
		else {
		    $iframe_contents.find("#error-message").show();
		}
	    },
	    "Cancel"  : function() {
		$(this).dialog("close");
	    }

	});
    }
    else {
	$('#publish-username').val(username);
	$("#htrc-publish-dialog").dialog( "open" );
    }
    
    
}

function published_workset_success(data)
{
    console.log("published workset success(): data = " + data);
}


function ajax_save_workset_to_triplestore($dialog,jsonData)
{
    var ids = stream_get_ids(jsonData);
    var ids_len = ids.length;

    $dialog.css("cursor","auto");
    $dialog.parent().find('.ui-dialog-buttonpane').css("cursor","auto");
    $dialog.dialog("close");

    if (ids_len==0) {
	htrc_alert("No items in workset to export");
	return;
    }
    
    var username;
    if (typeof(Storage) !== "undefined") {
	username = sessionStorage.getItem("htrc-username");
    }

    // example JSON record to post to triple-store
    // var source_data = 
    // {
    //	"extent": "2",
    //	"created": "Deren Emre Kudeki",
    //	"title": "Arabic Test",
    //	"description": "For testing how fetchCollections handles non-roman character sets",
    //	"gathers": [ { "htitem_id": "mdp.39015079132745" }, { "htitem_id": "mdp.39015079130095" } ]
    // }
		     
    var created     = $('#publish-username').val();
    var title       = $('#publish-ws-title').val();
    var description = $('#publish-ws-abstract').val();

    // Additional CGI arguments
    
    var source_url = store_search_url;
    var criteria             = $('#publish-ws-criteria').val();
    var research_motivation  = $('#publish-ws-motivation').val();

    var source_data = {
	"extent": ids.length,
	"created": username || "Anonymous",
	"title": title,
	"description": description,
	"gathers": []    
    }
    
    for (var i=0; i<ids.length; i++) {
	source_data.gathers.push({"htitem_id": ids[i] });
    }
    
    console.log("*** source data = " + JSON.stringify(source_data));
    
    var url_args = {
	source_data: JSON.stringify(source_data),
	//source_url: source_url,
	//research_motivation: research_motivation,
	//criteria: criteria
    };

    //var form_data = new FormData();
    //form_data.append("source_data",source_data);
    
    $.ajax({
	type: "POST",
	url: publish_workset_url,
	data: url_args,
	//data: source_data,
	//data: JSON.stringify(url_args),
	//data: form_data,
	dataType: "html",
	//dataType: "html",
	//processData: false,
	//contentType: 'multipart/form-data',
	//contentType: false,
	//processData: false,
	//enctype: 'multipart/form-data',
	success: published_workset_success,
	error: function(jqXHR, textStatus, errorThrown) {
	    var mess = "<b>Failed to save workset to triplesore.  An error occurred accessing URL:";
	    mess +=  '<div style="margin: 0 0 0 10px">' + publish_workset_url +'</div></b>';
	    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	}

    });
}

    
function solr_ef_publish_workset($dialog)
{    
    $dialog.css("cursor","wait"); 
    $dialog.parent().find('.ui-dialog-buttonpane').css("cursor","wait");
    
    // Need small delay to let busy cursor change to take affect
    setTimeout(function() {
	var doRollup = (facet_filter.getFacetLevel() == FacetLevelEnum.Page) ? true : false;
    
	ajax_solr_stream_volume_count(store_search_args.q,doRollup, function(jsonData) {
	    ajax_save_workset_to_triplestore($dialog,jsonData)
	});
    }, 10);

}
