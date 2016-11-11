'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('../base-manager');
var BateeqModels = require('bateeq-models');
var Store = BateeqModels.master.Store;
var map = BateeqModels.map;
//var generateCode = require('../../utils/code-generator');
 
module.exports = class StoreManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.Store);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.master.Store}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        }

        var codeIndex = {
            name: `ix_${map.master.Store}_code`,
            key: {
                code: 1
            },
            unique: true
        }

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }
    
    _getQuery(paging) { 
        var deleted = {
            _deleted: false
        };
        
        var query = paging.filter ? {
            '$and': [paging.filter, deleted]
        } : deleted; 

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var filterName = {
                'name': {
                    '$regex': regex
                }
            };
            var $or = {
                '$or': [filterCode, filterName]
            };

            query['$and'].push($or);
        }
        return query; 
    }
    
    _validate(store) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Store(store);
            // 1. begin: Declare promises.
            var getStore = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                        code: valid.code
                    }]
            });
            // 1. end: Declare promises.

            // 2. begin: Validation.
            Promise.all([getStore])
                .then(results => {
                    var _store = results[0];

                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_store) {
                        errors["code"] = "code already exists";
                    }

                    if (!valid.name || valid.name == '')
                        errors["name"] = "name is required"; 
                    
                    if (!valid.address || valid.address == '')
                        errors["address"] = "address is required";
                    
                    if (!valid.phone || valid.phone == '')
                        errors["phone"] = "phone is required";
                        
                    if (!valid.salesCapital)
                        errors["salesCapital"] = "Sales Capital is required";
                    else if(valid.salesCapital <= 0)
                        errors["salesCapital"] = "Sales Capital must be greater than 0";

                    // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};