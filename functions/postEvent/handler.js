'use strict';

var request = require('request')
var aws = require('aws-sdk')
aws.config.region = 'ap-northeast-1';

// define hard-coded data
var phoneNumber = "0000-0000" // phone number of Elite Butler
var investorList = ["1", "2", "3", "4", "5", "6", "7", "1120359171369250"]; // messenger ids of registered clients

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

            // send individual messages one by one

            var marketEvent = json;

            var beginning = "A recent market event "+marketEvent.title+" is affecting the market to a great deal. Summarized effects:\n\n";
            marketEvent.effects.forEach(function(effect){
                beginning += effect+"\n"
            });
            beginning += "\n"

            // var ending = "\n\nIf you still find concerns, please contact "+phoneNumber

            var normalReport = "After reviewing your profile, you are not largely affected by this market event."

                // prepare an array of promises, because sending messages is async and need to wait for them all to complete
            var promises = [];

            var affectedInvestors = affectedInvestorList;
            investorList.forEach(function(investor){

                var p = new Promise((resolve, reject) => {
                    var textArray = [];
                    textArray.push(beginning);

                    if (!(investor in affectedInvestors)) {
                        textArray.push(normalReport);
                    } else {
                        var report = "This market event may affect you to a certain extent.\n\n";
                        if (affectedInvestors[investor].positive.length != 0){
                            report += "The following companies you are engaged in are positively affected:\n\n";
                            affectedInvestors[investor].positive.forEach(function(company){
                                report += company+"\n";
                            });
                        } 
                        
                        textArray.push(report);

                        report = "";
                        if (affectedInvestors[investor].negative.length != 0){
                            report += "The following companies you are engaged in are negatively affected:\n\n";
                            affectedInvestors[investor].negative.forEach(function(company){
                                report += company+"\n";
                            });
                        }
                        report += "\nWe suggest that you take immediate response to better enhance your profile.";
                        
                        textArray.push(report);
                    }
                    // textArray.push(ending);
                    var textStr = textArray.join('\n');

                    // upload report to s3
                    var s3 = new aws.S3();
                    var params = {
                        Bucket: 'elite-butler-user-report', /* required */
                        Key: investor, /* required */
                        Body: textStr
                    };
                    console.log("Ready to send "+textStr);

                    s3.putObject(params, function(err, data) {
                        if (err) {
                            console.log("Error uploading data: ", err);
                        } else {
                            console.log("Successfully uploaded data to elite-butler-user-report/"+investor);
                            // var s3 = new aws.S3();
                            // var params = {Bucket: 'elite-butler-user-report', Key: investor};
                            // s3.getSignedUrl('getObject', params, function (err, url) {
                            //     if (err) {
                            //         console.log("Error uploading data: ", err);
                            //     } else {
                            //         console.log("The URL is", url);
                            //         var payload = {
                            //             id: investor,
                            //             reportUrl: url
                            //         }

                            //         request({
                            //             url: 'https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/bot',
                            //             method: 'POST',
                            //             json: payload
                            //         }, (error, response, body) => {
                            //             if (error) {
                            //                 console.log(error);
                            //                 // context.fail('Error sending message: ', error);
                            //                 reject();
                            //             } else {
                            //                 console.log(response);
                            //                 resolve();
                            //             }
                            //         })
                            //     }
                            // });
                            var url = 'https://elite-butler-user-report.s3-ap-northeast-1.amazonaws.com/'+investor;
                            console.log("The URL is", url);
                            var payload = {
                                id: investor,
                                reportUrl: url,
                                title: marketEvent.title
                            }

                            request({
                                url: 'https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/bot',
                                method: 'POST',
                                json: payload
                            }, (error, response, body) => {
                                if (error) {
                                    console.log(error);
                                    // context.fail('Error sending message: ', error);
                                    reject();
                                } else {
                                    console.log(response);
                                    resolve();
                                }
                            })
                        }
                    });

                    // combine json to send
                    // var payload = {
                    //     affectedInvestors: affectedInvestorList,
                    //     report: json
                    // }


                });
                promises.push(p);
            });
            Promise.all(promises).then(()=>{
                context.succeed();
            });
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}