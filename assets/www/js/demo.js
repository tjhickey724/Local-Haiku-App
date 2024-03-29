// Parse.initialize("....",".....");  
// this is where the parse key info goes...
// you need to go to parse.com, create an account and copy that info here!!!
// It is not a good idea though to put it into a public git repository
// which is why I put it in a separate file hidden by .gitignore !!
currentPoemID="none";

$( document ).bind( "mobileinit", function() {
    // Make your jQuery Mobile framework configuration changes here!
	// these should allow the mobile app to access the Parse.com server
	$.support.cors = true;
    $.mobile.allowCrossDomainPages = true;

});

$("#index").live("pageshow", function(event){
	// this code is evaluated each time the page is shown!
	var page = $("#index");
	var currentUser = Parse.User.current();
	if (currentUser) {
		$("#user",page).html("User: "+ currentUser.getUsername());
		$("#login",page).hide();
		$("#register",page).hide();
		$("#logoutLink",page).show();
		$("#composeLink",page).show();


	} else {
		$("#user",page).html("no one is logged in");
		$("#logoutLink",page).hide();
		$("#composeLink",page).hide();
		$("#login",page).show();
		$("#register",page).show();

	}

});
		
$("#index").live("pageinit", function(event){
	// this is evaluated when the page is first initialized
	// but not when navigated to by changepage ...
	
	var page = $("#index");
	var currentUser = Parse.User.current();
	localStorage.latitude = 42.33;
	localStorage.longitude = -71.12;
	
	navigator.geolocation.getCurrentPosition(storePosition);
	

	//$("#login").click(function(){
	//	$.mobile.changePage( "#loginPage", { transition: "slideup"} );
	//});
	$("#logoutLink").click(function(){
		Parse.User.logOut();
		$("#status", page).html("you have successfully logged off");
		$("#user",page).html("no one is logged in");
		$.mobile.changePage("#index",{allowSamePageTransition:true});
	});
	//$("#viewLink").click(function(){
	//	$.mobile.changePage( "#viewPage", { transition: "slideup"} );
	//});
	//$("#composeLink").click(function(){
	//	$.mobile.changePage( "#composePage", { transition: "slideup"} );
	//});
	
	
	$("#refreshLink",page).click(function(){
		$.mobile.changePage( "#index", { allowSamePageTransition:true} );
	});


});



$("#composePage").live("pageshow", function(event) {
	var currentUser = Parse.User.current();
	var page = $("#composePage");
	navigator.geolocation.getCurrentPosition(storePosition);
	$("#lat",page).val(localStorage.latitude);
	$("#lon",page).val(localStorage.longitude);
	if (currentUser) {
		$("#user",page).html(currentUser.getUsername());
	} else {
		$("#user",page).html("You must be logged in to compose a haiku");
		return;
	}
});

	
$("#composePage").live("pageinit", function(event) {
	var page = $("#composePage");
	
	$("#publish",page).live("click",function(e) {
		var currentUser = Parse.User.current();
		var Haiku = Parse.Object.extend("Haiku");
	    var haikuObject = new Haiku();
	
		haikuObject.set("title",$("#title",page).val());
		haikuObject.set("descr",$("#descr",page).val());
		haikuObject.set("poem",$("#poem",page).val());
		haikuObject.set("location",
		    new Parse.GeoPoint(
					 Number($("#lat",page).val()),
		             Number($("#lon",page).val())))
		haikuObject.set("parent",currentUser);
		
	    haikuObject.save({
	      success: function(object) {
			$("#status",page).html("success!");
			$.mobile.changePage( "index.html", {transition: "slideup"} );
	      },
	      error: function(model, error) {
			$("#status",page).html("error is "+error);
	        $(".error",page).show();
	      }
	    });			
        $("#status",page).html("saved TestObject");	          
		e.preventDefault();
	});
});

$("#viewPage").live("pageinit", function(event){
	var page = $("#viewPage");
	var currentUser = Parse.User.current();

	$("#update",page).click(function(){
		$.mobile.changePage( "#viewPage", { allowSamePageTransition:true} );
	});
	
	$("a",page).live("click",function(e){
		//alert("hello: '"+$(this).attr("poemid")+"'");
		currentPoemID = $(this).attr("poemid");
		 vpage = $("#poemView");
		 $("#themap",vpage).html("")
		 $("#thepoem",vpage).html("")
		 $("#title",vpage).html("");
		 $("#author",vpage).html("");
	     $("#theuser",vpage).html("");
		$.mobile.changePage( "#poemView" );	
		e.preventDefault();
		//return nodeN!="P";
	})
});

$("#viewPage").live("pageshow", function(event){
	var page = $("#viewPage");
	var optionsPage = $("#viewOptionsPage");
	var currentUser = Parse.User.current();
	
	if (currentUser) {
		$("#user",page).html(currentUser.getUsername());
		$("#composeLink",page).show();
	} else {
		$("#user",page).html("no one is logged in");
		$("#composeLink",page).hide();
	}
	$("#mylocation").html(" at ("
			+localStorage.latitude+","+localStorage.longitude+")");
	var haiku = Parse.Object.extend("Haiku");
	var sstring = $("#searchfor",optionsPage).val();
	var radius = Number($("#radius",optionsPage).val());
	var resultnum = Number($("#resultnum",optionsPage).val());
	var query = new Parse.Query(haiku);
	var loc = new Parse.GeoPoint(Number(localStorage.latitude),Number(localStorage.longitude));
	query.limit(resultnum);
	query.ascending("location");
	query.contains("poem",sstring);
	query.withinMiles("location",loc,radius);
	//query.equalTo("parent",currentUser);
	query.find({
		success: function(haikus){
			var thetime = Date();
			var results=""; 
			if (haikus.length==0) {
				results="<li>No matching poems were found</li>";
			}
			for (i =0; i<haikus.length; i++) {
				poem = haikus[i];
				var title = poem.get("title");
				var updatedAt = poem.updatedAt;
				var descr = poem.get("descr");
				var poemtext = poem.get("poem");
				var poemloc = poem.get("location");
				var poemLatLon  = poemloc.latitude+","+poemloc.longitude;
				var mapURL=
					"http://maps.googleapis.com/maps/api/staticmap?center="
					+ poemLatLon 
					+"&zoom=15&size=200x200&sensor=false&markers="
					+ poemLatLon;

				results = results + 
					"\n<li data-theme='b'>"
					+"<a href='#poemView' poemid='"+ poem.id+ "'>"
					//+"<a href='#'>"
					+"<pre class='haiku2'>"+poemtext+"</pre>"
					+"<img class='haikuimg' src='"+mapURL+"'/>"
					+"</a>"
					+"</li>";
			}
			// I think we need to create a listener which will grab the poemid
			// from the a element and changePage to the poemView with an explicit
			// data parameter consisting of the poemid...
			
			results = results+"\n </ul>";
			$("#thetime",page).html(thetime);
			$("#poemList",page).html(results);
			$("#poemList",page).listview("refresh");
			
		},
		error: function(object,error){
			// some error....
			$("#status",page).text("found some error!");
		}

	});	
});


$("#registerpage").live("pageinit", function(event) {
	var page = $("#registerpage");

	var currentUser = Parse.User.current();
	if (currentUser) {
		$("#status",page).html("The current user is "+currentUser);
	} else {
		$("#status",page).html("no one is logged in ... ");
	}

	$("#registerLink").live("click",function(e) {
       	var user = new Parse.User();
		user.set("username",$("#username",page).val());
		user.set("email",$("#email",page).val());
		user.set("password",$("#password",page).val());
		user.signUp(null, {
		  success: function(user) {
		    // Hooray! Let them use the app now.
			$.mobile.changePage( "#index", {transition: "slideup"} );
		  },
		  error: function(user, error) {
		    // Show the error message somewhere and let the user try again.
		    alert("Error: " + error.code + " " + error.message);
		  }
		});
	});
	

	
});


$("#loginPage").live("pageinit", function(event) {
	var page = $("#loginPage");

	var currentUser = Parse.User.current();
	Parse.User.logOut();
	if (currentUser) {
		$("#status",page).html("The current user is "+currentUser.getUsername());
	    // do stuff with the user
	} else {
		$("#status",page).html("");
	    // show the signup or login page
	}
	
	$("#loginLink").live("click",function(e) {
		var myname =  $("#username",page).val();
		var mypass =  $("#password",page).val();
		
		Parse.User.logIn(myname, mypass, {
		  success: function(user) {
		    // Do stuff after successful login.
			var currentUser = Parse.User.current();
			if (currentUser) {
				$("#status",page).html("The current user is "+currentUser);
			    // do stuff with the user
			} else {
				$("#status",page).html("no one is logged in ... ");
			    // show the signup or login page
			}
		    $.mobile.changePage( "index.html", {transition: "slideup"} );
		
		  },
		  error: function(user, error) {
		    // The login failed. Check error to see why.
		     alert("There was an error"+error +" myname="+myname+" mypass="+mypass);
		  }
		});
	});
});	


$("#resetpwPage").live("pageinit", function(event) {
	var page = $("#resetpwPage");
	
	$("#resetpw",page).live("click",function(e) {
		alert("clicked the button!!");
		$("#status",page).html("trying to reset password");
		var email =  $("#email",page).val();

		Parse.User.requestPasswordReset(email, {
	  		success: function() {
	    		$("#status",page).html("A new password has been sent to '"+
				email); 
	  		},
	  		error: function(error) {
	    		// Show the error message somewhere
				$("#status",page).html("Error: " + error.code + " " + error.message);
	  		}
		});
	});
});

$("#poemView").live("pageshow", function(event) {
	var page = $("#poemView");
	$("#thepoem",page).html("...");
	$("#themap",page).html("...");
	//var poemid = sessionStorage.currentPoemId;
	var poemid = currentPoemID;
	var haiku = Parse.Object.extend("Haiku");
	var query = new Parse.Query(haiku);
	query.get(poemid, {
	  success: function(poem) {
			var parent =poem.get("parent");
			var userquery = new Parse.Query(Parse.User);
			userquery.get(parent.id, {
				  success: function(u) {
				    username  = "user: "+u.getUsername();
					var title = poem.get("title");
					var updatedAt = poem.updatedAt;
					var descr = poem.get("descr");
					var poemtext = poem.get("poem");
					var poemLoc = poem.get("location");
					var poemLatLon;
				  	if (! poemLoc) {poemLatLon="42.33,-71.11"} 
					else poemLatLon = poemLoc.latitude+","+poemLoc.longitude;
					var mapURL=
						"http://maps.googleapis.com/maps/api/staticmap?center="
						+ poemLatLon 
						+"&zoom=15&size=300x300&sensor=false&markers="
						+ poemLatLon;


					result = 
						"\n<div data-theme='b'>"
						
						+"<div> updated at: "+updatedAt +"</div>"
						+"<div> Descr: "+descr +"</div>"
						+"<div> LatLon: "+poemLatLon +"</div>"
						+"<div> ID: "+ poem.id +"</div>"

						
						+"</div>";
					 $("#themap",page).html("<img class='haikuimg' src='"+mapURL+"'/>")
					 $("#thepoem",page).html("<pre class='haiku2'>"+poemtext+"</pre>")
					 $("#title",page).html(title);
					 $("#author",page).html(username);
				     $("#theuser",page).html(result);	
				  },
				  error: function(u,error){
					username = "error: "+ error;
				}
				});

		},
	  error: function(poem,error){
		  alert("error: "+error);
		}
	});
    
    // now that we have the poemid we can make a query and get all the info
    // we need to present to the user in a nice way!
});
	
	
function storePosition(position){
	localStorage.latitude = position.coords.latitude;
	localStorage.longitude = position.coords.longitude;
}