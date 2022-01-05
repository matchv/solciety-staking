import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
//MarsAlgo
import IconSolletExtension from '../image/sollet_extension.png';
import IconSolletWeb from '../image/sollet_web.svg';
import IconPhantom from '../image/phantom.svg';
import IconSolflare from '../image/solflare.svg';
import {
  WALLET_TYPE_Phantom,
  WALLET_TYPE_Solflare,
  WALLET_TYPE_Sollet_extension,
  WALLET_TYPE_Sollet_web,
  DIALOG_STYLE_CONTENT,
  DIALOG_STYLE_TITLE
} from '../PhantomWallet';


const options = [
  WALLET_TYPE_Phantom,
  WALLET_TYPE_Solflare,
  WALLET_TYPE_Sollet_extension,
  WALLET_TYPE_Sollet_web
];

export default function ConfirmationDialogRaw(props) {
  const { onClose, value: valueProp, open, ...other } = props;
  const [value, setValue] = React.useState(valueProp);
  const radioGroupRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) {
      setValue(valueProp);
    }
  }, [valueProp, open]);

  const handleEntering = () => {
    if (radioGroupRef.current != null) {
      radioGroupRef.current.focus();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleOk = () => {
    onClose(value);
  };

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <Dialog
      sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
      maxWidth="xs"
      TransitionProps={{ onEntering: handleEntering }}
      open={open}
      {...other}
    >
      <DialogTitle style={DIALOG_STYLE_TITLE}>SELECT WALLET</DialogTitle>
      <DialogContent dividers style={DIALOG_STYLE_CONTENT}>
        <RadioGroup
          ref={radioGroupRef}
          aria-label="ringtone"
          name="ringtone"
          value={value}
          onChange={handleChange}
        >
          {options.map((option) => (
            <div key={option} style={{ display: 'flex', verticalAlign: 'text-top', alignItems: 'center' }}>
              {
                option == WALLET_TYPE_Sollet_extension ?
                  <img src={IconSolletExtension} style={{ width: '30px', height: '30px', marginRight: '30px' }} />
                  : option == WALLET_TYPE_Sollet_web ?
                    <img src={IconSolletWeb} style={{ width: '30px', height: '30px', marginRight: '30px' }} />
                    : option == WALLET_TYPE_Phantom ?
                      <img src={IconPhantom} style={{ width: '30px', height: '30px', marginRight: '30px' }} />
                      : <img src={IconSolflare} style={{ width: '30px', height: '30px', marginRight: '30px' }} />
              }
              <FormControlLabel
                value={option}
                key={option}
                control={<Radio />}
                label={option}
              />
            </div>
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions style={DIALOG_STYLE_TITLE}>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleOk}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmationDialogRaw.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  value: PropTypes.string.isRequired,
};

// export default function ConfirmationDialog(props) {
//     const { open2 } = props;
//   const [open, setOpen] = React.useState(open2);
//   const [value, setValue] = React.useState('Dione');

//   const handleClickListItem = () => {
//     setOpen(true);
//   };

//   const handleClose = (newValue) => {
//     setOpen(false);

//     if (newValue) {
//       setValue(newValue);
//     }
//   };

//   return (
//     <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
//       <List component="div" role="group">
//         <ListItem button divider disabled>
//           <ListItemText primary="Interruptions" />
//         </ListItem>
//         <ListItem
//           button
//           divider
//           aria-haspopup="true"
//           aria-controls="ringtone-menu"
//           aria-label="phone ringtone"
//           onClick={handleClickListItem}
//         >
//           <ListItemText primary="Phone ringtone" secondary={value} />
//         </ListItem>
//         <ListItem button divider disabled>
//           <ListItemText primary="Default notification ringtone" secondary="Tethys" />
//         </ListItem>
//         <ConfirmationDialogRaw
//           id="ringtone-menu"
//           keepMounted
//           open={open}
//           onClose={handleClose}
//           value={value}
//         />
//       </List>
//     </Box>
//   );
// }
