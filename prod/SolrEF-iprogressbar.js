// Indeterminante Progressbar

function IndeterminateProgressbar(wrapper_id,label_id,progressbar_id,cancel_id) {
    this.wrapper_id     = wrapper_id;
    this.label_id       = label_id;
    this.progressbar_id = progressbar_id;
    this.cancel_id      = cancel_id;
    
    this.timeout_id = null;
}

IndeterminateProgressbar.prototype.abort = function()
{
    this.cancel();
    $('.search-in-progress').css("cursor","auto");
    $('.facet-search').removeClass("disabled-div");
    store_search_xhr.abort();
    htrc_alert("Query canceled");
    store_search_xhr = null;
}

IndeterminateProgressbar.prototype.display = function(message)
{
    this.timeout_id = null;

    $('#'+this.label_id).html(message);
    
    $('#'+this.wrapper_id).show("slide", { direction: "up" }, 1000);
}


IndeterminateProgressbar.prototype.cancel = function()
{
    if (this.timeout_id != null) {
	window.clearTimeout(this.timeout_id);
	this.timeout_id = null;
    }
    $('#'+this.wrapper_id).hide("slide", { direction: "up" }, 1000);
}


IndeterminateProgressbar.prototype.trigger_delayed_display = function(delay,message)
{
    var that = this;
    this.timeout_id = window.setTimeout(function() { that.display(message) },delay);
}

var iprogressbar = new IndeterminateProgressbar('search-indeterminate-div',
						'search-indeterminate-label',
						'search-indeterminate-progressbar',
						'search-indeterminate-cancel' );

function solref_iprogressbar_dom_ready() {
    $('#'+iprogressbar.progressbar_id).progressbar({ value: false });

    $('#'+iprogressbar.cancel_id).click(function(event) {
	event.preventDefault();
	iprogressbar.abort();
    });
}

$(document).ready(function() {

    solref_iprogressbar_dom_ready();
});
