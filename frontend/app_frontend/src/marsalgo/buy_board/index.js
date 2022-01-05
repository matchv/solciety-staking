import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IndeterminateCheckBoxRoundedIcon from '@mui/icons-material/IndeterminateCheckBoxRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';

import MessageWindow from '../../marsalgo/msgwin';
import ProgressWindow from '../../marsalgo/progress';
import config from '../../marsalgo/config/default.json';
import {
    connect_to_wallet,
    get_current_address,
    mint,
    get_available_nfts,
    get_balance,
    transaction_all_in_one,
    compensate,
    is_in_whitelist,
    MINT_STATE_sold_out,
    MINT_STATE_canceled,
    MINT_STATE_ok,
    MINT_STATE_sys_error,
    MINT_STATE_nft_not_enough,
    WHITELIST_STATE_NOT_IN_LIST,
    WHITELIST_STATE_OK,
    WHITELIST_STATE_EXCEEDING_LIMIT,
    WHITELIST_STATE_SYSTEM_ERROR,
} from '../../marsalgo/PhantomWallet';

const WHITELIST_STATE_SYSTEM_ERROR="SYSTEM_ERROR";
const Item = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'right',
    color: theme.palette.text.secondary,
}));

export default function BuyBoard(props) {
    const TEXT_STYLE_1 = { fontSize: '22px', color: '#F1F3F4', textAlign: 'right', fontWeight: 'bold' };
    const TEXT_STYLE_2 = { fontSize: '22px', color: '#F1F3F4', textAlign: 'left' };
    var { address, balance, available_nft, walletType, setAvailable_nft, setBalance } = props;

    const [quantity, setQuantity] = React.useState(0);
    const [amount_total, setAmount_total] = React.useState(0);
    const [link, setLink] = React.useState("");
    const [msg, setMsg] = React.useState("");
    const [openMsgwin, setOpenMsgwin] = React.useState(false);
    const [ready, setReady] = React.useState(false);
    const [tokens, setTokens] = React.useState(undefined);
    const [openProgress, setOpenProgress] = React.useState(false);
    const [progressText, setProgressText] = React.useState("");
    

    const clickMinus = () => {
        if (quantity == 1) return;
        setQuantity(quantity - 1);
        setAmount_total((quantity - 1) * config.PRICE);
      }
    
      const clickPlus = () => {
        if (quantity + 1 > config.MAX_BUY) return;
        setQuantity(quantity + 1);
        setAmount_total((quantity + 1) * config.PRICE);
      }
    
      const onMint = () => {
          if(quantity==0){
              setMsg("Sorry, the quantity must be larger than zero.");
              setLink(undefined);
              setReady(false);
              setOpenMsgwin(true);
              return;
          }
          
          if(amount_total > balance + 0.03){
              setMsg("Sorry, you don't have enough balance.");
              setLink(undefined);
              setReady(false);
              setOpenMsgwin(true);
              return;
          }
    
          (async () => {
              let rtn3 = await get_available_nfts();
              setAvailable_nft(rtn3.left);
              if(rtn3.left < quantity){
                  setMsg("Sorry, there is no enough NFTs for sale, only "+rtn3.left+" are available.");
                  setLink(undefined);
                  setReady(false);
                  setOpenMsgwin(true);
                  return;
              }
    
    
              let rtn = await get_current_address();
              let { ok, address } = rtn;
    
              if (ok) {
                  let w = await is_in_whitelist(address);
                  if(w.state == WHITELIST_STATE_OK){
                    let m = "it's always better to do double check by double clik on Mint button, make it clear what address you are going to use, this should be the same as the active address in your " + walletType + " wallet."
                    setMsg("Wallet " + walletType + " is connected, the address is: " + address + ", " + m);
                    setLink(undefined);
                    setReady(true);
                    setOpenMsgwin(true);
                  }else{
                    setMsg("Wallet " + walletType + " is connected, the address is: " + address + ", BUT:"+w.state);
                    setLink(undefined);
                    setReady(true);
                    setOpenMsgwin(true);
                  }
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
          if(canceled)return;
    
          (async ()=>{
              // 3. Open progress window
              setOpenProgress(true);
              setTokens([]);
    
              // 4. Set the content of message window
              setProgressText(quantity + " NFTs are being minted...");
    
              // 5. Mint
              let rtn=await mint(quantity);
              if(rtn.state==MINT_STATE_canceled){
                  setOpenProgress(false);
                  return;
              }
    
              // 6. Handle failure cases
              if(rtn.state==MINT_STATE_sold_out){
                  setProgressText("Unfortunately, all sold out!");
                  await new Promise(r=>setTimeout(r, 3000));
                  setOpenProgress(false);
                  return;
              }
    
              if(rtn.state==MINT_STATE_nft_not_enough){
                  setProgressText("Unfortunately, there are only "+rtn.left+" NFTs available, please adjust quantity.");
                  await new Promise(r=>setTimeout(r, 3000));
                  setOpenProgress(false);
                  return;
              }
    
              if(!rtn.tokens || rtn.state!=MINT_STATE_ok){
                  setProgressText("Sorry, unknow system error, please try again.");
                  await new Promise(r=>setTimeout(r, 3000));
                  setOpenProgress(false);
                  return;
              }
    
              // 7. Handle successful case
              setTokens(rtn.tokens);
              setProgressText("Executing transactions...");
              let rtn4 = await transaction_all_in_one(address, quantity, config.PRICE, rtn.tokens);
              if(rtn4.state==MINT_STATE_ok){
                  setProgressText("Congratulations, "+rtn.tokens.length+"/"+quantity+" succeeded!");
                  await new Promise(r=>setTimeout(r, 3000));
                  setOpenProgress(false);
              }else if(rtn4.state==MINT_STATE_canceled){
                  await compensate(rtn.tokens);
                  setOpenProgress(false);
              }else{
                  setProgressText("Sorry, unknow system error, please try again.");
                  await new Promise(r=>setTimeout(r, 3000));
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
    const LABEL_WIDTH = 4;
    const CONTENT_WIDTH = 7;
    return (
        <Box sx={{ flexGrow: 1, border: 3, borderColor: '#f8a918', borderRadius: 5, marginTop: 2, padding: 3 }} >
            <div style={{ display: 'flex', alignItems: 'center' }}>

                <Button
                    variant="blue"
                    onClick={() => onMint()}
                    cx={1}
                    style={{ fontSize: '22px', color: '#F1F3F4', backgroundColor: '#00ace3', align: 'left', width: '250px', height: '56px', borderRadius: 33 }}
                >
                    Mint
                </Button>
                <Grid
                    container
                    spacing={3}
                    direction="row"
                    justify="center"
                    alignItems="stretch"
                >
                    <Grid item xs={LABEL_WIDTH} style={TEXT_STYLE_1}>
                        <Typography color='secondary'>Available NFTs:</Typography>
                        <Typography color='secondary'>Wallet Address:</Typography>
                        <Typography color='secondary'>Wallet Balance(SOL):</Typography>
                        <Typography color='secondary'>Buy Quantity:</Typography>
                        <Typography color='secondary'>Total Amount:</Typography>
                    </Grid>
                    <Grid item xs={CONTENT_WIDTH} style={TEXT_STYLE_2}>
                        <Typography color='secondary'>{available_nft}</Typography>
                        <Typography color='secondary'>{address}</Typography>
                        <Typography color='secondary'>{balance}</Typography>
                        <Stack spacing={2} direction="row">
                            <Button onClick={clickMinus}>
                                <IndeterminateCheckBoxRoundedIcon fontSize="inherit" color="primary" />
                            </Button>
                            <Typography style={{ fontSize: '22px', color: '#F1F3F4' }}>{quantity}</Typography>
                            <Button onClick={clickPlus}>
                                <AddBoxRoundedIcon fontSize="inherit" color="primary" />
                            </Button>
                        </Stack>
                        <Typography color='secondary'>{amount_total}</Typography>
                    </Grid>
                </Grid>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Typography color='#F1F3F4' fontStyle='italic'>When a wallet is connected, the 'Address' and 'Balance' should be refreshed, if not, please select wallet again.</Typography>
            </div>


            <MessageWindow keepMounted address={address} open={openMsgwin} msg={msg} link={link} handleClose={handleClose} ready={ready} />
            <ProgressWindow
                keepMounted
                open={openProgress}
                tokens={tokens}
                progressText={progressText}
            />
        </Box>
    );
}