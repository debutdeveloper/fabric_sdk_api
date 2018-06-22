'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke
 */

var Fabric_Client = require('fabric-client');

var path = require('path');
var util = require('util');
var os = require('os');

var chaincodeName = "asset";
var channelName = "storechannel";

var transactionUtils = require('../utility/transaction_utils')

var fabric_client = new Fabric_Client();
var channel = fabric_client.newChannel(channelName);
var peer = fabric_client.newPeer('grpc://localhost:7051');

channel.addPeer(peer);

var order = fabric_client.newOrderer('grpc://localhost:7050')
channel.addOrderer(order);


module.exports.channelList = function(){
    
    return new Promise((resolve, reject) =>{
        var peerlist=channel.getPeers();
        if(peerlist){
            let peerdata=new Object();
            let peerarray=new Array();
            peerlist.forEach(function(peer){
                peerarray.push(peer._url);
                
            });
            peerdata.peers=peerarray;
            resolve(peerdata);
        }else{
            reject(createErrorResponse('No List Found', 500))
        }
    });
}

module.exports.chaininfo=function(){
    return new Promise((resolve,reject) =>{
        transactionUtils.getUserContext("admin").then((obj)=>{
           return obj.channel.queryInfo();
        }).then((chaininfo)=>{
            let channeldata=new Object();
                channeldata.height=chaininfo.height.low;
                channeldata.currentBlockHash=Buffer.from(chaininfo.currentBlockHash.toArrayBuffer()).toString('hex')
                channeldata.previousBlockHash=Buffer.from(chaininfo.previousBlockHash.toArrayBuffer()).toString('hex');
                console.log(channeldata);
                resolve(channeldata);        
        }).catch((error)=>{
            reject(createErrorResponse(error.message, 500));
        });
        });
}

//Get list of channels on network
module.exports.channels = function(){
    return new Promise((resolve, reject) =>{
        transactionUtils.getUserContext("admin")
        .then((obj) =>{
            return obj.client.queryChannels(obj.peer, false)
        }).then((channelQuery) =>{
            resolve(channelQuery)
        }).catch((err) =>{
            reject(err)
        })
    })
}

//Get list of blocks
module.exports.blocks = function(blockNumber){
    return new Promise((resolve, reject) =>{
        transactionUtils.getUserContext("admin")
        .then((obj) =>{
          return  obj.channel.queryBlock(blockNumber)
           channel.queryBlock
        }).then((channelQuery) =>{
            var responseObject = {
                                    height: blockNumber, 
                                    block_hash: channelQuery.header.data_hash,
                                    previous_hash: channelQuery.header.previous_hash,
                                    tx_count:channelQuery.data.data.length
                                };
                                
            var is_configuration = false;
            var transactionsArray = new Array();

            channelQuery.data.data.forEach((item)=>{
                var tx_id = item.payload.header.channel_header.tx_id;
                var timestamp = item.payload.header.channel_header.timestamp;
                var channel_id = item.payload.header.channel_header.channel_id;
                

                if(!item.payload.data.actions){
                    is_configuration = true;
                    return;
                }

                var actions = new Array();

                item.payload.data.actions.forEach((action)=>{

                    if(!action.payload.action.proposal_response_payload.extension.response){
                        is_configuration = true;
                        return;
                    }

                    var proposal_hash = action.payload.action.proposal_response_payload.proposal_hash;
                    var write_requests = action.payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes;
                    var response = action.payload.action.proposal_response_payload.extension.response;
                    var chaincode_details = action.payload.action.proposal_response_payload.extension.chaincode_id;

                    actions.push({
                                    proposal_hash: proposal_hash,
                                    write_requests: write_requests,
                                    response: response,
                                    chaincode_details:chaincode_details
                                })
                })

                transactionsArray.push({
                                             tx_id: tx_id,
                                             timestamp: timestamp,
                                             channel_id: channel_id,
                                             actions: actions

                                    })
            })

            responseObject.is_configuration = is_configuration;
            responseObject.transactions = transactionsArray;
            resolve(responseObject)
        }).catch((err) =>{
            reject(err)
        })
    })
}


function createErrorResponse(message, httpStatus){
    return {status: 0, http_status: httpStatus, message: message}
}