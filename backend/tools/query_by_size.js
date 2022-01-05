

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

var arg1 = process.argv.slice(2)[0];
var arg2 = process.argv.slice(2)[1];

client.search({

    'index': arg1,
    'body': {
        "query": {
            "match_all": {}
        },
        "from": 0,
        "size": arg2
    }
}, function (err, res) {
    let rtn = res.body.hits.hits.map(doc => {
        doc._source['_id'] = doc._id;
        console.log(doc._source);
        console.log('===================================================================================================');
        return doc._source
    })
    console.log(rtn.length);
});