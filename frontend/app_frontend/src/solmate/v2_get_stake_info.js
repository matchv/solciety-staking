import { read_pwdm } from "./v2_inspector";
import axios from 'axios';
import { PublicKey } from "@solana/web3.js";
import { Connection as MetaConnection, programs } from '@metaplex/js';
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const { metadata: { Metadata } } = programs;
const connection = new MetaConnection('devnet');

export const v2_get_stake_info = async (staker_wallet) => {
    let pwdm = await read_pwdm(staker_wallet)
    for (var i = 0; i < pwdm.repeated.length; i++) {
        let repeated = pwdm.repeated[i]
        let mint_pubkey = new PublicKey(repeated.nft_mint)
        const token = new Token(connection, mint_pubkey, TOKEN_PROGRAM_ID);
        let mint_info = await token.getMintInfo();
        repeated['mintAuthority'] = mint_info.mintAuthority.toBase58();

        let metadata_account_pubkey = (await PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint_pubkey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )
        )[0];

        const resp = await Metadata.load(connection, metadata_account_pubkey);
        const { data } = await axios.get(resp.data.data.uri);
        repeated['metadata'] = data;
    }
    return pwdm;
}