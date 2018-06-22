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
var store_path = 'hfc-key-store';

var transactionUtils = require('../utility/transaction_utils')

//This fuction will return the Total assets, Active users, Active categories and open requests.
module.exports.getDashboard = function(category){
	
	var functionName = 'DashboardData';
	var args = 	[
					
				];
	console.log(args);


	return transactionUtils.prepareQuery(functionName,args);
}