import React from 'react'
import { FormLabel, TextField} from '@material-ui/core';

export default function Label(props) {

    const { label, value, ...other } = props;
    return (
        <>
            {/* <FormLabel component="legend">{label}</FormLabel>
            <FormLabel component="legend">{value}</FormLabel> */}
            
        <TextField
            variant="outlined"
            label={label}
            value={value}
            disabled='true'
        />
        </>
    )
}
