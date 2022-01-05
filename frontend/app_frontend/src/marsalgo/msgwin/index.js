import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Modal from '@mui/material/Modal';


import {
  DIALOG_STYLE_CONTENT,
  DIALOG_STYLE_TITLE} from '../PhantomWallet';

export default function AlertDialog(props) {
    const {open, msg, link, handleClose, ready, address} = props;

  return (
      <Dialog
        open={open}
        // onClose={handleClose}
        // disableEscapeKeyDown={true}
        // aria-labelledby="alert-dialog-title"
        // aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" style={DIALOG_STYLE_TITLE}>
          WALLET CONNECTION STATE
        </DialogTitle>
        <DialogContent style={DIALOG_STYLE_CONTENT}>
          <DialogContentText id="alert-dialog-description" style={DIALOG_STYLE_CONTENT}>
            {msg}
            {
                link?
                <a href={link}>Install Extension</a>
                :""
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions style={DIALOG_STYLE_TITLE}>
            {
                ready?
                <div>
                    <Button onClick={()=>handleClose(true, undefined)} autoFocus>
                        Cancel
                    </Button>
                    <Button onClick={()=>handleClose(false, address)} autoFocus>
                        Continue
                    </Button>
                </div>
                :
                <Button onClick={()=>handleClose(true, undefined)} autoFocus>
                    Got It
                </Button>
            }
        </DialogActions>
      </Dialog>
  );
}
