const Blockchain = {
    id: {label:'ID', data_type:'int', default:0},
    name: {label:'Name', data_type:'str', default:''},
    native_token_id: {label:'Native Token', data_type:'str', default:''},
    wrapped_token_id:  {label:'Wrapped Token', data_type:'str', default:''},
    consensus_protocol: {label:'Consensus Protocol', data_type:'str', default:''},
    launch_date: {label:'Launch Date', data_type:'date', default:new Date()},
    total_gas_burned: {label:'Total Gas Burned', data_type:'int', default:0},
    total_nodes: {label:'Total Nodes', data_type:'int', default:0},
    total_protocols: {label:'Total Protocols', data_type:'int', default:0},
    risk: {label:'Risk', data_type:'int', default:0},
}

const FormBlockchain_create = [
    'name',
    'native_token_id',
    'wrapped_token_id',
    'consensus_protocol',
    'launch_date',
]

export default {Blockchain, FormBlockchain_create}