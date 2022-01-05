import React, { useState, useEffect } from "react";
import '../../css/main.css';
import config from '../config/default.json';
import MessageWindow from '../msgwin';
import ProgressWindow from '../progress';
import {
    connect_to_wallet,
    get_current_address,
    mint,
    get_available_nfts,
    get_balance,
    transaction_all_in_one_mckenna,
    compensate,
    is_in_whitelist,
    count_minted,
    MINT_STATE_sold_out,
    MINT_STATE_canceled,
    MINT_STATE_ok,
    MINT_STATE_sys_error,
    MINT_STATE_nft_not_enough,
    WHITELIST_STATE_NOT_IN_LIST,
    WHITELIST_STATE_OK,
    WHITELIST_STATE_EXCEEDING_LIMIT,
    WHITELIST_STATE_SYSTEM_ERROR,
} from 'marsalgo/PhantomWallet';

export default function MintButton(props) {
    const { quantity, address, amount_total, balance, walletType, setAvailable_nft, setBalance  } = props;
    
    const [link, setLink] = React.useState("");
    const [msg, setMsg] = React.useState("");
    const [openMsgwin, setOpenMsgwin] = React.useState(false);
    const [ready, setReady] = React.useState(false);
    const [tokens, setTokens] = React.useState(undefined);
    const [openProgress, setOpenProgress] = React.useState(false);
    const [progressText, setProgressText] = React.useState("");


    const onMint = () => {
        if(!address){
            setMsg("Sorry, looks like the wallet is not connected.");
            setLink(undefined);
            setReady(false);
            setOpenMsgwin(true);
            return;
        }

        if (quantity == 0) {
            setMsg("Sorry, the quantity must be larger than zero.");
            setLink(undefined);
            setReady(false);
            setOpenMsgwin(true);
            return;
        }

        if (amount_total > balance + 0.03) {
            setMsg("Sorry, you don't have enough balance.");
            setLink(undefined);
            setReady(false);
            setOpenMsgwin(true);
            return;
        }

        (async () => {
            let rtn3 = await get_available_nfts();
            setAvailable_nft(rtn3.left);
            if (rtn3.left < quantity) {
                setMsg("Sorry, there is no enough NFTs for sale, only " + rtn3.left + " are available.");
                setLink(undefined);
                setReady(false);
                setOpenMsgwin(true);
                return;
            }


            let rtn = await get_current_address();
            let { ok, address } = rtn;

            if (ok) {
                let m = "it's always better to do double check by double clik on Mint button, make it clear what address you are going to use, this should be the same as the active address in your " + walletType + " wallet."
                setMsg("Wallet " + walletType + " is connected, the address is: " + address + ", " + m);
                setLink(undefined);
                setReady(true);
                setOpenMsgwin(true);
            } else {
                setMsg("Your wallet may not be installed or connected, please install or try again, don't forget import or create your wallet after installing.");
                setLink(undefined);
                setReady(false);
                setOpenMsgwin(true);
            }
        })()
    }

    /**
     * Handle the close event of message window popped up by clicking Mint button.
     * @param {*} canceled 
     * @param {*} address 
     * @returns 
     */
    const handleClose = (canceled, address) => {
        // 1. Close message window
        setOpenMsgwin(false);

        // 2. Canceled
        if (canceled) return;

        (async () => {
            // 3. Open progress window
            setOpenProgress(true);
            setTokens([]);

            // 4. Set the content of message window
            setProgressText(quantity + " NFTs are being minted...");

            // 5. Mint
            let rtn = await mint(quantity);
            if (rtn.state == MINT_STATE_canceled) {
                setOpenProgress(false);
                return;
            }

            // 6. Handle failure cases
            if (rtn.state == MINT_STATE_sold_out) {
                setProgressText("Unfortunately, all sold out!");
                await new Promise(r => setTimeout(r, 3000));
                setOpenProgress(false);
                return;
            }

            if (rtn.state == MINT_STATE_nft_not_enough) {
                setProgressText("Unfortunately, there are only " + rtn.left + " NFTs available, please adjust quantity.");
                await new Promise(r => setTimeout(r, 3000));
                setOpenProgress(false);
                return;
            }

            if (!rtn.tokens || rtn.state != MINT_STATE_ok) {
                setProgressText("Sorry, unknow system error, please try again.");
                await new Promise(r => setTimeout(r, 3000));
                setOpenProgress(false);
                return;
            }

            // 7. Handle successful case
            setTokens(rtn.tokens);
            setProgressText("Executing transactions...");
            let rtn4 = await transaction_all_in_one_mckenna(address, quantity, config.PRICE, rtn.tokens);
            if (rtn4.state == MINT_STATE_ok) {
                setProgressText("Congratulations, " + rtn.tokens.length + "/" + quantity + " succeeded!");
                await new Promise(r => setTimeout(r, 3000));
                setOpenProgress(false);
            } else if (rtn4.state == MINT_STATE_canceled) {
                await compensate(rtn.tokens);
                setOpenProgress(false);
            } else {
                setProgressText("Sorry, unknow system error, please try again.");
                await new Promise(r => setTimeout(r, 3000));
                setOpenProgress(false);
                return;
            }

            // 8. Refresh available nft and balance
            await connect_to_wallet(walletType, true, (address) => {
                (async () => {
                    let rtn2 = await get_balance();
                    if (rtn2.ok) {
                        setBalance(rtn2.balance / 1000000000);
                    } else {

                    }
                    let rtn3 = await get_available_nfts();
                    setAvailable_nft(rtn3.left);
                })()
            });
        })()
    }
    return (
        <div>
            {/* style={{marginTop:'13px', width:'270px'}} */}
            <div >
                <button className="button form-details-own-button" onClick={onMint}>MINT</button>
            </div>

            <MessageWindow keepMounted address={address} open={openMsgwin} msg={msg} link={link} handleClose={handleClose} ready={ready} />
            <ProgressWindow
                keepMounted
                open={openProgress}
                tokens={tokens}
                progressText={progressText}
            />
        </div>
    );
}