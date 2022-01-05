

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
});

(async ()=>{
    let res= await client.search({
        'index': 'protocol',
        'body': {
            "query": {
                "match_all": {}
            },
            "from": 0,
            "size": 2
        }
    });
    var protos = {};
    res.body.hits.hits.map(d=>{
        console.log(d._source);
        protos[d._source.name.toLowerCase()] = d._source.doc_id;
    })
    console.log(protos);
    console.log('Curve' in protos);

    var o = {"foo": 1, "bar": 2}; 
    console.log(Object.keys(o));

    var x = [];
    console.log((typeof x) == (typeof []));


    console.log(typeof []);
    console.log(typeof {});
    console.log(typeof true);

})()