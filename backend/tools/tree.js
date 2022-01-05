const json = require('./exmple_blockchain_1.json')

let x = '/infobox/3/name'
x = x.replace(new RegExp('/infobox/\\d+/name'), '')
console.log(x=='')