import React from 'react'
import { Stack, Chip } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

export default function Chips(props) {

    const { label, render, handleClick, ...other } = props;
    console.log('render=======', render);
    return (
        <Card sx={{ minWidth: 275 }}>
            <CardContent>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    {label}
                </Typography>
                {render}
            </CardContent>
            <CardActions>
                <CreateIcon onClick={handleClick} style={{cursor:'hand'}}/>
            </CardActions>
        </Card>
    );
}
