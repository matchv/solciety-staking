const { SystemProgram, Message, clusterApiUrl, Keypair, Account, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { AccountLayout, Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const BN = require('bn.js');
const fs = require('fs');
const bs58 = require('bs58');

const { CONFIG_ACCOUNT_DATA_LAYOUT } = require("./layout");
const { config } = require('./config');
const host_wallet = require('./host_wallet.json');

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const secretKey = Buffer.from(host_wallet)
const initAccount = Keypair.fromSecretKey(secretKey)

const STAKE_OK ='OK'
const STAKE_ERR = 'ERR'

exports.reward = async (req, res) => {
    try{
        const {tx_wire} = req.body

        // console.log('serialized_msg==', serialized_msg)
        // let msg = Message.from(serialized_msg.data)
        // console.log('signatures==', signatures)
        
        // let sgs = []
        // signatures.map(a=>{
        //     if(a.signature){
        //         sgs.push(bs58.encode(a.signature.data))
        //     }
        // })
        // console.log('sgs==', sgs)
        // let tx = Transaction.populate(msg, sgs)
        // tx.partialSign(initAccount)
        console.log('tx_wire==', tx_wire)
        let tx = Transaction.from(tx_wire.data)
        tx.partialSign(initAccount)
        // tx.sign(initAccount)
        // tx_wire.partialSign(initAccount)
        // tx_wire = Transaction.serialize(tx)
        // let signature = await connection.sendRawTransaction(tx_wire)
        // await connection.confirmTransaction(signature);

        // await connection.sendTransaction(tx, [], { skipPreflight: false, preflightCommitment: 'confirmed' })
        await connection.sendRawTransaction(tx.serialize())
        res.json({state: STAKE_OK})
    }catch(err){
        console.log('err==', err)
        res.json({state: STAKE_ERR})
    }
}