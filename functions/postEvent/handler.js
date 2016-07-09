'use strict';

var request = require('request')
// var aws = require('aws-sdk')
// aws.config.region = 'ap-northeast-1';

// For proof of concept, the userData are hard-coded instead of retrieved from database.
// User ids for messaging are stored at the time they register with the FB fanpage.
var userData = {
    "companyInvestors": {
        "LVMH": [
            "1120359171369250",
            "2"
        ],
        "Scotch Whiskey": [
            "1120359171369250",
            "3"
        ],
        "RyanAir": [
            "1120359171369250",
            "4"
        ],
        "Volkswagen Group": [
            "1120359171369250",
            "5"
        ]
    }
}

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

            // var id = "1120359171369250"
            // var text = "Hello"
            // var access_token = "EAAYiiUwupN0BAFze3uVHm81075dwg4BDK2qvha65yhddrXCrRUDLmrQpiWQZB9eHAeqaMFMYT80JRgvK9mgYEKmQ8dppPmwvhk5I106kdUHmEa1Y1vyvlalDPX64f08EmqDcusZCYFxZBbecoZBxdbELkVFKthIcWdqZAuAGXVgZDZD"
            // request({
            //     url: 'https://graph.facebook.com/v2.6/me/messages',
            //     qs: {
            //         access_token: access_token
            //     },
            //     method: 'POST',
            //     json: {
            //         recipient: {
            //             id: id
            //         },
            //         message: {
            //             text: text
            //         }
            //     }
            // }, (error, response, body) => {
            //     console.log('GET response', response);
            //     context.succeed(response);
            //     if (error) {
            //         context.fail('Error sending message: ', error);
            //     } else if (response.body.error) {
            //         context.fail('Error: ', response.body.error);
            //     }
            // })

            // look for affected users
            var affectedInvestorList = new Object();
            var data = json;

            var postiveComp = data.affectedIndustries.positive;
            postiveComp.forEach(function(company){
                var affectedInvestors = userData.companyInvestors[company];
                affectedInvestors.forEach(function(investor){
                    if (!(investor in affectedInvestorList)){
                        affectedInvestorList[investor] = {positive:[], negative:[]};
                        affectedInvestorList[investor].positive.push(company);
                    } else {
                        affectedInvestorList[investor].positive.push(company);
                    }
                });
                
            });
            var negativeComp = data.affectedIndustries.negative;
            negativeComp.forEach(function(company){
                var affectedInvestors = userData.companyInvestors[company];
                affectedInvestors.forEach(function(investor){
                    if (!(investor in affectedInvestorList)){
                        affectedInvestorList[investor] = {positive:[], negative:[]};
                        affectedInvestorList[investor].negative.push(company);
                    } else {
                        affectedInvestorList[investor].negative.push(company);
                    }
                });
            });

            // combine json to send
            var payload = {
                affectedInvestors: affectedInvestorList,
                report: json
            }

            request({
                url: 'https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/bot',
                method: 'POST',
                json: payload
            }, (error, response, body) => {
                if (error) {
                    console.log(error);
                    context.fail('Error sending message: ', error);
                } else {
                    console.log(response);
                    context.succeed(payload);
                }
            })

            //context.succeed(json)
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}