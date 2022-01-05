const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})


var arg1 = process.argv.slice(2)[0];

const indexName = arg1;

(async () => {
    const indices = await client.cat.indices({format: 'json'})
    console.log('indices', indices)
    const resp = await client.indices.delete({ index: indexName })
    console.log("Successful query!");
    console.log(JSON.stringify(resp, null, 4));
})()
