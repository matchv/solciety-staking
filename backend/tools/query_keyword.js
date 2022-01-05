

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

var arg1 = process.argv.slice(2)[0];
var arg2 = process.argv.slice(2)[1];

var size = 10;

client.search({
    'index': arg1,
    'body': {
        "query": {
            "term": {"name.normalize": arg2}
        },
        "from": 0,
        "size": size
    }
}, function (err, res) {
    let rtn = res.body.hits.hits.map(doc => {
        console.log('===================================================================================================');
        console.log(doc);
        return doc._source
    })
    console.log(rtn.length);
});