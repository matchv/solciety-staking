import React from 'react'
import { Stack, Chip } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export default function CryptoAddress(props) {

    const { value, ...other } = props;
    const [open, setOpen] = React.useState(false);

    const handleClose = () => {
        setOpen(false)
    }

    const handleClick = () => {
        navigator.clipboard.writeText(value).then(function () {
            console.log('Copied to clipboard: ' + value);
            setOpen(true);
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
    return (
        <>
            <TextField
                id="standard-name"
                value={value}
                InputProps={{ disableUnderline: true, endAdornment: <FileCopyIcon color='action' style={{ cursor: 'hand', width: '15px', height: '15px' }} onClick={handleClick} /> }}
                disabled={true}
                fullWidth
            />
            <Snackbar
                autoHideDuration={2000}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={open}
                onClose={handleClose}
                message={'Copied: ' + value}
            // key={vertical + horizontal}
            />
        </>
    );
}
