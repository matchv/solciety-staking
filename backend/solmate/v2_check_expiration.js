const { SystemProgram, Message, clusterApiUrl, Keypair, Account, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } = require("@solana/web3.js");

const { config } = require('./v2_config');
const host_wallet = require('./host_wallet.json');

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const secretKey = Buffer.from(host_wallet)
const initAccount = Keypair.fromSecretKey(secretKey)

const STAKE_OK = 'OK'
const STAKE_ERR = 'ERR'

exports.v2_check_expiration = async (req, res) => {
    try {
        const { tx_wire } = req.body
        let tx = Transaction.from(tx_wire.data)
        tx.partialSign(initAccount)
        await connection.sendRawTransaction(tx.serialize())
        res.json({ state: STAKE_OK })
    } catch (err) {
        console.log('err==', err)
        res.json({ state: STAKE_ERR })
    }
}