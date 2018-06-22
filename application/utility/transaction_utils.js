

var Fabric_Client = require('fabric-client');
var path = require('path');
var network = require('../Controllers/NetworkController');
const config = require('../../configuration/config')

var store_path = 'hfc-key-store';
var Fabric_CA_Client = require('fabric-ca-client');
var fabric_ca_client = null;

//This is the name of the Chaincode 
var chaincodeName = "assetchaincode";

//This is the name of our channel
var channelName = "assetchain";

var fabric_client = new Fabric_Client();
var channel = fabric_client.newChannel(channelName);

var peer0;
var peer1;
var peer2;

if(config.network_type == 0){
    //docker
    peer0 = fabric_client.newPeer('grpc://localhost:7051');
    peer1 = fabric_client.newPeer('grpc://localhost:8051');
    channel.addPeer(peer0);
    channel.addPeer(peer1);

    var order1 = fabric_client.newOrderer('grpc://localhost:7050')
    channel.addOrderer(order1);
}else{
    //main physical network

    peer0 = fabric_client.newPeer('grpc://peer0.debutinfotech.com:7051');
    peer1 = fabric_client.newPeer('grpc://peer1.debutinfotech.com:7051');
    peer2 = fabric_client.newPeer('grpc://peer2.debutinfotech.com:7051');

    channel.addPeer(peer0);
    channel.addPeer(peer1);
    channel.addPeer(peer2);

    var order1 = fabric_client.newOrderer('grpc://firstorderer.debutinfotech.com:7050')
    var order2 = fabric_client.newOrderer('grpc://secondorderer.debutinfotech.com:7050')

    channel.addOrderer(order1);
    channel.addOrderer(order2);
}



/*This function will create a new transaction in our blockchain.
  This function will be used by all our invokation requests on the blockchain
*/
module.exports.prepareInvokation = function(functionName, args){

    return new Promise((resolve, reject) =>{

        var tx_id = null;
        var res;
        userContext().then((obj) =>{

            tx_id = fabric_client.newTransactionID();

            var request = {
                chaincodeId:chaincodeName,
                fcn: functionName,
                args: args,
                chainId: channelName,
                txId: tx_id
            };

            log("Proposal request for peer has been created. Request ==> " + request)

            return obj.channel.sendTransactionProposal(request);
        }).then((results)=>{

            var proposalResponse = results[0];
            var proposal = results[1];
            let isProposalGood = false;

            if(proposalResponse
                && proposalResponse[0].response
                && proposalResponse[0].response.status === 200){
                    isProposalGood = true;
                    log("Proposal request was ok and is accepted by peer")
                    //get payload from proposal response
                    res = JSON.parse(proposalResponse[0].response.payload.toString());

                    log("Got response for our request. Response ==> "+res)
                    res.event_status = 'VALID'
                    

                }else{
                    // log("Proposal was rejected by peer ==> "+proposalResponse[0])
                    // log("Payload ==>" + proposalResponse[0].response.payload.toString())
                    reject(createErrorResponse(proposalResponse[0].details,500))
                    return
                }

                if(isProposalGood){

                //Now this we will create a request for orderer so that orderer can
                //commit the transaction to ledger
				var request = {
					proposalResponses: proposalResponse,
					proposal: proposal
                };

                var transaction_id_string = tx_id.getTransactionID();
                var promises = [];

                var sendPromise = channel.sendTransaction(request);
                promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

                // get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
                let event_hub = fabric_client.newEventHub();
                
                var eventHubAddress = (config.network_type == 0)
                                        ? 'grpc://localhost:7053' 
                                        : 'grpc://peer0.debutinfotech.com:7053';

                event_hub.setPeerAddr(eventHubAddress);

                let transactionPromise = new Promise((resolve, reject) =>{
                    let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                    }, 8000);

                    event_hub.connect();
                    event_hub.registerTxEvent(transaction_id_string,(tx,code) =>{

                        // this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
                        event_hub.disconnect();
                        
                        if (code !== 'VALID'){
                            log("Transaction request passed to orderer was not valid. code ==> "+ code+ " Transaction  ==> " + tx)
                            var return_status = createErrorResponse("Transaction was not valid", 500);
                            return_status.tx_id = transaction_id_string
                            reject(return_status)
                            return
                        }

                        var return_status = {event_status : code, tx_id : transaction_id_string, response: res};

                        resolve(return_status)

                    }, (err) =>{
                        log("There was some error with event hub. Error ==> " +err)
                        reject(createErrorResponse(err.message, 500));
                        return
                    });
                });

                promises.push(transactionPromise);

                
                setTimeout(emitBlockInfo,4000);
                return Promise.all(promises)

                }

        }).then((promises_result) =>{
            if(!promises_result
                || !promises_result[0]
                || promises_result[0].status !== 'SUCCESS'){
                log("Could not send the proposal to orderer. Promise result ==> " + promises_result[0])
                reject(createErrorResponse("Could not send the proposal to orderer.", 500))
                return
            }

            if(promises_result
                && promises_result[1]
                && promises_result[1].event_status === 'VALID') {
                log("The promise result for orderer was valid. Promise result ==> " + promises_result[0])
				resolve(promises_result[1].response);
            }
            
            

        }).catch((err) => {
            log("There was an error in catch block ==> " + err)
            reject(createErrorResponse(err.message, 500))
        })
    });
}

//This function wil generate an event when a block will be added
function emitBlockInfo(){
    var io = global.socket_io;
    network.chaininfo().then(function(queRes){
        io.emit("block_added",queRes);
      }).catch(function(err){
        console.error("Error while fetching block height ==> " + err)
      });
}


/**
 * This function will create an error message response
 * @param {String} message: Message will be a plain text
 * @param {Number} httpStatus : This will be a http response code
 */
function createErrorResponse(message, httpStatus){
    return {status: 0, http_status: httpStatus, message: message}
}

/**
 * This function will print a log
 * @param {String} message 
 */
function log(message){
    console.log("\n*****************************************************************")
    console.log(message)
    console.log("*****************************************************************\n")
}

//This function will use the chaincode to query by passing a request and return a response
module.exports.prepareQuery = function(functionName, args){
    return new Promise((resolve, reject) =>{

        var tx_id = null;

        userContext().then((obj) =>{

            tx_id = fabric_client.newTransactionID();

            const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: chaincodeName,
                fcn: functionName,
                args: args
            };


            log("Proposal request for peer has been created. Request ==> " + request)

            return obj.channel.queryByChaincode(request);
        }).then((query_responses)=>{


            if (query_responses && query_responses.length > 0) {
                if (query_responses[0] instanceof Error) {
                    console.error("error from query = ", query_responses[0]);
                    reject(createErrorResponse(query_responses[0].details,500))
                } else {
                    console.log("Response is ", query_responses[0].toString());
                    var res = JSON.parse(query_responses[0].toString());
                    res.event_status = 'VALID'
                    resolve(res);
                }
            } else {
                console.log("No payloads were returned from query");
                reject(createErrorResponse("No payload returned",500))
            }
        }).catch((err) => {
            log("There was an error in catch block ==> " + err)
            reject(createErrorResponse(err.message, 500))
        })
    });
}

// This function will fetch user context.
var userContext = function(user = 'user1'){
    return new Promise((resolve, reject) => {

        Fabric_Client.newDefaultKeyValueStore({path: store_path})
        .then((state_store) =>{
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            var crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
            var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            return fabric_client.getUserContext(user, true);
        }).then((user_from_store)=>{

            if(user_from_store && user_from_store.isEnrolled()){
                log("User is loaded from persistence")
                resolve({client: fabric_client, channel: channel, peer: peer0})
            }else{
                reject(createErrorResponse(user +" is not enrolled. Please enroll a user first",
                        500))
            }

        }).catch((err) =>{
            reject(createErrorResponse(err.message,500))
        })
    });
}

module.exports.getUserContext = userContext;
