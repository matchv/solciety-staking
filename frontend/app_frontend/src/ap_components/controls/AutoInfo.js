import React from 'react'
import { Stack, Chip } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import Link from '@material-ui/core/Link';
import Controls from "../../ap_components/controls/Controls";

const styles = theme => ({
    root: {
        display: 'flex',
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
});

export default function AutoInfo(props) {
    const styles = theme => ({
        root: {
            display: 'flex',
        },
        formControl: {
            margin: theme.spacing.unit * 3,
        },
    });
    const { title, entity, addressFields, ignorePaths, ...other } = props;

    const format = (prop) => {
        if (!prop) return;

        let rtn = '';
        prop.split('_').map(t => {
            let tmp = t.substring(0, 1).toUpperCase();
            if (rtn != '') rtn += ' ';
            rtn += tmp + t.substring(1);
        });
        return rtn;
    }
    const treefy = (parent, fieldName, value) => {
        if (value == null || value == undefined) {
            let child = { type: 'leaf', name: fieldName, value: '', depth: parent.depth + 1, path: (fieldName ? parent.path + '/' + fieldName : parent.path), parent: parent }
            parent['child'].push(child)
        } else if (Array.isArray(value)) {
            let child1 = { type: 'array', name: fieldName, depth: parent.depth + 1, child: [], path: (fieldName ? parent.path + '/' + fieldName : parent.path), parent: parent }
            parent['child'].push(child1)
            let ind = 0
            value.map(item => {
                // let child2 = { name: fieldName, depth: child1.depth + 1, child: [], path:child1.path+'/'+fieldName }
                // child1['child'].push(child2)
                treefy(child1, (++ind), item)
            })
        } else if (typeof value == typeof {}) {
            let child1 = { type: 'object', name: fieldName, depth: parent.depth + 1, child: [], path: (fieldName ? parent.path + '/' + fieldName : parent.path), parent: parent }
            parent['child'].push(child1)
            Object.keys(value).map(prop => {
                // let child = { name: prop, depth: parent.depth + 1, child: [], path:parent.path+'/'+fieldName }
                // parent['child'].push(child)
                treefy(child1, prop, value[prop])
            })
        } else {
            parent['child'].push({ type: 'leaf', name: fieldName, value: value, depth: parent.depth + 1, path: (fieldName ? parent.path + '/' + fieldName : parent.path), parent: parent })
        }
    }

    const leaf = (node, result) => {
        if (node['type'] == 'leaf') {
            result.push(node)
        } else {
            node.child.map(c => {
                leaf(c, result)
            })
        }

    }

    const tree = (obj) => {
        let root = { path: '', child: [], type: 'root', depth: 0 }
        treefy(root, null, obj)

        let result = []
        leaf(root, result)
        result.sort((a, b) => (a.path > b.path) ? 1 : ((b.path > a.path) ? -1 : 0))

        return result
    }

    const render_ = (node) => {
        let result = tree(node)
        let last = ''
        let ind = 0
        return result.map(d => {
            let same = last == d.parent.path
            last = d.parent.path
            let value = d.value

            // if ('' == value && typeof value == typeof 'abc') return <>{
            //     same == true ?
            //         <></>
            //         :
            //         <Divider  key={d.path+'_1'} style={{ marginTop: '10px' }} />
            // }</>

            let ignore = false
            if (ignorePaths)
                ignorePaths.map(exp => {
                    if (d.path.replace(new RegExp(exp), '').replace(new RegExp('\\s+')) == '') {
                        ignore = true
                    }
                })
            if (ignore) return <div key={d.path+'_'+(++ind)}>{
                same == true ?
                    ''
                    :
                    <Divider  key={d.path+'_'+(++ind)} style={{ marginTop: '10px' }} />
            }</div>

            let is_address = false
            if (addressFields)
                addressFields.map(exp => {
                    if (d.path.replace(new RegExp(exp), '').replace(new RegExp('\\s+')) == '') {
                        is_address = true
                    }
                })

            return (
                <div key={d.path+'_'+(++ind)}>
                    {
                        same == true ?
                            ''
                            :
                            <Divider  key={d.path+'_'+(++ind)} style={{ marginTop: '10px' }} />
                    }

                    <Grid key={d.path} container style={{ marginTop: '10px', display: 'flex' }}>
                        <Grid item xs={4}>
                            <FormLabel component="legend" style={{ textAlign: "left", marginRight: '15px', color: '#aaaaaa' }}>{d.path}</FormLabel>
                        </Grid>
                        <Grid item xs={8}>
                            {
                                typeof value == typeof "" && (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.svg') || value.endsWith('.gif')) ?
                                    <img src={value} width='20px' height='20px' />
                                    :
                                    typeof value == typeof "" && (value.startsWith('https://') || value.startsWith('http://')) ?
                                        <Link href={value} target="blank">{value}</Link>
                                        :
                                        typeof value == typeof true ?
                                            <Grid item xs={10}>
                                                <Controls.Checkbox value={value} onChange={a => { }} />
                                            </Grid>
                                            :
                                            is_address ?
                                                <Controls.CryptoAddress value={value} />
                                                :
                                                <Grid item xs={10}>
                                                    <FormLabel component="legend" style={{ color: '#bbbbbb' }}>{value}</FormLabel>
                                                </Grid>
                            }
                        </Grid>
                    </Grid>

                </div>)
        })
    }

    return (
        <div style={{width:'100%'}}>
            <Typography variant="h3" gutterBottom component="div" align="center" style={{ fontWeight:'bold', marginTop:'20px', color: '#ccccff' }}>{title}</Typography>
            <Divider component="div" />
            {
                render_(entity)
            }
        </div>
    );
}
