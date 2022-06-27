"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
//simple blockchain implementation
//it should contain, four main function
//Transaction, Block, Chain, Wallet
//transfer funds from one user to another user
//a transaction object must have three properties
//amount, payer, payee 
class Transaction {
    //initially setting public key for users
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    //to make cryptographic objects easier to work with
    toString() {
        return JSON.stringify(this);
    }
}
//A block is a container for multiple transaction
//Block is like an element in an array or more like a linkedlist
//here implementing for a single transaction
class Block {
    //as a block contains hash of previous block
    //hash connot reconstruct a value, can compare values
    constructor(prevHash, transaction, 
    //a timestamp, because all blocks will be placed in chronological order
    ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        //adding a nonce value for mining
        this.nonce = Math.round(Math.random() * 999999999);
    }
    //implementing a getter to stringifly the object
    //then using createHash
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
//linkedlist of block
class Chain {
    //constructor for defining the fisrt block of the chain,
    //THE GENESIS BLOCK
    constructor() {
        //instanciating a transaction , transferring 1729 coins to dungeon
        this.chain = [new Block('', new Transaction(1729, 'genesis', 'dungeon'))];
    }
    //getting the last block
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    //mine menthod attempt to find a number
    //that when added to the nonce
    //will produce a hash that starts with 0000
    mine(nonce) {
        let solution = 1;
        console.log('mining...');
        //the only way to figure out that value is by brute force
        //by creating a while loop that goes digit by digit
        //until we find the requested number
        while (true) {
            //so a while loop that creates a hash with the MD5 algorithm
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 4) === '000') {
                console.log(`solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
    //method to add a block
    addBlock(transaction, senderPublicKey, signature) {
        //preventing anybody to do a invalid transaction
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        //now if verified, adding transaction to block
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            //for mining
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}
//as we are creating only one blockchain
//so making a SINGLETON INSTANCE by setting up a static instance property
//which is equal to a new chain instance
Chain.instance = new Chain();
//a wallet, simply a wrapper for a puluc key and a pric=vate key
class Wallet {
    //using RSA to generating a public key and a private key
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pksc8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        //it's like a onetimepassword, signing with private key without revealing private key
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
// Example usage
const dungeon = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
dungeon.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);
console.log(Chain.instance);
