'use strict';
const config = require('config');
const fs = require("fs");
const { execSync } = require('child_process');
const { type } = require('os'); const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})


// create a rolling file logger based on date/time that fires process events
const opts = {
    errorEventName: 'error',
    logDirectory: 'log', // NOTE: folder must exist and be writable...
    fileNamePattern: 'roll-<DATE>.log',
    dateFormat: 'YYYY.MM.DD'
};
const log = require('simple-node-logger').createRollingFileLogger(opts);

// const redis = require('redis');
// const rdsClient = redis.createClient();
// (async () => {
//     rdsClient.on('error', (err) => {
//         log.log("error", err);
//         console.log('Redis Client Error', err);
//     })
//     console.log("Connecting Redis.......")
//     await rdsClient.connect();
//     console.log("Redis was connected")
// })();

const OS_MacOS = "MacOS";
const OS_Windows = "Windows";
const OS_Linux = "Linux";
function os() {
    var opsys = process.platform;
    if (opsys == "darwin") {
        opsys = "MacOS";
    } else if (opsys == "win32" || opsys == "win64") {
        opsys = "Windows";
    } else if (opsys == "linux") {
        opsys = "Linux";
    }
    return opsys;
}

function getPathSeparator() {
    let o = os();
    if (os == OS_Windows) {
        return '\\';
    }
    else {
        return '/';
    }
}

const STATE_metadata_token_read_SYS_ERR = 'SYS_ERR'
const STATE_metadata_OK = 'OK'
exports.metadata_token_read = (req, res1) => {
    (async () => {
        const { keywords } = req.body
        try {
            client.search({
                'index': 'token',
                'body': {
                    "_source": {
                        "excludes": ["quotes"]
                    },
                    "query": {
                        "match": { "name": { "query": keywords, "operator": "and" } }
                    },
                    "from": 0,
                    "size": 10
                }
            }, function (err, res) {
                if(err){
                    console.log(err);
                    res1.json({ state: STATE_metadata_token_read_SYS_ERR});
                }else{
                    let rtn = res.body.hits.hits.map(doc => {
                        return doc._source
                    })
                    console.log(rtn.length);
                    res1.json({ state: STATE_metadata_OK, data: rtn });
                }
            });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}


exports.metadata_blockchain_read = (req, res1) => {
    (async () => {
        const { keywords } = req.body
        try {
            client.search({
                'index': 'blockchain',
                'body': {
                    "_source": {
                        "excludes": ["quotes"]
                    },
                    "query": {
                        "match": { "name": { "query": keywords, "operator": "and" } }
                    },
                    "from": 0,
                    "size": 10
                }
            }, function (err, res) {
                if(err){
                    console.log("System error: ", err);
                    res1.json({ state: STATE_metadata_token_read_SYS_ERR });
                }else{

                    let rtn = res.body.hits.hits.map(doc => {
                        return doc._source
                    })
                    console.log(rtn.length);
                    console.log(err);
                    res1.json({ state: STATE_metadata_OK, data: rtn });
                }
            });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}

exports.metadata_protocol_read = (req, res1) => {
    (async () => {
        const { keywords } = req.body
        console.log('keywords===', keywords);
        try {
            client.search({
                'index': 'protocol',
                'body': {
                    "_source": {
                        "excludes": ["quotes"]
                    },
                    "query": {
                        "match": { "name": { "query": keywords, "operator": "and" } }
                    },
                    "from": 0,
                    "size": 10
                }
            }, function (err, res) {
                if(err){
                    console.log("System error: ", err);
                    res1.json({ state: STATE_metadata_token_read_SYS_ERR });
                }else{
                    let rtn = res.body.hits.hits.map(doc => {
                        return doc._source
                    })
                    console.log(rtn.length);
                    res1.json({ state: STATE_metadata_OK, data: rtn });
                }
            });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}


exports.metadata_pool_read = (req, res1) => {
    (async () => {
        const { keywords } = req.body
        console.log('keywords===', keywords);
        try {
            client.search({
                'index': 'pool',
                'body': {
                    "_source": {
                        "excludes": ["quotes"]
                    },
                    "query": {
                        "match": { "name": { "query": keywords, "operator": "and" } }
                    },
                    "from": 0,
                    "size": 10
                }
            }, function (err, res) {
                if(err){
                    console.log("System error: ", err);
                    res1.json({ state: STATE_metadata_token_read_SYS_ERR });
                }else{
                    let rtn = res.body.hits.hits.map(doc => {
                        return doc._source
                    })
                    console.log(rtn.length);
                    res1.json({ state: STATE_metadata_OK, data: rtn });
                }
            });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}


exports.query_by_id = (req, res1) => {
    (async () => {
        const { index, id } = req.body
        console.log('keywords===', keywords);
        try {
            client.get({
                'index': index,
                'id': id
            }, function (err, res) {
                if(err){
                    console.log("System error: ", err);
                    res1.json({ state: STATE_metadata_token_read_SYS_ERR, data: {}});
                }else{
                    console.log(res.body._source);
                    res1.json({ state: STATE_metadata_OK, data: res.body._source });
                }
            });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}


exports.metadata_insert = (req, res1) => {
    (async () => {
        const { doc, index } = req.body
        try {
            const { body: resp } = await client.index({
                index: index,
                id: doc.doc_id,
                refresh: 'true',
                body: doc
            })
            console.log("resp: ", resp);
            res1.json({ state: STATE_metadata_OK });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}

exports.metadata_update = (req, res1) => {
    (async () => {
        const { doc, index } = req.body
        try {
            console.log('doc=========', doc);
            let id = doc.doc_id;
            await client.update({
                index: index,
                id: id,
                refresh: 'true',
                body: {
                    doc: doc
                }
            });
            console.log("doc: ", doc);
            res1.json({ state: STATE_metadata_OK });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}

exports.metadata_delete = (req, res1) => {
    (async () => {
        const { doc_id, index } = req.body
        try {
            await client.delete({
                index: index,
                refresh: 'true',
                id: doc_id
            });
            console.log("doc_id===", doc_id);
            res1.json({ state: STATE_metadata_OK });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}

exports.metadata_query_by_size = (req, res1) => {
    (async () => {
        const { size, index } = req.body
        try {
            client.search({
                'index': index,
                'body': {
                    "query": {
                        "match_all": {}
                    },
                    "from": 0,
                    "size": size
                }
            }, function (err, res) {
                let rtn = res.body && res.body.hits ? res.body.hits.hits.map(doc => {
                    return doc._source
                }) : []
                console.log(rtn.length);
                console.log(err);
                res1.json({ state: STATE_metadata_OK, data: rtn });
            });
        } catch (err) {
            console.log("System error: ", err);
            res1.json({ state: STATE_metadata_token_read_SYS_ERR });
        }
    })()
}
