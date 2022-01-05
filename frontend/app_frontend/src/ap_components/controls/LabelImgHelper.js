import React from 'react'
import { FormControl, FormLabel, Chip, Avatar, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

export default function LabelImgHelper(props) {

    const { name, symbol, logo_uri, value, handleClick, items } = props;

    return (
        <FormControl>

            <Chip
                avatar={<Avatar alt="Natacha" src={logo_uri} />}
                label={name + '/' + symbol}
                variant="outlined"
                onClick={handleClick}
            />
        </FormControl>
    )
}
