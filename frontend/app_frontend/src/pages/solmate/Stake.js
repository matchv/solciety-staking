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

export default function Stake() {
    const classes = useStyles();
    const [address, setAddress] = useState('')
    const [records, setRecords] = useState([])
    const [content, setContent] = useState(<></>)
    const [selects, setSelects] = useState([])
    const [timeLength, setTimeLength] = useState(7)
    const [provider, setProvider] = useState(null)
    const [max_nft_to_stake, setMax_nft_to_stake] = useState(2);

    const onList = () => {

    }
    const onStake = async () => {
        let nfts = []
        records.map(rec=>{
            if(rec.selected) nfts.push(rec)
        })
        if(nfts.length==0)return
        let rtn = await stake(address,timeLength ,nfts, provider, max_nft_to_stake)

        console.log('stake result: ', rtn)
    }
    const setWalletType = () => {

    }
    const setBalance = () => {

    }

    const onChange = (a, ind) => {
        records[ind].selected = !(records[ind].selected)
        // a.target.value = rec.selected
        // a.target.checked = rec.selected
        console.log('xxxxxxxxxxxxxxxxxxxxxxxx   ', records[ind].selected)
        // console.log('xxxxxxxxxxxxxxxxxxxxxxxx   ', a.target.value)
        selects[ind] = !selects[ind]
        setSelects(selects)
    }

    const refreshAddress = async (wallet) => {
        setAddress(wallet)
        let nfts = await SolmateList.list(wallet)
        setRecords(nfts)
        let x = nfts.map(n => n.selected)
        setSelects(x)
    }

    const x = () => {
        let y = records.map((r, ind) => {
            return <Grid key={ind} item xs={12}>
                <Card sx={{ minWidth: 500 }} style={{ marginLeft: '30px', marginTop: '30px' }}>
                    <CardContent>
                        <Typography style={{ color: '#aaaaaa' }} gutterBottom>
                            Account: {r.account}
                        </Typography>
                        <Typography style={{ color: '#aaaaaa' }} >
                            Mint: {r.mint}
                        </Typography>
                        <img src={r.metadata.image} width='100px' height='100px'/>
                        <Checkbox
                            checked={selects[ind]}
                            onChange={a => onChange(a, ind)}
                        />
                        <Controls.AutoInfo title={'INFO'} entity={r}/>
                    </CardContent>
                </Card>
            </Grid>
        })

        setContent(y)
    }

    useEffect(a => {
        x()
    }, [records])

    return (
        < >
            <Grid container>
                <Grid item xs={3}>
                    <SelectWalletButton variant="contained" setProvider={setProvider} setWalletType={setWalletType} setAddress={refreshAddress} setBalance={setBalance} />
                </Grid>
                <Grid item xs={3}>
                    <Button variant="contained" color="primary" onClick={() => onStake()}>Stake</Button>
                </Grid>
                <Grid item xs={3}>
                    <Controls.Input
                        name="symbol"
                        label="Time Length(days)"
                        value={timeLength}
                    />
                </Grid>
                <Grid item xs={3}>
                    <Controls.Input
                        name="max_nft_to_stake"
                        label="Max NFTs to Stake)"
                        value={max_nft_to_stake}
                        helperText="It only takes effect at the first time"
                    />
                </Grid>
                
            </Grid>
            <Typography variant="h4" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Staker Wallet:   {address}
            </Typography>

            <Grid container>{content}</Grid>
        </>
    )
}
