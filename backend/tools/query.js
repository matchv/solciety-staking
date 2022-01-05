

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

var indexname = "pool";

client.search({
    'index': indexname,
    'body': {
        "_source": {
            "excludes": []
        },
        "query": {
            "match": { "name": { "query": 'bitco', "operator": "and" } }
        },
        "from": 0,
        "size": 10
    }
}, function (err, res) {
    let rtn = res.body.hits.hits.map(doc => {
        doc._source['_id'] = doc._id;
        console.log(doc._source);
        return doc._source
    })
    console.log(rtn.length);
});