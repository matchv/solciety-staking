import React, { useState, useEffect } from 'react'
// import TokenForm from "./TokenForm";
import PageHeader from "../../ap_components/PageHeader";
import PeopleOutlineTwoToneIcon from '@material-ui/icons/PeopleOutlineTwoTone';
import { Paper, makeStyles, TableBody, TableRow, TableCell, CardActions, Card, CardContent, InputAdornment, Typography, Button } from '@material-ui/core';
import useTable from "../../ap_components/useTable";
import * as commonService from "../../ap_services/commonService";
import * as tokenServices from "../../ap_services/tokenServices";
import Controls from "../../ap_components/controls/Controls";
import { Search } from "@material-ui/icons";
import AddIcon from '@material-ui/icons/Add';
import Popup from "../../ap_components/Popup";
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import CloseIcon from '@material-ui/icons/Close';
import Notification from "../../ap_components/Notification";
import ConfirmDialog from "../../ap_components/ConfirmDialog";
import { Grid, Box, Checkbox } from '@material-ui/core';
import SelectWalletButton from '../../marsalgo/wallet_select_button';
// import '../../css/main.css';

import * as SolmateList from '../../solmate/list';
import {stake} from '../../solmate/stake';
import {calc_reward} from '../../solmate/reward';

const useStyles = makeStyles(theme => ({
    pageContent: {
        margin: theme.spacing(5),
        padding: theme.spacing(3)
    },
    searchInput: {
        width: '75%'
    },
    newButton: {
        position: 'absolute',
        right: '10px'
    }
}))

export default function Reward() {
    const classes = useStyles();
    const [address, setAddress] = useState(null)
    const [records, setRecords] = useState([])
    const [content, setContent] = useState(<></>)
    const [selects, setSelects] = useState([])
    const [timeLength, setTimeLength] = useState(7)
    const [provider, setProvider] = useState(null)
    const [max_nft_to_stake, setMax_nft_to_stake] = useState(2);
    const [rewardAmount, setRewardAmount] = useState(0)


    const setWalletType = () => {

    }
    const setBalance = () => {

    }

    const refreshAddress = async (wallet) => {
        setAddress(wallet)
    }

    const onClick = async () => {
        let ciety = await calc_reward(address, provider)
        setRewardAmount(ciety)
    }

    return (
        < >
            <Grid container>
                <Grid item xs={3}>
                    <SelectWalletButton variant="contained" setProvider={setProvider} setWalletType={setWalletType} setAddress={refreshAddress} setBalance={setBalance} />
                </Grid>
                <Grid item xs={3}>
                    <Button variant="contained" onClick={onClick} >Resolve Reward</Button>
                </Grid>
                
            </Grid>
            <Typography variant="h4" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Staker Wallet:   {address}
            </Typography>
            <Typography variant="h4" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Rewarded $CIETY:   {rewardAmount}
            </Typography>

            <Grid container>{content}</Grid>
        </>
    )
}
