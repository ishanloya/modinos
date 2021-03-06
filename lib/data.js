// 
// 
// Library for storing and editing data
// 
// 

// dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

// container
var lib = {};

// base dir of the data folder
lib.baseDir = path.join(__dirname, '/../.data');

lib.create = new Promise(collection, id, data, (resolve, reject) => {
    MongoClient.connect(config.db.url)
        .then(db => {
            var dbo = db.db("modinos");
            data._id = id;
            dbo.collection(collection).insertOne(data)
                .then(res => {
                    db.close();
                    resolve(res);
                }).catch(err => reject(err))
            })
        .catch(err => reject(err))
});

//     }), (err, db) => {
//         if(err) throw err;
//         var dbo = db.db("modinos");
//         data._id = id;
//         dbo.collection(collection).insertOne(data, (err, res) => {
//             if (!err) {
//                 db.close();
//                 resolve(res);
//             } else {
//                 reject(err);
//             }
//         });
//     });
// });


// lib.create = (collection, id, data, callback) => {
//     MongoClient.connect(config.db.url, (err, db) => {
//         if(err) throw err;
//         var dbo = db.db("modinos");
//         data._id = id;
//         dbo.collection(collection).insertOne(data, (err, res) => {
//             if (!err) {
//                 callback(false);
//                 db.close();
//             } else {
//                 console.log(err);
//             }
//         });
//     });
// };


// // create file, write data to file
// lib.create = (dir, file, data, callback) => {
//     // open file for writing
//     fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
//         if(!err && fileDescriptor) {
//             // convert data to string
//             var stringData = JSON.stringify(data);

//             // write to file and close it
//             fs.writeFile(fileDescriptor, stringData, err => {
//                 if(!err) {
//                     fs.close(fileDescriptor, err => {
//                         if(!err) {
//                             callback(false);
//                         } else {
//                             callback('Error closing new file');
//                         }
//                     });
//                 } else {
//                     callback('Error writing to new file');
//                 }
//             });
//         } else {
//             callback('Could not create new file, it may already exist');
//         }
//     });
// };

// // read data from a file
// lib.read = (dir, file, callback) => {
//     fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, 'utf8', (err, data) => {
//         if(!err && data) {
//             var parsedData = helpers.parseJsonToObject(data);
//             callback(false, parsedData);
//         } else {
//             callback(err, data);
//         }
//     });
// };

// read from database
lib.read = (collection, id, callback) => {
    MongoClient.connect(config.db.url, (err, db) => {
        if(err) throw err;
        var dbo = db.db("modinos");
        // hide hashedPassword (if present) when returning data to user
        dbo.collection(collection).findOne({_id: id},{projection: {hashedPassword:0}}, (err, res) => {
            if (!err && res) {
                // var parsedData = helpers.parseJsonToObject(res);
                callback(false, res);
                db.close();
            } else {
                callback(err, res);
            }
        });
    });
};

// update existing file
lib.update = (dir, file, data, callback) => {
    // open file for writing
    fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            // convert data to string
            var stringData = JSON.stringify(data);

            // truncate file
            fs.ftruncate(fileDescriptor, err => {
                if(!err) {
                    // write to file and close it
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if(!err) {
                            fs.close(fileDescriptor, err => {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });


        } else {
            callback('Error opening existing file for updating, may not exist yet');
        }
    });
};

// delete file
lib.delete = (dir, file, callback) => {
    // unlink the file
    fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, err => {
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

// list all items in a directory
lib.list = (dir, callback) => {
    fs.readdir(`${lib.baseDir}/${dir}`, (err, data) => {
        if(!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(fileName => {
                trimmedFileNames.push(fileName.replace('.json', ''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
};

// export container
module.exports = lib;
