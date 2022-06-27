import * as crypto from 'crypto';
import { json } from 'stream/consumers';

//simple blockchain implementation
//it should contain, four main function
//Transaction, Block, Chain, Wallet

//transfer funds from one user to another user
//a transaction object must have three properties
//amount, payer, payee 
class Transaction{
    //initially setting public key for users
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ){}
    
    //to make cryptographic objects easier to work with
    toString() {
        return JSON.stringify(this);
    }

}

//A block is a container for multiple transaction
//Block is like an element in an array or more like a linkedlist
//here implementing for a single transaction
class Block{
    //adding a nonce value for mining
    public nonce = Math.round(Math.random() * 999999999);

    //as a block contains hash of previous block
    //hash connot reconstruct a value, can compare values
    constructor(
        public prevHash: string,
        public transaction: Transaction,
        //a timestamp, because all blocks will be placed in chronological order
        public ts = Date.now()
    ){}

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
class Chain{
    //as we are creating only one blockchain
    //so making a SINGLETON INSTANCE by setting up a static instance property
    //which is equal to a new chain instance
    public static instance = new Chain();

    chain: Block[];

    //constructor for defining the fisrt block of the chain,
    //THE GENESIS BLOCK
    constructor() {
        //instanciating a transaction , transferring 1729 coins to dungeon
        this.chain = [new Block('', new Transaction(1729, 'genesis', 'dungeon'))]
    }

    //getting the last block
    get lastBlock() {
        return this.chain[this.chain.length -1];
    }

    //mine menthod attempt to find a number
    //that when added to the nonce
    //will produce a hash that starts with 0000
    mine(nonce: number) {
        let solution = 1;
        console.log('mining...')

        //the only way to figure out that value is by brute force
        //by creating a while loop that goes digit by digit
        //until we find the requested number
        while(true) {
            //so a while loop that creates a hash with the MD5 algorithm
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substr(0,4) === '000') {
                console.log(`solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }

    }

    //method to add a block
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        //preventing anybody to do a invalid transaction
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        //now if verified, adding transaction to block
        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            
            //for mining
            this.mine(newBlock.nonce);

            this.chain.push(newBlock);
        }
        
    }

}

//a wallet, simply a wrapper for a puluc key and a pric=vate key
class Wallet{
    public publicKey: string;
    public privateKey: string;

    //using RSA to generating a public key and a private key
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pksc8', format: 'pem'},
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
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

console.log(Chain.instance)