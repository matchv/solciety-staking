import React from 'react'
import { FormControl, InputLabel, FormHelperText, Input, TextField, OutlinedInput  } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/Create';

export default function SearchInput(props) {

    const { label, value, handleClick, items } = props;

    return (
        <TextField
            id="standard-name"
            label={label}
            value={value}
            InputProps={{ endAdornment: <CreateIcon style={{cursor:'hand'}} onClick={handleClick} /> }}
        />
    )
}