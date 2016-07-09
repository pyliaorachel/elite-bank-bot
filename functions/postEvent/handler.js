'use strict';

var request = require('request')
// var aws = require('aws-sdk')
// aws.config.region = 'ap-northeast-1';

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
        	var pl = decodeURIComponent(event.payload)
            var str = pl.substring(8) // remove "content="
            console.log(str)
            str = str.replace(/\+/g, " ") 
            console.log(str)
            var json = JSON.parse(str)
            // var data = {
            //     "operation": "postEvent",
            //     "body": json
            // }

            // call bot
			// var lambda = new aws.Lambda();

   //          var params = {
   //              Action: 'lambda:InvokeFunction', /* required */
   //              FunctionName: 'arn:aws:lambda:ap-northeast-1:127119593758:function:elite-butler-bot', /* required */
   //              Principal: 'apigateway.amazonaws.com', /* required */
   //              StatementId: '2', /* required */
   //              SourceArn: 'arn:aws:execute-api:ap-northeast-1:127119593758:bga829qa2d/*/POST/bot'
   //          };
   //          lambda.addPermission(params, function(err, data) {
   //              if (err) console.log(err.stack); // an error occurred
   //              else     console.log(data);           // successful response
   //          });

   //          params = {
   //              FunctionName: 'arn:aws:lambda:ap-northeast-1:127119593758:function:elite-butler-bot',
   //              InvocationType: 'RequestResponse',
   //              LogType: 'Tail',
   //              Payload: new Buffer(JSON.stringify(data)) || JSON.stringify(data),
   //          };
   //          lambda.invoke(params, function(err, data) {
   //              if (err) console.log(err.stack); // an error occurred
   //              else     console.log(data);           // successful response
   //          });

			// var params = {
			// 	FunctionName: 'bot',
			// 	LogType: 'None',
			// 	Payload: JSON.stringify(json)
			// };
			// lambda.invoke(params, function(error, data) {
			// 	if (error) {
   //                  context.done('error', error);
   //              }
   //              if(data.Payload){
   //                  context.succeed(data.Payload)
   //              }
			// });
            request({
                url: 'https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/bot',
                method: 'POST',
                json: json
            }, (error, response, body) => {
                console.log('Response', response);
                console.log('Error', error);
                console.log('Body', body);
                
                if (error) {
                    context.fail('Error sending message: ', error);
                } else {
                    context.succeed(response);
                }
            })

            //context.succeed(data)
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}