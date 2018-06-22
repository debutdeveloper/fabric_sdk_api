

'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke
 */

var transactionUtils = require('../utility/transaction_utils');

//uniqid generates random ids based on mac address, process id and timestamp
const uniqid = require('uniqid');
const request = require('request');
const assetController = require('../asset/assetcode');
const notificationController = require('../notifications/NotificationController');

//Register a new request
module.exports.createRequest = function(req){
    let req_id = uniqid();
	var functionName = 'createRequest';
    var args = [
                    req.description,
                    req.start_time,
                    req.end_time,
                    req.priority.toString(),
                    "0", //for new request, status will always waiting
                    req.user.id,
                    req.user.first_name,
                    req.user.last_name,
                    req.asset.id,
                    req.asset.name,
                    req.asset.description,
                    req_id
                ];


	return transactionUtils.prepareInvokation(functionName,args);
}

//Get requests for assets
module.exports.getRequestsForAssets = function(asset_id){

	var functionName = 'getRequestForAsset';
    var args = [
                    asset_id
                ];


	return transactionUtils.prepareQuery(functionName,args);
}


//List all request
module.exports.listAllRequest = function(body){

    var functionName = 'listAllRequest';
    var args = new Array();

    if(body.field_type != undefined && body.sort_type != undefined){
        args.push(body.field_type.toString());
        args.push(body.sort_type.toString());
        
    }

	return transactionUtils.prepareQuery(functionName,args);
}

//Fetch request by id
module.exports.requestByID = function(req){

	var functionName = 'getRequestByID';
    var args = [req.id];

	return transactionUtils.prepareQuery(functionName,args);
}

//Change request status
module.exports.changeStatus = function(req){
    var functionName = 'changeRequestStatus'
    var args = [
                req.id,
                req.status.toString()
                ]

    return transactionUtils.prepareInvokation(functionName,args);
}

//Update time slot
module.exports.updateTimeSlot = function(req){
    var functionName = 'updateTimeSlot'
    var args = [
                req.id,
                req.start_time,
                req.end_time
                ]

    return transactionUtils.prepareInvokation(functionName,args);
}

//Fetch next immediate request
module.exports.nextRequest = function(req){
    var functionName = 'getNextImmediateRequest'
    var args = [
                req.body.asset_id
                ]

    return transactionUtils.prepareQuery(functionName,args);
}

//Fetch list of requests linked to user id
module.exports.requestByUserID = function(user){
    var functionName = 'getRequestByUserID'
    var args = [
                user.id
                ]

    return transactionUtils.prepareQuery(functionName,args);
}



//This function will accept or reject handover request
module.exports.takeHandoverAction = function(body){
    return new Promise((resolve, reject) => {

            var notification_status;
            var request_status;

            if(body.action == 0){
                notification_status = 1;
                request_status = 6;

                //asset assigned api will be hit only in case user accept request
                assetController.changeAssignedStatus(body.asset_id
                                                    ,body.user.id
                                                    ,body.user.first_name
                                                    ,body.user.last_name,
                                                    resolve,
                                                    reject)
                                                    .then((response) =>{
                                                        takeAdminOrUserAction(body, request_status, notification_status, resolve, reject)
                                                    }).catch((err) =>{
                                                        reject(err)
                                                    })

                

            }else if(body.action == 1){
                notification_status = 2;
                request_status = 7;
                
                takeAdminOrUserAction(body, request_status, notification_status, resolve, reject)
            }

    })
}

/**
 * This function will check if request was originated from admin or user and the 
 * take further action (decide which function to call because in case of admin there
 * is no need to call changeRequestStatus() because request will not get created for admin)
 * @param {Object} body 
 * @param {Number} request_status 
 * @param {Number} notification_status 
 * @param {Function} resolve 
 * @param {Function} reject 
 */
function takeAdminOrUserAction(body,request_status,notification_status,resolve,reject){
    if(body.req_type == 0){
        changeRequestStatus(body,request_status,notification_status,resolve,reject)
    }else{
        //Change notification status
        changeNotificationStatus(body,notification_status,resolve,reject)
    }
}

/**
 * This function will change request status
 * @param {String} request_id 
 */
function changeRequestStatus(body,request_status,notification_status, resolve, reject){
    var functionName = 'changeRequestStatus'
    var args = [
                body.request_id,
                request_status.toString()
                ]

    transactionUtils.prepareInvokation(functionName,args).then((response) =>{
        //Change notification status
        changeNotificationStatus(body,notification_status,resolve,reject)
    }).catch((err) =>{
        reject(err)
    })
}

/**
 * This function will change notification status
 * @param {Object} body 
 * @param {Number} notification_status 
 * @param {Function} resolve 
 * @param {Function} reject 
 */
function changeNotificationStatus(body,notification_status, resolve, reject){
    notificationController
            .updateNotificationStatus(body.notification_id,notification_status)
            .then((resp)=>{
                resolve(resp)
                
                if(body.old_request_id != undefined){
                    var functionName = 'changeRequestStatus'
                    var args = [
                    body.old_request_id,
                    "4"
                    ]

                    transactionUtils.prepareInvokation(functionName,args).then((response) =>{
                        console.log("Request completed ==> "+body.old_request_id)
                    }).catch((err) =>{
                        console.log("Error while completing request ==> "+ err + " request id ==> "+ body.old_request_id)
                    })
                }
            }).catch((err)=>{
                 reject(err)
            })  
}

//This fuction will return the sorted list of requests
module.exports.sortRequests = function(body){
    return new Promise((resolve, reject)=>{

        var functionName = 'sortRequests'
                        var args = [
                        body.field_type.toString(),
                        body.sort_type.toString()
                        ]

        transactionUtils.prepareInvokation(functionName,args).then((response) =>{
                        resolve(response);    
        }).catch((err) =>{
                        reject(err)        
        })

    })
}




