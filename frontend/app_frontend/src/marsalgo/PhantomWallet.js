import {
    Connection,
    PublicKey,
    Transaction,
    clusterApiUrl,
    SystemProgram
} from "@solana/web3.js";
import axios from 'axios';
import config from './config/default.json';
import Wallet from '@project-serum/sol-wallet-adapter';

/**
 * These two are reused to save time
 */
var provider, connection;

export const WALLET_CONN_STATE_no_extension = "no extension";
export const WALLET_CONN_STATE_no_wallet_imported = "no wallet_imported";
export const WALLET_CONN_STATE_ok = "ok";
export const WALLET_CONN_STATE_canceled = "canceled";
export const WALLET_CONN_STATE_disconnected = "disconnected";
export const WALLET_CONN_STATE_not_selected = "wallet not selected";
export const WALLET_CONN_STATE_sys_error= "system error";

export const WALLET_TYPE_Phantom = "Phantom";
export const WALLET_TYPE_Solflare = "Solflare";
export const WALLET_TYPE_Sollet_web = "Sollet Web";
export const WALLET_TYPE_Sollet_extension = "Sollet Extension";

export const MINT_STATE_ok = "ok";
export const MINT_STATE_sold_out = "sold out";
export const MINT_STATE_sys_error = "sys error";
export const MINT_STATE_canceled = "canceled";
export const MINT_STATE_insufficient_balance = "insufficient_balance";
export const MINT_STATE_nft_not_enough = "not enough NFT";

export const DIALOG_STYLE_TITLE = { backgroundColor: '#1c1d20', color:'#fafafa', textAlign:'center', fontSize:'22px' };
export const DIALOG_STYLE_CONTENT = { backgroundColor: '#2c2d30', color:'#fafafa' };

export const WHITELIST_STATE_NOT_IN_LIST="NOT IN LIST";
export const WHITELIST_STATE_OK="OK";
export const WHITELIST_STATE_EXCEEDING_LIMIT="EXCEEDING_LIMIT";
export const WHITELIST_STATE_SYSTEM_ERROR="SYSTEM_ERROR";

/**
 * Connect to Solana network
 */
 const connectNetwork=()=>{
    connection = new Connection(
        clusterApiUrl(config.NETWORK),
        'finalized',
    );
}

/**
 * Get a buyer wallet's balance
 * @returns 
 */
export const get_balance = async ()=>{
    if(!connection){
        connectNetwork();
    }
    if(!provider || !provider.publicKey || !connection){
        return {ok:false}
    }else{
        let balance = await connection.getBalance(provider.publicKey, 'finalized');
        return {ok:true, balance:balance}
    }
}

/**
 * Get the buyer wallet's current active address
 * @returns 
 */
export const get_current_address = async ()=>{
    if(!provider || !provider.publicKey || !connection){
        return {ok:false}
    }else{
        let balance = await connection.getBalance(provider.publicKey, 'finalized');
        return {ok:true, address:provider.publicKey+""}
    }
}

/**
 * Determine how many NFTs are available for sale, it's only a reference number, because
 * there might be multiples buyers online at the same time.
 * @returns { left: left }
 */
 export const get_available_nfts = async ()=>{
    let res = await axios.post(config.backend_endpoint_base+`availableNFTs`,{});
    return res.data;
}

export const get_available_nfts_pass = async (quantityHero, quantityVillain, wallet)=>{
    let res = await axios.post(config.backend_endpoint_base+`availableNFTs_pass`,{quantityHero: quantityHero, quantityVillain: quantityVillain, wallet: wallet});
    return res.data;
}

export const mckenna_set_stage = async (stage)=>{
    let res = await axios.post(config.backend_endpoint_base+`mckenna_set_stage`,{stage: stage});
    return res.data;
}

export const mint_pass = async (quantityHero, quantityVillain) => {
    if(!connection){
        connectNetwork();
    }
    try{
        // 3. Call the back end to mint
        let body={
            quantityHero: quantityHero,
            quantityVillain: quantityVillain
        };
        let rtn = await axios.post(config.backend_endpoint_base+`mint_pass`,body);
        console.log("mint rtn=========="+JSON.stringify(rtn.data));
        return rtn.data;
    }catch(e1){
        console.log("e1=========="+e1);
        return {state: MINT_STATE_sys_error};
    }
}

/**
 * This will mit NFTs, but not transfered to the buyer.
 * This should be used in combination with the function 'transaction_all_in_one'
 * as one process of handling the event of clicking on the 'Mint' button on the GUI
 * as used in src/marsalog/buy_board/index.js. These minted NFTs can't be sold to others,
 * they are locked up.
 * @param {*} quantity, number of NFTs to mint
 * @returns An object with two properties {state, tokens}, 'tokens' is an array of objects with properties: tokenAddres, tokenAccountAddress, index, rarity
 */
export const mint = async (quantity) => {
    if(!connection){
        connectNetwork();
    }
    try{
        // 3. Call the back end to mint
        let body={
            quantity: quantity
        };
        let rtn = await axios.post(config.backend_endpoint_base+`mint3`,body);
        console.log("mint rtn=========="+JSON.stringify(rtn.data));
        return rtn.data;
    }catch(e1){
        console.log("e1=========="+e1);
        return {state: MINT_STATE_sys_error};
    }
}

const FINAL_PRICE_STATE_ok="ok";
const FINAL_PRICE_STATE_sys_err="sys err";
const func_final_price = async(buyerWalletAddress, index, stage)=>{
    let body={
        buyerWalletAddress: buyerWalletAddress, 
        index: index,
        stage: stage
    };
    let rtn = await axios.post(config.backend_endpoint_base+`final_price_mckenna`,body);
    console.log("final_price===", JSON.stringify(rtn.data));
    console.log("final_price===", rtn.data.final_price);
    console.log("final_price===", rtn.data["final_price"]);
    return rtn.data.final_price;
}

export const getAffiliatorWallet=()=>{
    let affiliatorWallet = undefined;
    const pathname = window.location.href ;
    const sa1 = pathname.split("#");
    for(var i=0; i<sa1.length; i++){
        const sa2 = sa1[i].split("=");
        if(sa2[0]==KEY_AFFILIATE){
            affiliatorWallet=sa2[1];
            break;
        }
    }
    console.log("affiliatorWallet===", affiliatorWallet);
    return affiliatorWallet;
}

/**
 * This will really execute the whole transaction, trasfering SOLs and NFTs.
 * @param {*} buyerWallet , the buyer's wallet
 * @param {*} quantity , the nubmer of NFTs the buyer wants to buy
 * @param {*} price , unit price of NFT
 * @param {*} tokens , an array of tokens that have been minted but not transfered
 * @returns 
 */
const KEY_AFFILIATE = "affiliate_wallet";
export const transaction_all_in_one_mckenna=async(buyerWallet, quantity, price, tokens, stage)=>{
    // 0. Get affiliate address
    let affiliatorWallet = getAffiliatorWallet();
    console.log("tokens[0].=================",JSON.stringify(tokens[0]));
    let var_final_price=await func_final_price(buyerWallet, tokens[0].index, stage);
    let total_amount= var_final_price * quantity;
    console.log("final_price=x==", var_final_price);
    console.log("quantity=x==", quantity);

    const transaction = await createTransferTransaction(total_amount);
    let signed = null;
    try{
        // 2. Ask for the buyer's approval
        signed = await provider.signTransaction(transaction);
        if(!signed){
            return {state: MINT_STATE_canceled};
        }

        // 3. Call the back end to execute the whole transaction 
        let body={
            buyerWalletAddress: buyerWallet, 
            total_amount: total_amount,
            signedObj: signed.serialize(),
            tokens: tokens,
            affiliatorWallet: affiliatorWallet,
            stage: stage
        };
        console.log("total_amount=========="+total_amount);
        let rtn = await axios.post(config.backend_endpoint_base+`transaction_all_in_one_mckenna`,body);
        return rtn.data;
    }catch(e1){
        console.log("e1=========="+e1);
        return {state: MINT_STATE_canceled};
    }
}

export const count_minted = async () => {
    let rtn = await axios.post(config.backend_endpoint_base+`count_minted`,{});
    return rtn.data;
}

export const disconnect_wallet = async () => {
    if(provider && provider.isConnected){
        provider.disconnect();
        provider = undefined;
    }
}

/**
 * Connect buyers' wallet
 *    wallet_type: wallet type, one of the values of WALLET_TYPE_*
 *  from_selector: indicate if this func is called from the Wallet Selector
 * wallet_callbck: a function that is called after a wallet is selected or minting is finished to 
 *                 refresh the number of available NFTs and the buyer wallet balance
 */
export const connect_to_wallet = async (wallet_type, from_selector, wallet_callback) => {
    if(!wallet_type){
        if(from_selector){
            return {state: WALLET_CONN_STATE_canceled};
        }else{
            return {state: WALLET_CONN_STATE_not_selected};
        }
    }
    let tmp = undefined;
    if(wallet_type == WALLET_TYPE_Phantom && window.solana && window.solana.isPhantom){
        tmp = window.solana;
    }else if (wallet_type == WALLET_TYPE_Solflare && window.solflare && window.solflare.isSolflare){
        let providerUrl = 'https://solflare.com/provider';
        tmp = new Wallet(providerUrl);
    }else if (wallet_type == WALLET_TYPE_Sollet_web && window.sollet){
        let providerUrl = 'https://www.sollet.io';
        tmp = new Wallet(providerUrl);
    }else if (wallet_type == WALLET_TYPE_Sollet_extension && window.sollet){
        let providerUrl = window.sollet;
        tmp = new Wallet(providerUrl);
    }else{
        return {
            state: WALLET_CONN_STATE_no_extension
        }
    }

    tmp.on("connect", (d, g) => {
        provider = tmp;
        console.log(provider.publicKey+"============connected");
        wallet_callback(provider.publicKey+"", provider);
    });
    tmp.on("disconnect", (d, g) => {
        console.log("=============disconnected");
        return {
            state: WALLET_CONN_STATE_disconnected
        }
    });

    try{
        await tmp.connect();
    }catch(err){
        return {state:WALLET_CONN_STATE_sys_error}
    }

    await new Promise(r=>setTimeout(r, 3000));

    if(tmp.isConnected){
        provider = tmp;
    }
    if(tmp && provider && provider.publicKey){
        return {
            state: WALLET_CONN_STATE_ok,
            address: provider.publicKey+""
        };
    }else{
        return {
            state: WALLET_CONN_STATE_no_wallet_imported
        };
    }
}

/**
 * Create a transaction for transfering SOL from the buyer to the website owner
 * @param {*} sol 
 * @returns 
 */
const createTransferTransaction = async (sol) => {
    if (!provider || !provider.publicKey) {
        connect_to_wallet();
        await new Promise(r => setTimeout(r, 3000));
    }

    if(!connection){
        connectNetwork();
    }

    const myPubKey = new PublicKey(config.MY_PUBLIC_KEY);
    let transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: myPubKey,
            lamports: sol*1000000000
        })
    );
    transaction.feePayer = provider.publicKey;
    transaction.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    return transaction;
};

/**
 * It's possible that a buyer pressed the 'Cancel' button in Phantom, in such a case
 * so we have to release the NFTs that have been locked up so as to be ready for sale again.
 * @param {*} tokens , the NFTs that have been minted
 * @returns 
 */
export const compensate = async (tokens) => {
    let body = {
        tokens:tokens
    }
    let res = await axios.post(config.backend_endpoint_base+`compensate_mckenna`,body);
    return {state: MINT_STATE_canceled};
}

export const mckenna_get_stage = async () =>{
    let res = await axios.post(config.backend_endpoint_base+`mckenna_get_stage`,{});
    console.log("mckenna_get_stage===", JSON.stringify(res.data));
    return res.data;
}

/**
 * Determine if a wallet is in whitelist and if the quantity is exceeding the limit
 * @param {*} address , the buyer's wallet address
 * @param {*} quantity , the quantity of NFTs the buyer wants to buy
 * @returns {state: WHITELIST_STATE_*}
 */
export const is_in_whitelist = async (address, quantity) =>{
    let body = {
        address:address,
        quantity:quantity
    }
    console.log("check is_in_whitelist, address="+address+", quantity="+quantity);
    let res = await axios.post(config.backend_endpoint_base+`is_in_whitelist`,body);
    console.log("check is_in_whitelist, return="+res.data);
    return res.data;
}

const STATE_UPDATE_METADATA_OK="OK";
const STATE_UPDATE_METADATA_SYSTEM_ERROR="SYSTEM_ERROR";
/**
 * 
 * @param {*} name , new name of the NFT to be updated
 * @param {*} address , the address of the NFT to be updated
 * @param {*} uri  , the metadata JSON URI of the NFT to be updated
 * @returns {state: STATE_UPDATE_METADATA_*}
 */
export const update_metadata = async (name, address, uri) => {
    let body = {
        name: name,
        address:address,
        uri:uri
    }
    let res = await axios.post(config.backend_endpoint_base+`update_metadata`,body);
    return res.data;
}