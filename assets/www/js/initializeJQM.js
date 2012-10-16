$( document ).bind( "mobileinit", function() {
    // Make your jQuery Mobile framework configuration changes here!
	// these should allow the mobile app to access the Parse.com server
	$.support.cors = true;
    $.mobile.allowCrossDomainPages = true;

});