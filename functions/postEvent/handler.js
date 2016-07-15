'use strict';

const request = require('request')
const aws = require('aws-sdk')
const db = require('../db.js');
aws.config.region = 'ap-northeast-1';

// define hard-coded data
var phoneNumber = "0000-0000" // phone number of Elite Butler
//var investorList = ["1208270852551586", "958628190914977", "1120359171369250"]; // messenger ids of registered clients

// For proof of concept, the userData are hard-coded instead of retrieved from database.
// User ids for messaging are stored at the time they register with the FB fanpage.
var userData = {
    "companyInvestors": {
        "LVMH": [
            "1120359171369250",
            "958628190914977"
        ],
        "Scotch Whiskey": [
            "1120359171369250",
            "1208270852551586"
        ],
        "RyanAir": [
            "1120359171369250",
            "958628190914977"
        ],
        "Volkswagen Group": [
            "1120359171369250",
            "1208270852551586"
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

            var pi = new Promise ((res, rej) => {
                db.getInvestorList(res, rej);
            });
            pi.then((investorList) => {
                console.log(`investorList: ${JSON.stringify(investorList)}`);
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
                            Bucket: 'elite-butler-user-report',
                            Key: investor,
                            Body: textStr
                        };
                        console.log("Ready to send "+textStr);

                        s3.putObject(params, function(err, data) {
                            if (err) {
                                console.log("Error uploading data: ", err);
                            } else {
                                console.log("Successfully uploaded data to elite-butler-user-report/"+investor);

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
                                        console.log(`Error sending msg to clients: ${error}`);
                                        reject();
                                    } else {
                                        console.log(`Successfully sent msg to clients: ${response}`);
                                        resolve();
                                    }
                                })
                            }
                        });
                    });
                    promises.push(p);
                });
                Promise.all(promises).then(()=>{
                    context.succeed('Thank you for your effort!');
                });
            });
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}