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
import { Grid, Box, Checkbox, TextField } from '@material-ui/core';
import SelectWalletButton from '../../marsalgo/wallet_select_button';
// import '../../css/main.css';

import {v2_expand} from '../../solmate/v2_expand';
import { read_pwdm } from '../../solmate/v2_inspector';

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


export default function ExpandV2() {
    const classes = useStyles();
    const [address, setAddress] = useState('')
    const [content, setContent] = useState({})
    const [timeLength, setTimeLength] = useState(1)
    const [provider, setProvider] = useState(null)
    const [title, setTitle] = useState('')
    const [addressFields, setAddressFields] = useState([])

    const onExpand = async () => {
        let rtn = await v2_expand(address, timeLength, provider)
        await new Promise(f=>setTimeout(f, 1000))
        load_pwdm_info()
    }
    const setWalletType = () => {

    }
    const setBalance = () => {

    }

    const refreshAddress = async (wallet) => {
        setAddress(wallet)
    }

    const onChange_time_length_days = (e) =>{
        const { name, value } = e.target
        setTimeLength(value)
    }

    const load_pwdm_info = async () => {
        try {
            let rtn = await read_pwdm(address)
            setContent(rtn)
            setTitle('Pwdm Info')

        } catch (err) {
            setContent({})
            setTitle('Pwdm has been closed, or wallet not connected, or never created, or the chain crashed')

        }
        setAddressFields(['/nft_account', '/nft_mint'])
    }

    return (
        < >
            <Grid container>
                <Grid item xs={3}>
                    <SelectWalletButton variant="contained" setProvider={setProvider} setWalletType={setWalletType} setAddress={refreshAddress} setBalance={setBalance} />
                </Grid>
                <Grid item xs={3}>
                    <Button variant="contained" color="primary" onClick={() => onExpand()}>Extend</Button>
                </Grid>
                <Grid item xs={3}>                    
                    <TextField
                        variant="outlined"
                        label="Increase Time Length(days)"
                        name='time_length_days'
                        value={timeLength}
                        onChange = {onChange_time_length_days}
                    />
                </Grid>
                
            </Grid>
            <Typography variant="h4" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Staker Wallet:   {address}
            </Typography>

            <Controls.AutoInfo key='claim' title={title} entity={content} addressFields={addressFields} />
        </>
    )
}

