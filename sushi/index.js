'use strict';
var Alexa = require('alexa-sdk');

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.  
var APP_ID = "";

var SKILL_NAME = "Sushi Facts";
var GET_FACT_MESSAGE = "Here's your fact: ";
var HELP_MESSAGE = "You can say tell me a sushi fact, or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";

var data = [
    "Sushi has always been cosmopolitan.",
    "The earthquake of 1923 brought sushi off the streets.",
    "The oldest type of sushi in Japan tastes like cheese.",
    "Salmon is technically a white fish.",
    "Live scallops aren't actually alive.",
    "Uni isn't exactly what you think.",
    "Bluefin wasn't always so desirable.",
    "Japanese knives are sharpened differently.",
    "Sushi meals didn't always begin with miso.",
    "Sashimi's translation makes perfect sense.",
    "There's already plenty of wasabi on your sushi.",
    "Grocery store sushi will always taste sour.",
    "Plastic grass in takeout sushi had a historical purpose.",
    "Pickled ginger is dyed pink.",
    "the ingredient which all sushi have in common is rice or sumeshi.",
    "some common varieties of sushi use cooked ingredients or are vegetarian.",
    "Popular garnishes are often made using daikon.",
    "sushi means sour-tasting, a reflection of its historic origin as a fermented food.",
    "the oldest sushi is narezushi, made by wrapping fish in soured fermenting rice.",
    "raw fish and rice are naturally low in fat, high in protein, carbohydrates, vitamins, and minerals"
];

//=========================================================================================================================================
//Editing anything below this line might break your skill.  
//=========================================================================================================================================
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetNewFactIntent');
    },
    'GetNewFactIntent': function () {
        var factArr = data;
        var factIndex = Math.floor(Math.random() * factArr.length);
        var randomFact = factArr[factIndex];
        var speechOutput = GET_FACT_MESSAGE + randomFact;
        this.emit(':tellWithCard', speechOutput, SKILL_NAME, randomFact)
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HELP_MESSAGE;
        var reprompt = HELP_REPROMPT;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    }
};
