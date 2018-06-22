'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/



var transactionUtils = require('../utility/transaction_utils');

//uniqid generates random ids based on mac address, process id and timestamp
const uniqid = require('uniqid');

//Register a new user
module.exports.createUser = function(user){
	let user_id = uniqid();
	let password = uniqid();
	var functionName = 'addUser';
	var args = [user.first_name
					, user.last_name
					, user.emp_id
					, user.country_code
					, user.phone_num
					, user.email
					, user.device_token
					, user_id
					, password];

	console.log(args);
	return transactionUtils.prepareInvokation(functionName,args);
}

//Login a user
module.exports.login = function(user){

	var functionName = 'login';
	var userType = 0;

	if(user.type != undefined){
		userType = user.type;
	}

	var args = [
				user.email
				, user.password
				, user.device_token
				, userType.toString()
				];


	return transactionUtils.prepareInvokation(functionName,args);
}

//Delete a user
module.exports.deleteUser = function(user){
	var functionName = 'changeDeleteStatus';
	var args = [user.id
				,"true"];


	return transactionUtils.prepareInvokation(functionName,args);
}

//List all the users
module.exports.listAllUsers = function(body){
	var functionName = 'listAllUsers'
	var args = new Array();

    if(body.field_type != undefined && body.sort_type != undefined){
        args.push(body.field_type.toString());
        args.push(body.sort_type.toString());
        
    }

	return transactionUtils.prepareQuery(functionName, args)
}

//List all the users
module.exports.getUser = function(user){
	var functionName = 'getUser'
	var args = [user.id]

	return transactionUtils.prepareQuery(functionName, args)
}

//Change user active, inactive status
module.exports.changeUserStatus = function(user){
	var functionName = 'changeUserStatus'
	var args = [
				user.id
				,user.user_status.toString()
				]

	return transactionUtils.prepareInvokation(functionName, args)
}

//Change user active, inactive status
module.exports.updateAdminProfile = function(req){
	var functionName = 'updateAdminProfile'
	var args = [
				req.user.id
				,req.body.first_name
				,req.body.last_name
				]

	return transactionUtils.prepareInvokation(functionName, args)
}

//Change the password of the user
module.exports.changePassword = function(user){
	var functionName = 'changePassword'
	var args = [
				user.id
				,user.old_password
				,user.new_password
				]

	return transactionUtils.prepareInvokation(functionName, args)

}

//Generates a new random passwords when user forgets his password 
module.exports.forgetPassword = function(user){
	let password = uniqid();
	var functionName = 'ForgetPassword'
	var args = [
				user.email,
				password
				]

	return transactionUtils.prepareInvokation(functionName, args)
}
