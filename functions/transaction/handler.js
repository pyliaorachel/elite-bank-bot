'use strict';

var fs = require('fs')

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {
	console.log('Event: ', display(event));
    const operation = event.operation;
    const status = event.body;
	console.log("operation: "+operation);

	switch(operation){	
		case 'transaction':
			if (status === 'success') {
				context.succeed("Transaction successfully made.");
			} else {
				fs.readFile('./functions/transaction/index.html', 'utf8', function (err,data) {
					if (err) {
						return console.log(err);
					}
					console.log(data);

					context.succeed(data);
				});
			}

	  		break;
	    default:
	    	context.fail(new Error('Unrecognized operation "' + operation + '"'))
	}
};