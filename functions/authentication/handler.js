'use strict';

const request = require('request')
const fs = require('fs')
const authorization_code = "elitebutlerauthorization"

module.exports.handler = function(event, context) {
	console.log(`Event: ${JSON.stringify(event)}`);
  const operation = event.operation;
	console.log(`Operation: ${JSON.stringify(operation)}`);

	switch(operation){	
		case 'authenticate':
			const redirect_uri = event.redirect_uri;
			const account_linking_token = event.account_linking_token;
			console.log(`redirect_uri: ${redirect_uri}, account_linking_token: ${account_linking_token}`);

			fs.readFile('./functions/authentication/index.html', 'utf8', function (err,data) {
				if (err) {
					context.fail(new Error(`Error reading webpage: ${err}`));
				}
				console.log(`Data read: ${data}`);
				context.succeed(data);
			});

	  		break;
	    default:
	    	context.fail(new Error(`Unrecognized operation ${operation}`));
	}
};
