'use strict';

var request = require('request')
var aws = require('aws-sdk')
aws.config.region = 'ap-northeast-1';

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {

    console.log('Event: ', display(event))
    const operation = event.operation

    switch (operation) {
        case 'postEvent':
        	console.log('Payload: ', display(event.payload))

        	// parse payload
        	var data = decodeURIComponent(event.payload)
            var str = data.substring(8) // remove "content="
            console.log(str)
            str = str.replace(/\+/g, " ") 
            console.log(str)
            var json = JSON.parse(str)

            // call bot
			var lambda = new aws.Lambda();
			var params = {
				FunctionName: 'bot',
				InvocationType: 'Event',
				LogType: 'None',
				Payload: json,
			};
			lambda.invoke(params, function(error, data) {
				if (error) {
					console.log(error); // error is Response.error
				} else {
					console.log(data); // data is Response.data
				}
			});

            context.succeed(json)
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}