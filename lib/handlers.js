// these are the request handlers

// dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const util = require('util');
const debug = util.debuglog('handlers');

// define handlers
var handlers = {};

// users
handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }

};

// container for users submethods
handlers._users = {};

// users - post
// required data: firstName, lastName, email, password, address, tosAgreement
// optional data: none
handlers._users.post = (data, callback) => {
    // check all reqd fields are present
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && email && password && address && tosAgreement) {
        // ensure that the user doesn't already exist
        _data.read('users', email, (err, data) => {
            if(err) {
                // hash the password
                var hashedPassword = helpers.hash(password);

                // create the user object
                if(hashedPassword) {
                    var userObject = {firstName, lastName, email, hashedPassword, address, 'tosAgreement' : true};
    
                    // store the user
                    _data.create('users', email, userObject, err => {
                        if (!err) {

                            // create an empty cart for the user and add the cart to the user object
                            // handlers._carts.post(userObject, callback);
                            callback(200);
                        } else {
                            debug(err);
                            callback(500, {'Error' : 'Could not create the new user'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password'});
                }
            } else {
                callback(400, {'Error' : 'A user with that email address already exists'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// users - get
// required data: email
// optional data: none
// only let authenticated users access their object. Don't let them access other's objects
handlers._users.get = (data, callback) => {
    // check that the email address provided is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
    if (email) {
        // get the token from the headers
        // var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify that given token is valid for the email address
        // handlers._tokens.verifyToken(token, email, tokenIsValid => {
            // if(tokenIsValid) {
                // lookup the user
        _data.read('users', email, (err, data) => {
            if (!err && data && data != null) {
                // remove the hashed password from the user object before returning it to the requester
                
                // delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    //         } else {
    //             callback(403, {'Error': 'Missing required token in header or token is invalid'});
    //         }
    //     });
    // } else {
    //     callback(400, {'Error': 'Missing required field'});
    // }
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// users - put
// required data: email
// optional data: firstName, lastName, password, address (at least one must be specified)
// only let authenticated user update their own object, not anyone else's
handlers._users.put = (data, callback) => {
    // check for required field
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;

    // check for optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    
    // error if email is not included
    if  (email){
        // error if none of the optional fields is included
        if (firstName || lastName || address || password) {
            // get the token from the headers
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // verify that given token is valid for the email address
            handlers._tokens.verifyToken(token, email, tokenIsValid => {
                if(tokenIsValid) {
                    // lookup the user
                    _data.read('users', email, (err, userData) => {
                        if(!err && userData) {
                            // update the fields necessary
                            if(firstName) {
                                userData.firstName = firstName;
                            }
                            if(lastName) {
                                userData.lastName = lastName;
                            }
                            if(address) {
                                userData.address = address;
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password);
                            }

                            // store new updates
                            _data.update('users', email, userData, err => {
                                if(!err) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update the user'});
                                }
                            })
                        } else {
                            callback(400, {'Error' : 'Specified user does not exist'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header or token is invalid'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing field to update'});
        }
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// users - delete
// required data: email
// optional data: none
// only let authenticated user delete their own object, no one else's
// cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback) => {
    // check for required field
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;

    if(email) {
        // get the token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify that given token is valid for the email address
        handlers._tokens.verifyToken(token, email, tokenIsValid => {
            if(tokenIsValid) {
                // lookup the user
                _data.read('users', email, (err, userData) => {
                    if(!err && userData) {
                        // delete the user
                        _data.delete('users', email, err => {
                            if(!err) {
                                
                                // delete all the orders for that user
                                var userOrders = typeof(userData.orders) == 'object' && userData.orders instanceof Array ? userData.orders : [];
                                var ordersToDelete = userOrders.length;
                                if(ordersToDelete > 0) {
                                    var ordersDeleted = 0;
                                    var deletionErrors = false;
                                    // loop through orders
                                    userOrders.forEach(orderId => {
                                        // delete the order
                                        _data.delete('orders', orderId, err=> {
                                            if(err) {
                                                deletionErrors = true;
                                            }
                                            ordersDeleted++;
                                            if(ordersDeleted == ordersToDelete) {
                                                if(!deletionErrors) {
                                                    // delete cart for user
                                                    _data.delete('carts', email, err => {
                                                        if(!err) {
                                                            callback(200);
                                                        } else {
                                                            callback(500, {'Error': 'Could not delete cart for user'});
                                                        }
                                                    });
                                                } else {
                                                    callback(500, {'Error': 'Errors encountered while attempting to delete user orders, all orders may not have been deleted'});
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {'Error': 'Could not delete user'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'Specified user does not exist'});
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// tokens
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }

};

// container for tokens submethods
handlers._tokens = {};

// tokens - post
// required data: email, password
// optional data: none
handlers._tokens.post = (data, callback) => {
    // check required fields
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(email && password) {
        // lookup user matching the email address
        _data.read('users', email, (err, userData) => {
            if(!err && userData) {
                // compare the hashed sent password to the password stored in the user object
                var hashedPassword = helpers.hash(password);

                if(hashedPassword == userData.hashedPassword) {
                    // create token with random name, set expiration date to 1 hour in the future 
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {'id': tokenId, email, expires};
                    
                    // store token
                    _data.create('tokens', tokenId, tokenObject, err => {
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Incorrect password. Cannot create token'});
                }
            } else {
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// tokens - get
// required data: id
// optional data: none
handlers._tokens.get = (data, callback) => {
    // check that the id sent in the query string is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// tokens - put
// required data: id, extend
// optional data: none
handlers._tokens.put = (data, callback) => {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend) {
        // lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                // check to make sure that the token isn't already expired
                if(tokenData.expires > Date.now()) {
                    // set expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // store new updates
                    _data.update('tokens', id, tokenData, err => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not update the token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Token has already expired and cannot be extended'});
                }
            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
    }
};

// tokens - delete
// required data: id
// optional data: none
handlers._tokens.delete = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // lookup token
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                _data.delete('tokens', id, err => {
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Error deleting token'});
                    }
                })
            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, email, callback)=> {
    // lookup token id
    _data.read('tokens', id, (err, tokenData) => {
        if(!err && tokenData) {
            // check that the token is for the given user and has not expired
            if(tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// menu items
handlers.menuItems = (data, callback) => {
    var acceptableMethods = ['get'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._menuItems[data.method](data, callback);
    } else {
        callback(405);
    }
}

// container for menu items submethods
handlers._menuItems = {};

// menuItems - get all items
// required data: user should be authenticated
// optional data: none
handlers._menuItems.get = (data, callback) => {
    // get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    
    _data.read('tokens', token, (err, tokenData) => {
        if(!err && tokenData) {
            // verify that given token is valid
            if(tokenData.expires > Date.now()) {
                _data.list('menuItems', (err, menuItems) => {
                    if(!err && menuItems && menuItems.length > 0) {
                        // create array to hold all the menu items
                        var menu = [];
                        var totalItems = menuItems.length;
                        if(totalItems > 0) {
                            var itemsProcessed = 0;
                            var processingErrors = false;
                            // loop through items
                            menuItems.forEach(menuItem => {
                                _data.read('menuItems', menuItem, (err, menuItemData) => {
                                    if(err) {
                                        processingErrors = true;
                                    }
                                    // add menu item data to menu array
                                    menu.push(menuItemData);
                                    itemsProcessed++;

                                    // end when all items have been processed
                                    if(itemsProcessed == totalItems) {
                                        if(!processingErrors) {
                                            callback(200, menu);
                                        } else {
                                            callback(500, {'Error': 'Errors encountered while attempting to process menu items'});
                                        }
                                    }
                                });
                            });
                        } else {
                            callback(200);
                        }
                    } else {
                        debug('Could not find any menu items to lookup');
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header or token is invalid'});
            }
        } else {
            callback(403);
        }
    });
};

// carts
handlers.carts = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._carts[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for carts submethods
handlers._carts = {};

// carts - post
// required data: user email id
// optional data: none
// an empty cart will be created for the user when user is created
handlers._carts.post = (userObject, callback) => {
    var cartObject = {
        'email': userObject.email,
        'items': {},
        'totalAmount': 0
    };

    _data.create('carts', userObject.email, cartObject, err => {
        if(!err) {
            // add cart to the user's object
            userObject.cart = [];
            // save the new user data
            _data.update('users', userObject.email, userObject, err => {
                if(!err) {
                    callback(200);
                } else {
                    callback(500, {'Error': 'Could not update the user with the new cart'});
                }
            });
        } else {
            callback(500, {'Error': 'could not create cart for new user'});
        }
    });
};

// carts - get
// required data: email, user should be authenticated (valid token)
// optional data: none
handlers._carts.get = (data, callback) => {
    // check that the email provided is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
    if (email) {
        // lookup order
        _data.read('carts', email, (err, cartData) => {
            if(!err && cartData) {
                // get the token from the headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // verify that given token is valid and belongs to the user who created the order
                handlers._tokens.verifyToken(token, cartData.email, tokenIsValid => {
                    if(tokenIsValid) {
                        // return order data
                        callback(200, cartData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};


// carts - put
// required data: email, at least one item and its quantity. Overwrite previous cart data for now
// Item id must be part of menu items
// sample item data: [ {'001':5}, {'003':1} ] 
// optional data: none
handlers._carts.put = (data, callback) => {
    // check for required field
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
    var items = typeof(data.payload.items) == 'object' && Object.keys(data.payload.items).length > 0 ? data.payload.items : false;
    
    // error if id is not included
    if  (email && items){
            // lookup the cart
            _data.read('carts', email, (err, cartData) => {
                if(!err && cartData) {
                    // get the token from the headers
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    // verify that given token is valid and belongs to the user who create the check
                    handlers._tokens.verifyToken(token, cartData.email, tokenIsValid => {
                        if(tokenIsValid) {

                            // create new object from valid menu items
                            var validItems = {
                                'email': email,
                                'items': {},
                            };
                            var totalItems = Object.keys(items).length;
                            var itemsProcessed = 0;
                            var orderAmount = 0;

                            // check if items provided exist in menu items
                            // lookup menu item, if menuItemData returned, item exists
                            for(const key of Object.keys(items)) {
                                
                                _data.read('menuItems', key, (err, menuItemData) => {
                                    
                                    itemsProcessed++;
                                    
                                    if(err.code === 'ENOENT') {
                                        debug('\x1b[31m%s\x1b[0m', `Menu item ${key} does not exist`)
                                    } else {
                                        validItems.items[key] = {
                                            'qty': items[key],
                                            'price': menuItemData.price,
                                            'itemTotal': items[key] * menuItemData.price
                                        };
                                        orderAmount += items[key] * menuItemData.price;
                                    }

                                    // end when all items have been processed
                                    if(itemsProcessed == totalItems) {
                                        validItems.totalAmount = orderAmount;
                                        // store new updates
                                        _data.update('carts', email, validItems, err => {
                                            if(!err) {
                                                callback(200, validItems);
                                            } else {
                                                callback(500, {'Error': 'Could not update the cart'});
                                            }
                                        });                                        
                                    }
                                });                               
                            }
                        } else {
                            callback(403, {'Error': 'Missing required token in header or token is invalid'});
                        }
                    });
                } else {
                    callback(404);
                }
            });      
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// carts - delete
// required data: email
// optional data: none
handlers._carts.delete = (data, callback) => {
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
    if(email) {
        // lookup token
        _data.read('carts', email, (err, cartData) => {
            if(!err && cartData) {
                _data.delete('carts', email, err => {
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Error deleting cart'});
                    }
                })
            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// orders
handlers.orders = (data, callback) => {
    var acceptableMethods = ['post', 'get'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._orders[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for orders submethods
handlers._orders = {};

// orders - post
// required data: cart id
// optional data: none
handlers._orders.post = (data, callback) => {
    // validate inputs
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;

    if(email) {
        // get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify that given token is valid and belongs to the user who create the check
        handlers._tokens.verifyToken(token, email, tokenIsValid => {
            if(tokenIsValid) {

                // lookup the user
                _data.read('users', email, (err, userData) => {
                    if(!err && userData) {
                        // get cart data
                        _data.read('carts', email, (err, cartData) => {
                            if(!err && cartData) {
                                // create order object with cart data
                                var orderId = helpers.createRandomString(20);
                                // create order object and include the user's email
                                var orderObject = cartData;
                                orderObject.id = orderId;

                                _data.create('orders', orderId, orderObject, err => {
                                    if(!err) {
                                        
                                        // send order to Stripe
                                        helpers.receivePayment(orderObject.totalAmount, 'usd', email, err => {
                                            if(err) {
                                                debug(err);
                                            }
                                        });

                                        // send user a receipt using Mailgun
                                        var msg = `Your order amount for Modinos Pizza was ${orderObject.totalAmount}. Thank you!`
                                        helpers.sendMail(email, 'Your Modinos Receipt', msg, err => {
                                            if(err) {
                                                debug(err);
                                            }
                                        });

                                        var userOrders = typeof(userData.orders) == 'object' && userData.orders instanceof Array ? userData.orders : [];

                                        // add order to the user object
                                        userData.orders = userOrders;
                                        userData.orders.push(orderId);

                                        // update user object
                                        _data.update('users', email, userData, err => {
                                            if(!err){
                                                // return the data about the new order
                                                callback(200, orderObject);
                                            } else {
                                                callback(500, {'Error': 'Could not update the user with the new order'});
                                            }
                                        });
                                    } else {
                                        callback(500, {'Error': 'Could not create new order'});
                                    }
                                });
                                
                            } else {
                                callback(400, {'Error': 'No cart data found'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'User data not found'});
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header or token is invalid'});
            }
        });
    }
};

// ping handler
handlers.ping = (data, callback) => {
    // callback a http status code, and a payload object
    callback(200);
};

// not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};


module.exports = handlers;