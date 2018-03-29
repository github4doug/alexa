var https = require('https');
var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    try {
        if (event.session.new) {
            console.log("NEW SESSION");
            onSessionStarted(event.request.requestId);
        }

        switch (event.request.type) {
            case "LaunchRequest":
                console.log("LAUNCH REQUEST");
                onLaunchRequest(event.request.requestId, callback);
                break;
            case "IntentRequest":
                console.log("INTENT REQUEST");
                onIntentRequest(event.request, event.session, callback);
                break;
            case "SessionEndedRequest":
                console.log("SESSION ENDED REQUEST");
                onSessionEnded(event.request.requestId);
                break;
            default:
                context.fail("Invalid request type" + event.request.type);
        }
    }
    catch (e) {
        context.fail("Exception:" + e);
    }
};

function onSessionStarted(requestId) {
    console.log('In function onSessionStarted: ' + requestId);
}

function onSessionEnded(requestId) {
    console.log('In function onSessionEnded: ' + requestId);
}

function handleWelcomeResponse(callback) {
    console.log("In function handleWelcomeResponse");
    const title = "Welcome";
    const speechOutput = "Welcome to my stock list." +
        "You can say add stock, remove stock or list stocks.";
    const speechResponse = buildSpeechletResponse(title, speechOutput, false);
    // can also use context.succeed
    callback(null, generateResponse(speechResponse, {}));
}

function handleGoodbyeResponse(callback) {
    console.log("In function handleGoodbyeResponse");
    const title = "Goodbye";
    const speechOutput = "Thank you for trying My Stock list. Have a nice day.";
    const speechResponse = buildSpeechletResponse(title, speechOutput, true);
    // can also use context.succeed
    callback(null, generateResponse(speechResponse, {}));
}

function onLaunchRequest(requestId, callback) {
    console.log("In function onLaunchRequest");
    handleWelcomeResponse(callback);
}

function onIntentRequest(request, session, callback) {
    console.log("In function onIntentRequest");
    console.log("In function onIntentRequest request=" + request);
    console.log("In function onIntentRequest session=" + session);
    console.log("In function onIntentRequest callback=" + callback);


    const intentName = request.intent.name;

    if (intentName == 'AddStock') {
        addStock(request, session, callback);
    }
    else if (intentName == 'RemoveStock') {
        removeStock(request, session, callback);
    }
    else if (intentName == 'ListStocks') {
        listStocks(request, session, callback);
    }
    else if (intentName == 'AMAZON.CancelIntent' || intentName == 'AMAZON.StopIntent') {
        handleGoodbyeResponse(callback);
    }
    else if (intentName == 'AMAZON.HelpIntent') {
        handleWelcomeResponse(callback);
    }
    else {
        throw new Error("Could not identify intent: " + intentName);
    }
}

function addStock(request, session, callback) {
    console.log("In function addStock");
    var userId = session.user.userId;
    var stockName = request.intent.slots.StockName.value;

    console.log("In function addStock for user:" + userId + " stock name:" + stockName);
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "StockList",
        Key: { 'userid': userId },
        UpdateExpression: "ADD #StockName :name",
        ExpressionAttributeNames: {
            "#StockName": "Stocks",
        },
        ExpressionAttributeValues: {
            ":name": docClient.createSet([stockName])
        },
        ReturnValues: "ALL_NEW"
    };
    console.log("In function addStock params:" + JSON.stringify(params));

    docClient.update(params, function(err, data) {
        if (err) {
            console.log("Unable to add stock:" + JSON.stringify(err));
            console.log("Unable to add stock:" + JSON.stringify(data));
        }
        else {
            console.log("Added stock succesfully: " + stockName);
            const title = "Added Stock";
            const speechOutput = stockName + " added to stock list";
            const speechletResponse = buildSpeechletResponse(title, speechOutput, false);
            callback(null, generateResponse(speechletResponse, {}));
        }


    });


}

function removeStock(request, session, callback) {
    console.log("In function removeStock");
    var userId = session.user.userId;
    var stockName = request.intent.slots.StockName.value;

    console.log("In function removeStock for user:" + userId + " stock name:" + stockName);

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "StockList",
        Key: { 'userid': userId },
        UpdateExpression: "DELETE #StockName :name",
        ExpressionAttributeNames: {
            "#StockName": "Stocks",
        },
        ExpressionAttributeValues: {
            ":name": docClient.createSet([stockName])
        },
        ReturnValues: "ALL_NEW"
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.log("Unable to remove stock:" + JSON.stringify(err));
            console.log("Unable to remove stock:" + JSON.stringify(data));
        }
        else {
            console.log("Removed stock succesfully: " + stockName);
            const title = "Removed Stock";
            const speechOutput = stockName + " removed from stock list";
            const speechletResponse = buildSpeechletResponse(title, speechOutput, false);
            callback(null, generateResponse(speechletResponse, {}));
        }
    });
}

function listStocks(request, session, callback) {
    console.log("In function listStocks");
    var userId = session.user.userId;

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "StockList",
        Key: { 'userid': userId },
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.log("Unable to get stocks:" + JSON.stringify(err));
            console.log("Unable to get stocks:" + JSON.stringify(data));
        }
        else {
            console.log("Got stocks succesfully!");
            var stockName = "";
            const title = "List Stocks";
            var speechOutput = JSON.stringify(data);
            if (data.Item.Stocks !== 'undefined'){
                speechOutput = "Your favorite stocks are ";
                for (var i in data.Item.Stocks.values) {
                    stockName = data.Item.Stocks.values[i];
                    speechOutput += ", " + stockName;
                }
            } else {
                speechOutput = "There are no stocks in your stock list.";
            }

            const speechletResponse = buildSpeechletResponse(title, speechOutput, false);
            callback(null, generateResponse(speechletResponse, {}));
        }
    });
}

const buildSpeechletResponse = (title, outputText, shouldEndSession) => {
    return {
        outputSpeech: {
            type: "PlainText",
            text: outputText
        },
        card: {
            type: "Simple",
            title: title,
            content: outputText
        },
        shouldEndSession: shouldEndSession
    };
};

const generateResponse = (speechletResponse, sessionAttributes) => {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
};
