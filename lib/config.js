// create and export configuration variables
const env = require('./../.env');

// container for all envs
var environments = {};

// create staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'mailgun': {
        'fromEmail': 'ishanloya@gmail.com',
        'domain': env.mailgun.domain,
        'user': env.mailgun.user,
        'password': env.mailgun.apiKey
    },
    'stripe': {
        'key': env.stripe.key
    }
};

// create production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret'
};

// determine which env was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check that current env is available in the environments object created above, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// export the module
module.exports = environmentToExport;