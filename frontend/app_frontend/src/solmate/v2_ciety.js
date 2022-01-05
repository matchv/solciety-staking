import axios from 'axios';
import {config} from './v2_config';
import { Connection, programs } from '@metaplex/js';
import { PublicKey } from "@solana/web3.js";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {read_config} from './v2_inspector';

const { metadata: { Metadata } } = programs;
const connection = new Connection('devnet');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export async function list() {
    let config_dm = await read_config();
    let pubkey_ciety_mint = new PublicKey(config_dm.ciety_mint_pubkey);
    let token_program_pubkey = new PublicKey(config.token_program_addr)
    let escrow_pda = await PublicKey.findProgramAddress([Buffer.from(config_dm.seed_pda_ciety), pubkey_ciety_mint.toBuffer()], token_program_pubkey);
    let body = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTokenAccountsByOwner",
        "params": [
            escrow_pda[0].toString(),
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
        let owner = asset.account.data.parsed.info.owner;
        let am = asset.account.data.parsed.info.tokenAmount;
        if (mint.toString()==pubkey_ciety_mint.toString()) {
            rtn.push({ account: account, mint: mint, owner:owner, amount:am })
        }
    })
    
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

            
        }catch(err){
            console.log('err==', err)
        }
    }

    return rtn[0]
}
