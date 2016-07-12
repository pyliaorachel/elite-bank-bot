'use strict';

var request = require('request')
var fs = require('fs')
const authorization_code = "elitebutlerauthorization"

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {
	console.log('Event: ', display(event))
    const operation = event.operation
	console.log("operation: "+operation);

	switch(operation){	
		case 'authenticate':
			const redirect_uri = event.redirect_uri;
			const account_linking_token = event.account_linking_token;
			console.log("redirect_uri: "+redirect_uri+", account_linking_token: "+account_linking_token);

			// request({
	  //           url: redirect_url,
	  //           qs: {
	  //               authorization_code: authorization_code
	  //           },
	  //           method: 'GET'
	  //       }, (error, response, body) => {
	  //           console.log('GET response from ', response.request.body);
	  //           if (error) {
	  //               console.log('Error sending message: '+ error);
	  //           } else {
	  //               console.log('Response: '+ response);
	  //               console.log('Body: '+ body);
	  //               context.succeed();
	  //           }
	  //       })
			fs.readFile('./functions/authentication/index.html', 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
				console.log(data);

				// fb bug, not valid by now
				/*
				var result = data.replace(/redirectUri/g, '\"'+redirect_uri+'\"');
				console.log(result);
				result = result.replace(/authorizationCode/g, '\"'+authorization_code+'\"');
				console.log(result);

				context.succeed(result);
				*/

				context.succeed(data);
			});

	  		break;
	    default:
	    	context.fail(new Error('Unrecognized operation "' + operation + '"'))
	}
};
