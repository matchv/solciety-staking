import * as React from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';


import {
  DIALOG_STYLE_CONTENT,
  DIALOG_STYLE_TITLE} from '../PhantomWallet';

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="twhite">{`${Math.round(
          props.value,
        )}`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

function LinearWithValueLabel(props) {
  const {progress} = props;

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgressWithLabel value={progress} />
    </Box>
  );
}

export default function ProgressWindow(props) {
  const { open, tokens, progressText } = props;


  return (
    <Dialog
      sx={{ '& .MuiDialog-paper': { width: '1024px', maxHeight: 666 } }}
      // maxWidth="xs"
      open={open}
    >
      <DialogTitle style={DIALOG_STYLE_TITLE}>MINTING PROGRESS</DialogTitle>
      <DialogContent dividers style={{display:'flex', justifyContent:'center', align:'center', backgroundColor: '#2c2d30'}}>
          <Stack>
          {
              (tokens && tokens.length>0)?
              tokens.map((token, key)=>(
                  <Typography key={key} style={{fontSize:'15px', color:'white'}}>
                    {"Rarity: "+token.rarity+", Address: "+token.tokenAddress}
                  </Typography>
              ))
              :<CircularProgress />
          }
          </Stack>
      </DialogContent>
      <DialogTitle style={DIALOG_STYLE_TITLE}>
        {progressText}
      </DialogTitle>
    </Dialog>
  );
}
