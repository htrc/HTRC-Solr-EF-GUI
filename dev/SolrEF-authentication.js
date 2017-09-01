function solr_ef_login()
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

function solr_ef_login_to_publish()
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
		    $('#publish-username').html(username);
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
	$('#publish-username').html(username);
	$("#htrc-publish-dialog").dialog( "open" );
    }
    
    
}
