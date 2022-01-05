
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})
const indexName = 'token';

(async () => {
    for (var i = 1; i <= 8; i++) {
        let filename = '../scraper/token_1__' + i + '.json'
        let rawdata = fs.readFileSync(filename);
        let docs = JSON.parse(rawdata);

        var start = new Date().getTime()
        const body = docs.flatMap(doc => {
            let _id = uuidv4();
            doc['logo_uri'] = 'https://s2.coinmarketcap.com/static/img/coins/32x32/' + doc.id + '.png';
            doc['doc_id'] = _id;
            if(doc.platform){
                doc['address'] = doc.platform.token_address;
            }
            return [{ index: { _index: indexName, _id: _id } }, doc]
        })

        const { body: bulkResponse } = await client.bulk({ refresh: true, body })
        var elapsed = new Date().getTime() - start

        if (bulkResponse.errors) {
            const erroredDocuments = []
            // The items array has the same order of the dataset we just indexed.
            // The presence of the `error` key indicates that the operation
            // that we did for the document has failed.
            bulkResponse.items.forEach((action, i) => {
                const operation = Object.keys(action)[0]
                if (action[operation].error) {
                    erroredDocuments.push({
                        // If the status is 429 it means that you can retry the document,
                        // otherwise it's very likely a mapping error, and you should
                        // fix the document before to try it again.
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1]
                    })
                }
            })
            console.log(erroredDocuments)
        }

        console.log(i, 'Insert file ', elapsed + ' ms');
    }

    const { body: count } = await client.count({ index: indexName })
    console.log('total:', count)
})()
