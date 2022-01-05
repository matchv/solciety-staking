

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

var arg1 = process.argv.slice(2)[0];
var arg2 = process.argv.slice(2)[1];

client.get({
    id: arg2,
    index: arg1
}, function (err, res) {
    if (err) {
        console.log(err);
    } else {

        // let rtn = res.body.hits.hits.map(doc => {
        //     console.log(doc._source);
        //     console.log('===================================================================================================');
        //     return doc._source
        // })
        console.log(res.body._source);
    }
});