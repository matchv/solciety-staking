import React, { FC, useCallback, useEffect } from "react";
import { Paper, makeStyles, TableBody, TableRow, TableCell, CardActions, Card, CardContent, InputAdornment, Typography, Button } from '@material-ui/core';
import config from '../../marsalgo/config/default.json';
import WalletSelector from '../wallet-selector';
// import Button from "components/button";
import {
    connect_to_wallet,
    mint,
    get_available_nfts_pass,
    get_balance,
    disconnect_wallet,
    getAffiliatorWallet
} from '../PhantomWallet';
// import '../../css/main.css';


export default function SelectWalletButton(props) {
    const { setProvider, setWalletType, setAddress, setBalance, setAvailable_nft } = props;
    const [open2, setOpen2] = React.useState(false);
    const [buttonLabel, setButtonLabel] = React.useState('CONNECT');

    const connectWallet = async () => {
        setButtonLabel('CONNECTING');

        getAffiliatorWallet();
        if (buttonLabel == 'CONNECT') {
            setOpen2(true);
        } else {
            await disconnect_wallet();
            setButtonLabel('CONNECT');
        }
    };

    const wallet_callback = (address, provider) => {
        (async () => {
            if (!address) return;
            setAddress(address);
            await new Promise(r => setTimeout(r, 2000));
            let rtn2 = await get_balance();
            if (rtn2.ok) {
                setBalance(rtn2.balance / 1000000000);
                setProvider(provider)
            } else {

            }

            // let rtn3 = await get_available_nfts_pass();
            // setAvailable_nft(rtn3.left);

            setButtonLabel('DISCONNECT');
        })()
    }

    const on_wallet_selected = (wallet_type) => {
        (
            async () => {
                try {
                    setOpen2(false);

                    // Canceled
                    if (!wallet_type) return;
                    setWalletType(wallet_type);
                    let rtn = await connect_to_wallet(wallet_type, true, wallet_callback);

                } catch (err) {

                }
            }
        )()
    }

    return (
        // style={{ marginTop: '13px', width: '270px' }}
        <div >
            {/* <Button
                variant="blue"
                className="max-w-360 mx-auto"
                fluid
                onClick={() => connectWallet()}
            >
                SELECT YOUR WALLET
            </Button> */}
            {/* <Button className="uppercase bg-black text-white py-3 text-10 px-3"
                onClick={() => connectWallet()}>
                <span>Coming</span><br /><span className="sm:text-xs">October 18</span>
            </Button> */}
            {/* <a href="#" onClick={() => connectWallet()}>{buttonLabel}</a> */}
            {/* <button className="button form-details-own-button" onClick={() => connectWallet()}>{buttonLabel}</button> */}
            <Button  variant="contained" color="secondary"   onClick={() => connectWallet()}>{buttonLabel}</Button>
            <WalletSelector open={open2} onClose={on_wallet_selected} value={"Phantom"} />
        </div>
    );
}