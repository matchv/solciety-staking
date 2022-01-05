
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})
const indexName = 'blockchain';

(async () => {
    for (var i = 1; i <= 11; i++) {
        let filename = '../scraper/blockchain_1__' + i + '.json'
        let rawdata = fs.readFileSync(filename);
        let docs = JSON.parse(rawdata);

        var start = new Date().getTime()
        const body = docs.flatMap(doc => {
            doc.infobox.flatMap(item => {
                if (item.name == 'ticker_symbol') {
                    doc['native_token_symbol'] = item.display_value;
                }
                if (item.name == 'ledger_genesis') {
                    doc['launch_date'] = item.display_value.year + '/' + item.display_value.month + '/' + item.display_value.day;
                }

                if(typeof item['display_value'] == typeof 1 || typeof item['display_value'] == typeof 1.0){
                    item['display_value'] = item['display_value'] + '';
                }

                if(typeof item['display_value'] == typeof {}){
                    item['display_value'] = item.display_value['year'] + '/' + item.display_value['month'] + '/' + item.display_value['day'];
                }
            });


            let doc2 = {};
            let _id = uuidv4();
            doc['doc_id'] = _id;
            doc['name'] = doc['name'];
            doc['native_token_logo_uri'] = doc.thumbnail.icon;
            doc['native_token_symbol'] = doc['native_token_symbol'];
            doc['launch_date'] = doc['launch_date'];
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
