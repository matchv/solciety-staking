
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
});

(async () => {
    const rtn = await client.cat.indices({ format: 'json' });
    rtn.body.map(d=>{

        console.log('index:', d.index, '\ttotal:', d['docs.count'])
    });
})()