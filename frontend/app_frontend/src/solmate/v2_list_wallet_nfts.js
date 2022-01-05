import axios from 'axios';
import {config} from './v2_config';
import { Connection, programs } from '@metaplex/js';
import { PublicKey } from "@solana/web3.js";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const { metadata: { Metadata } } = programs;
const connection = new Connection('devnet');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");


export async function list(wallet) {
    let body = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTokenAccountsByOwner",
        "params": [
            wallet,
            {
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            },
            {
                "encoding": "jsonParsed"
            }
        ]
    }
    let resp = await axios.post(
        config.network_url, body
    );

    let rtn = []
    resp.data.result.value.map(asset => {
        let account = asset.pubkey;
        let mint = asset.account.data.parsed.info.mint;
        let am = asset.account.data.parsed.info.tokenAmount;
        if (am.amount == 1 && am.decimals == 0) {
            rtn.push({ account: account, mint: mint, selected:false })
        }
    })
    

    let rtn2 = []
    for(var i=0; i<rtn.length; i++){
        try{

            let mint = new PublicKey(rtn[i].mint);

            // while(true){
                const token = new Token(connection, mint, TOKEN_PROGRAM_ID);
                let mint_info = await token.getMintInfo();
                rtn[i]['mintAuthority']=mint_info.mintAuthority.toBase58();
                // if(mint_info.mintAuthority){
                //     break;
                // }else{
                //     await new Promise(f=>setTimeout(f,50));
                // }
            // }

            let metadata_account_pubkey = (await PublicKey.findProgramAddress(
                [
                  Buffer.from("metadata"),
                  TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                  mint.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID
              )
            )[0];

            const resp = await Metadata.load(connection, metadata_account_pubkey);
            const { data } = await axios.get(resp.data.data.uri);
            rtn[i]['metadata']=data;
            rtn2.push( rtn[i]);
        }catch(err){
            console.log('err==', err)
        }
    }

    return rtn2
}
