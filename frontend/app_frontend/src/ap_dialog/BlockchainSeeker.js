import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import useTable from "../ap_components/useTable";
import { Paper, makeStyles, Table, TableBody, TableRow, TableCell, Toolbar, InputAdornment } from '@material-ui/core';
import { Search } from "@material-ui/icons";
import * as commonService from "../ap_services/commonService";
import * as blockchainServices from "../ap_services/blockchainService";
import Controls from "../ap_components/controls/Controls";


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
	},


	tableRow: {
		"&$selected, &$selected:hover": {
			backgroundColor: "#eeeeee"
		}
	},
	tableCell: {
		"$selected &": {
			color: "yellow"
		}
	},
	selected: {},
}))
/**
 * 
    { id: 'name', label: 'Name' },
    { id: 'native_token_symbol', label: 'Ntv Token' },
    { id: 'consensus_protocol', label: 'Consensus Protocol' },
    { id: 'launch_date', label: 'Launch Date' },
 */
const tableName = 'blockchain'
const searchField = 'name'
const orderBy = 'name'
const headCells = [
	{ id: 'name', label: 'Name' },
	{ id: 'native_token_symbol', label: 'Ntv Token' },
	{ id: 'consensus_protocol', label: 'Consensus Protocol' },
	{ id: 'launch_date', label: 'Launch Date' },
]

export default function BlockchainSeeker(props) {
	const { open, handleClose } = props;

	const classes = useStyles();
	const [records, setRecords] = useState([])
	const [filterFn, setFilterFn] = useState({ fn: items => { return items; } })
	const [keyword, setKeyword] = useState('a')
	const [selectedID, setSelectedID] = useState(null);
	const [selectedRecord, setSelectedRecord] = useState(null);

	const {
		TblContainer,
		TblHead,
		TblPagination,
		recordsAfterPagingAndSorting
	} = useTable(records, headCells, filterFn);

	const handleSearch = e => {
		let target = e.target;

		setKeyword(target.value);

		refresh(target.value);
	}

	const refresh = (keyword) => {
		blockchainServices.search(tableName, searchField, keyword, orderBy).then(items1 => {
			setRecords(items1)
			console.log("items1= ", items1);
			setFilterFn({
				fn: items => {
					return items
				}
			})
		})
	}


	const handle1_ = (item) => {
		console.log('item========', item)
		setSelectedID(item.doc_id)
		setSelectedRecord(item);
	}

	useEffect(() => {
		refresh(keyword);
	}, [keyword]);

	return (
		<Dialog
			sx={{ '& .MuiDialog-paper': { width: '1024px', maxHeight: 666 } }}
			maxWidth="lg"
			open={open}

			modal={true}

		>
			<DialogTitle >Blockchain Seeker</DialogTitle>
			<DialogContent dividers >

				<Paper className={classes.pageContent}>
					<Toolbar>
						<Controls.Input
							label="Search Blockchains"
							className={classes.searchInput}
							InputProps={{
								startAdornment: (<InputAdornment position="start">
									<Search />
								</InputAdornment>)
							}}
							onChange={handleSearch}
						/>
					</Toolbar>
					<TblContainer >
						<TblHead />
						<TableBody>
							{
								recordsAfterPagingAndSorting().map(item =>
								(
									<TableRow key={item.doc_id} onClick={a => { handle1_(item) }}
										hover
										selected={selectedID === item.doc_id}
										classes={{ selected: classes.selected }}
										className={classes.tableRow}
									>
										<TableCell style={{minWidth:150, maxWidth:150}}>{item.name}</TableCell>
										<TableCell style={{minWidth:150, maxWidth:150}}><img src = {item.native_token_logo_uri} width='32px' height='32px'/></TableCell>
										<TableCell style={{minWidth:150, maxWidth:150}}>{item.consensus_protocol}</TableCell>
										<TableCell style={{minWidth:400, maxWidth:500}}>{item.launch_date}</TableCell>
									</TableRow>)
								)
							}
						</TableBody>
					</TblContainer>
				</Paper>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => handleClose(false, undefined)} autoFocus>
					Cancel
				</Button>
				<Button onClick={() => handleClose(true, selectedRecord)} autoFocus>
					Okay
				</Button>
			</DialogActions>
		</Dialog>
	);
}
