# Modinos Pizza

This is a sample API for a fictional pizza delivery company called Modinos Pizza

## App Usage

When initializing the app, please create the following in the app's root directory to store the app data:
- /.data
- /.data/users
- /.data/tokens
- /.data/menuItems
- /.data/carts
- /.data/orders
- https (to store ssl cert & key files)
- .env.js (to store keys, etc.)

## Methods

### /users
#### POST

    Sample Payload

    {
        "firstName" : "Ishan",
        "lastName" : "Loya",
        "email": "ishanloya@gmail.com",
        "password": "xxxxxx",
        "address": "Mumbai, India",
        "tosAgreement": true
    }

#### GET (if authorized)

    Sample query string parameter

    {
        "email": "ishanloya@gmail.com"
    }

#### PUT (if authorized)
    
    Sample payload
    {
        "email": "ishanloya@gmail.com",
        "firstName" : "Ishan",
        "lastName" : "Loya",
        "password": "12345",
        "address": "Paris"
    }

#### DELETE (if authorized)
    
    Sample query string parameter.
    Deleting user will delete all user orders and user cart

    {
        "email": "ishanloya@gmail.com"
    }

### /tokens

#### POST

    Sample Payload

    {
        "email": "ishanloya@gmail.com",
        "password": "xxxxxx"
    }

#### GET

    Sample query string parameter

    {
        "id": "token_id_string"
    }

#### PUT
    
    Sample payload
    {
        "id": "token_id_string",
        "extends" : true
    }

#### DELETE
    
    Sample query string parameter

    {
        "id": "token_id_string"
    }


### /menuItems

Menu items should be created with the following format

    001.json

    {
        "id": "001",
        "title": "Vegan Cheese Pizza",
        "price": 10.5
    }

#### GET
User should be authenticated, no query string parameters required.
Will return list of all menu items

### /carts

#### POST

Will be created automatically when a user is created

#### GET (if authorized)

    Sample query string parameter

    {
        "email": "ishanloya@gmail.com"
    }

#### PUT (if authorized)
    
    Sample payload (menuItem ids and quantities required)

    {
        "items": {
            "001": 2, 
            "002": 3,
            "005": 2
        }
    }

#### DELETE (if authorized)
    
Will be deleted automatically when a user is deleted

### /orders
Deleting user will delete all user orders.

#### POST

    Sample payload (will automatically use current cart data to create new order)
    New order ID will be added to user object.
    
    {
        "email": "ishanloya@gmail.com"
    }