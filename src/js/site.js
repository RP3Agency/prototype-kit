/*********
*
* Custom Javascript goes here.
*
*
* This file will be minified, removing comments for production.  Be verbose.
* You should write more comments than you write code. ;)
*
*********/


//If RP3 doesn't exist in global scope, create it as an empty object.
//Otherwise, use it.
var RP3 = RP3 === undefined ? {} : RP3;


//By wrapping everything in a closure, we know that we're
//preventing sloppy coding from littering the window namespace.  We
//can also cleanly de-reference jQuery and prevent from having to set
//window.$ which can conflict with other libraries that use their own jQuery.
(function ($) {

	/***
	* Add methods here to the RP3 object
	*/
	_.extend(RP3, {
		//EXAMPLE: Create an example function to set expectations
		example: function (msg) {
			//write msg to the log
			RP3.log(msg);
		},

		//Proxy log calls to allow for flexibility later
		log: console.log

	});

	/***
	* Add code here to run onDOMReady
	*/
	$(function () {
		//make subnav toggling active
		RP3.example("Let's do this!");
	});


})(jQuery);  //Pass in jQuery to dereference as $ throughout our code
