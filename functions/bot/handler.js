'use strict';

module.exports.handler = function(event, context) {
  const operation = event.operation
  console.log("Event: "+ event)
    switch (operation) {
        case 'verify':
            const secret = event.secret
            const verifyToken = event["verify_token"]
            if (secret === verifyToken) {
                context.succeed(parseInt(event["challenge"]))
            } else {
                context.fail(new Error('Unmatch'))
            }
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }
};
