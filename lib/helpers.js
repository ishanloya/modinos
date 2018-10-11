// 
// 
// helpers
// 

// dependencies
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const _data = require('./data');

// container
var helpers = {};

// create a SHA256 hash
helpers.hash = (str) => {
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// parse a json string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }
};

// create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // define all possible characters
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';

        // start the final string
        var str = '';
        for(i=1; i <= strLength; i++) {
            // get a random character & append to final string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }

        return str;
    } else {
        return false;
    }
};

// // calculate cart total amount
// helpers.calculateOrderAmount = (cartData) => {

//     var cartItems = cartData.items;
//     var orderAmount = 0;

//     for(var key in cartItems) {
//         _data.read('menuItems', key, (err, menuItemData) => {
//             if(!err && menuItemData) {
//                 orderAmount += menuItemData.price * cartItems[key];
//             }
//         });
//     }

//     return orderAmount;
// };


// send emails via the Mailgun API
helpers.sendMail = (toEmail, subject, msg, callback) => {
    // validate params
    toEmail = typeof(toEmail) == 'string' && toEmail.trim().length > 5 ? toEmail.trim() : false;
    subject = typeof(subject) == 'string' && subject.trim().length > 5 ? subject.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 5 ? msg.trim() : false;

    if(toEmail && subject && msg) {
        // configure the request payload
        var payload = {
            'from': config.mailgun.fromEmail,
            'to': toEmail,
            subject,
            'text': msg
        };

        // stringify payload
        var stringPayload = querystring.stringify(payload);

        // configure request details
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.mailgun.net',
            'method': 'POST',
            'path': `/v3/${config.mailgun.domain}/messages`,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'auth': `${config.mailgun.user}:${config.mailgun.password}`
        };

        // instantiate request object
        var req = https.request(requestDetails, res => {
            // grab the status of the sent request
            var status = res.statusCode;
            // callback successfully if request went through
            if(status == 200 || status == 201) {
                callback(false);
            } else {
                callback(`Status code returned was ${status}`);
            }
        });

        // bind to error event in case of error so it doesn't get thrown (kill the thread)
        req.on('error', e => {
            callback(e);
        });

        // add the payload
        req.write(stringPayload);

        // send (end) the request
        req.end();
    } else {
        callback('Given parameters were missing or invalid');
    }
    
};

// receive payments via the Stripe API
helpers.receivePayment = (amount, currency, receipt_email, callback) => {
    // validate params
    amount = typeof(amount) == 'number' && amount > 0 ? amount : false;
    currency = currency.toLowerCase() === 'usd' ? currency.toLowerCase() : false;

    if(currency) {
        if(amount) {
            // configure the request payload
            var payload = {
                'amount': amount * 100, // amount to be sent in cents
                currency,
                'source': 'tok_amex',
                'description': 'Sample payment from Modinos Pizza App',
                receipt_email
            };

            // stringify payload
            var stringPayload = querystring.stringify(payload);

            // configure request details
            var requestDetails = {
                'protocol': 'https:',
                'hostname': 'api.stripe.com',
                'method': 'POST',
                'path': `/v1/charges`,
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                'auth': `${config.stripe.key}:`
            };

            // instantiate request object
            var req = https.request(requestDetails, res => {
                // grab the status of the sent request
                var status = res.statusCode;
                // callback successfully if request went through
                if(status == 200) {
                    callback(false);
                } else {
                    callback(`Status code returned was ${status}`);
                }
            });

            // bind to error event in case of error so it doesn't get thrown (kill the thread)
            req.on('error', e => {
                callback(e);
            });

            // add the payload
            req.write(stringPayload);

            // send (end) the request
            req.end();
        } else {
            callback('Please provide a valid amount');
        }
    } else {
        callback('Supplied currency is not supported currently');
    }
};

module.exports = helpers;