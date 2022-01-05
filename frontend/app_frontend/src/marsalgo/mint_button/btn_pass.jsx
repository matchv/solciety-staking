import React, { useState, useEffect } from "react";
import '../../css/main.css';
import config from '../config/default.json';
import MessageWindow from '../msgwin';
import ProgressWindow from '../progress';
import {
    connect_to_wallet,
    get_current_address,
    mint_pass,
    get_available_nfts_pass,
    get_balance,
    transaction_all_in_one_mckenna,
    compensate,
    is_in_whitelist,
    count_minted,
    mckenna_get_stage,
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
const STAGE_PASS="PASS";
const STAGE_PRESALE="PRESALE";
const STAGE_MAIN="MAIN";

const AVAIL_STATE_INSUFFICIENT = "INSUFFICIENT";
const AVAIL_STATE_LIMIT_EXCEEDED = "LIMIT_EXCEEDED";
const AVAIL_STATE_OK = "OK";
const STAGE_STATE_START = 'START';
const STAGE_STATE_END ='END';
const STAGE_STATE_NOT_LAUNCHED ='NOT_LAUNCHED';

const MINT_CATEGORY_HeroPass = "HeroPass";
const MINT_CATEGORY_VillainPass = "VillainPass";
const MINT_CATEGORY_Others = "Others";
export default function MintButton(props) {
    const { quantityHero, quantityVillain, address, amount_total, balance, walletType, setAvailable_nft, setBalance } = props;
    
    const [link, setLink] = React.useState("");
    const [msg, setMsg] = React.useState("");
    const [openMsgwin, setOpenMsgwin] = React.useState(false);
    const [ready, setReady] = React.useState(false);
    const [tokens, setTokens] = React.useState(undefined);
    const [openProgress, setOpenProgress] = React.useState(false);
    const [progressText, setProgressText] = React.useState("");
    const [stage, setStage] = React.useState("");

    const onMint = () => {
        console.log("address====1=========", address);
        if(!address || address == undefined || address == null){
            setMsg("Sorry, looks like the wallet is not connected.");
            setLink(undefined);
            setReady(false);
            setOpenMsgwin(true);
            return;
        }

        if (quantityHero + quantityVillain == 0) {
            setMsg("Sorry, the quantity must be larger than zero.");
            setLink(undefined);
            setReady(false);
            setOpenMsgwin(true);
            return;
        }

        if (amount_total > balance) {
            setMsg("Sorry, you don't have enough balance.");
            setLink(undefined);
            setReady(false);
            setOpenMsgwin(true);
            return;
        }

        (async () => {
            // Check stage
            let objStage = await mckenna_get_stage();
            console.log("Stage: ", JSON.stringify(objStage));
            if(objStage.state == STAGE_STATE_NOT_LAUNCHED){
                setMsg("This project has not been launchued yet, thanks for your visit!");
                setLink(undefined);
                setReady(false);
                setOpenMsgwin(true);
                return;
            }
            if(objStage.state == STAGE_STATE_END){
                if(objStage.stage == STAGE_PASS){
                    setMsg("Passes Sale has ended, Presale will come soon, thanks for your visit!");
                    setLink(undefined);
                    setReady(false);
                    setOpenMsgwin(true);
                    return;
                }else if(objStage.stage == STAGE_PRESALE){
                    setMsg("Presale has ended, Main Sale will come soon, thanks for your visit!");
                    setLink(undefined);
                    setReady(false);
                    setOpenMsgwin(true);
                    return;
                }else if(objStage.stage == STAGE_MAIN){
                    setMsg("Main Sale has ended, we'll launch new project come soon, thanks for your visit!");
                    setLink(undefined);
                    setReady(false);
                    setOpenMsgwin(true);
                    return;
                }
            }
            setStage(objStage.stage);

            let rtn = await get_current_address();
            let { ok, address } = rtn;

            console.log("objStage====2=========", JSON.stringify(objStage));
            console.log("objStage.stage====2=========", objStage.stage);
            console.log("stage====2=========", stage);
            console.log("address====2=========", address);
            let rtn3 = await get_available_nfts_pass(quantityHero, quantityVillain, address);
            console.log("rtn3==============", JSON.stringify(rtn3));
            setAvailable_nft(rtn3.left);
            if (rtn3.state != AVAIL_STATE_OK) {
                setMsg(rtn3.msg);
                setLink(undefined);
                setReady(false);
                setOpenMsgwin(true);
                return;
            }


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

    const MINT_STATE_mckenna_project_ended="project ended";
    const MINT_STATE_mckenna_no_enough_HeroPass="no enough HeroPass";
    const MINT_STATE_mckenna_no_enough_VillainPass="no enough VillainPass";
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
            let wait_seconds = 8*1000;
            // 3. Open progress window
            setOpenProgress(true);
            setTokens([]);

            // 4. Set the content of message window
            let quantity = quantityVillain + quantityHero;
            setProgressText(quantity + " NFTs are being minted...");

            // 5. Mint
            let rtn = await mint_pass(quantityHero, quantityVillain);
            if (rtn.state == MINT_STATE_canceled) {
                setOpenProgress(false);
                return;
            }

            // 6. Handle failure cases
            if (rtn.state == MINT_STATE_sold_out) {
                setProgressText("Unfortunately, all sold out!");
                await new Promise(r => setTimeout(r, wait_seconds));
                setOpenProgress(false);
                return;
            }

            if(rtn.state == MINT_STATE_mckenna_project_ended ||
                rtn.state == MINT_STATE_mckenna_no_enough_HeroPass ||
                rtn.state == MINT_STATE_mckenna_no_enough_VillainPass){
                setProgressText(rtn.msg);
                await new Promise(r => setTimeout(r, wait_seconds));
                setOpenProgress(false);
                return;
            }

            if (rtn.state == MINT_STATE_nft_not_enough) {
                setProgressText("Unfortunately, there are only " + rtn.left + " NFTs available, please adjust quantity.");
                await new Promise(r => setTimeout(r, wait_seconds));
                setOpenProgress(false);
                return;
            }

            if (!rtn.tokens || rtn.state != MINT_STATE_ok) {
                setProgressText("Sorry, unknow system error, please try again.");
                await new Promise(r => setTimeout(r, wait_seconds));
                setOpenProgress(false);
                return;
            }

            // 7. Handle successful case
            setTokens(rtn.tokens);
            setProgressText("Executing transactions...");
            console.log("stage====3=========", stage);
            let rtn4 = await transaction_all_in_one_mckenna(address, quantity, config.PRICE, rtn.tokens, stage);
            if (rtn4.state == MINT_STATE_ok) {
                setProgressText("Congratulations, " + rtn.tokens.length + "/" + quantity + " succeeded!");
                await new Promise(r => setTimeout(r, wait_seconds));
                setOpenProgress(false);
            } else if (rtn4.state == MINT_STATE_canceled) {
                await compensate(rtn.tokens);
                setOpenProgress(false);
            } else {
                setProgressText("Sorry, unknow system error, please try again.");
                await new Promise(r => setTimeout(r, wait_seconds));
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
                    let rtn3 = await get_available_nfts_pass(quantityHero, quantityVillain, address);
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