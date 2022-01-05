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

import {v2_unstake} from '../../solmate/v2_unstake';
import {read_pwdm} from '../../solmate/v2_inspector';

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

export default function UnstakeV2() {
    const classes = useStyles();
    const [address, setAddress] = useState('')
    const [records, setRecords] = useState(null)
    const [content, setContent] = useState({})
    const [provider, setProvider] = useState(null)
    const [ciety, setCiety] = useState(0)
    const [count, setCount] = useState(0)
    const [title, setTitle] = useState('')
    const [addressFields, setAddressFields] = useState([])

    const onUnstake = async () => {
        let rtn = await v2_unstake(address, provider)
        console.log('unstake result: ', rtn)
    }
    const setWalletType = () => {

    }
    const setBalance = () => {

    }


    const load_pwdm_info = async (wallet) => {
        try {
            let rtn = await read_pwdm(wallet)
            setContent(rtn)
            setTitle('Pwdm Info')

        } catch (err) {
            setContent({})
            setTitle('Pwdm has been closed, or wallet not connected, or never created, or the chain crashed')

        }
        setAddressFields(['/nft_account', '/nft_mint'])
    }

    const refreshAddress = async (wallet) => {
        setAddress(wallet)
        await load_pwdm_info(wallet)
    }

    return (
        < >
            <Grid container>
                <Grid item xs={3}>
                    <SelectWalletButton variant="contained" setProvider={setProvider} setWalletType={setWalletType} setAddress={refreshAddress} setBalance={setBalance} />
                </Grid>
                <Grid item xs={3}>
                    <Button variant="contained" color="primary" onClick={() => onUnstake()}>Unstake</Button>
                </Grid>
                
            </Grid>

            <Typography variant="h4" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Staker Wallet:   {address}
            </Typography>
            <Controls.AutoInfo title={title} entity={content} addressFields={addressFields} />
        </>
    )
}
