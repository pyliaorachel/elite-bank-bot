'use strict';

const fs = require('fs');

module.exports.handler = function(event, context) {
	console.log(`Event: ${JSON.stringify(event)}`);
    const operation = event.operation;
    const status = event.body;

	switch(operation){	
		case 'transaction':
			if (status === 'success') {
				context.succeed('Transaction successfully made.');
			} else {
				fs.readFile('./functions/transaction/index.html', 'utf8', function (err,data) {
					if (err) {
						context.fail(new Error(`Error reading webpage: ${err}`));
					}
					console.log(`Data read: ${data}`);
					context.succeed(data);
				});
			}

	  		break;
	    default:
	    	context.fail(new Error(`Unrecognized operation ${operation}`));
	}
};