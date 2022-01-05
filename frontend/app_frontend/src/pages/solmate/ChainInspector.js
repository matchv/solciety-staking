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

import * as v2_ciety from '../../solmate/v2_ciety';
import {read_config, read_pwdm, read_gcdm, read_gsdm, read_rpdm} from '../../solmate/v2_inspector';

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

export default function ChainInspector() {
    const classes = useStyles();
    const [title, setTitle] = useState('')
    const [address, setAddress] = useState('')
    const [records, setRecords] = useState([])
    const [content, setContent] = useState({})
    const [provider, setProvider] = useState(null)
    const [addressFields, setAddressFields] = useState([])

    const load_config_info = async () => {
        let rtn = await read_config()
        setContent(rtn)
        setTitle('Config Info')
        setAddressFields(['/init_pubkey', '/nft_authors'])
    }
    
    const load_pwdm_info = async () => {
        try{
            let rtn = await read_pwdm(address)
            setContent(rtn)
            setTitle('Pwdm Info')

        }catch(err){
            setContent({})
            setTitle('Pwdm has been closed, or wallet not connected, or never created, or the chain crashed')

        }
        setAddressFields(['/nft_account', '/nft_mint'])
    }
    
    const load_gcdm_info = async () => {
        let rtn = await read_gcdm(address)
        setContent(rtn)
        setTitle('Gcdm Info')
    }
    
    const load_gsdm_info = async () => {
        let rtn = await read_gsdm()
        setContent(rtn)
        setTitle('Gsdm Info')
    }
    
    const load_rpdm_info = async () => {
        let rtn = await read_rpdm(address)
        setContent(rtn)
        setTitle('Rpdm Info')
    }

    const load_ciety_info = async () => {
        let rtn = await v2_ciety.list()
        setContent(rtn)
        setTitle('Ciety Info')
        setAddressFields(['/mint', '/account', '/mintAuthority', '/owner'])
    }

    const setWalletType = () => {

    }
    const setBalance = () => {

    }

    const refreshAddress_2 = async (wallet) => {
        setAddress(wallet)
    }

    const x = () => {
        let y = records.map((r, ind) => {
            return <Grid key={ind} item xs={12}>
                <Card sx={{ minWidth: 500 }} style={{ marginLeft: '30px', marginTop: '30px' }}>
                    <CardContent>
                        <Controls.AutoInfo title={'INFO'} entity={r} keyby={'pda'}/>
                    </CardContent>
                </Card>
            </Grid>
        })

        setContent(y)
    }

    // useEffect(a => {
    //     x()
    // }, [records])

    return (
        < >
            <Grid container>
                <Grid item xs={2}>
                    <SelectWalletButton key='Inspector' variant="contained" setProvider={setProvider} setWalletType={setWalletType} setAddress={refreshAddress_2} setBalance={setBalance} />
                </Grid>
                <Grid item xs={1}>
                    <Button variant="contained" color="secondary" onClick={() => load_pwdm_info()}>Pwdm</Button>
                </Grid>            
                <Grid item xs={1}>
                    <Button variant="contained" color="primary" onClick={() => load_config_info()}>Config</Button>
                </Grid> 
                <Grid item xs={1}>
                    <Button variant="contained" color="primary" onClick={() => load_gcdm_info()}>Gcdm</Button>
                </Grid>                
                <Grid item xs={1}>
                    <Button variant="contained" color="primary" onClick={() => load_gsdm_info()}>Gsdm</Button>
                </Grid>                    
                <Grid item xs={1}>
                    <Button variant="contained" color="primary" onClick={() => load_rpdm_info()}>Rpdm</Button>
                </Grid>                       
                <Grid item xs={1}>
                    <Button variant="contained" color="primary" onClick={() => load_ciety_info()}>Ciety</Button>
                </Grid>                
            </Grid>
            <Typography variant="h4" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Staker Wallet:   {address}
            </Typography>

            <Controls.AutoInfo title={title} entity={content} addressFields={addressFields} />
        </>
    )
}
