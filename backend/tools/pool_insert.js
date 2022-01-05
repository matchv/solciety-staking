
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
	node: 'http://localhost:9200'
})
const indexName = 'pool';

async function all_protos() {
	let res = await client.search({
		'index': 'protocol',
		'body': {
			"query": {
				"match_all": {}
			},
			"from": 0,
			"size": 10000
		}
	});
	var protos = {};
	res.body.hits.hits.map(d => {
		console.log(d._source);
		protos[d._source.name.toLowerCase()] = d._source.doc_id;
	})
	return protos;
}

(async () => {
	let protos = await all_protos();
	for (var i = 1; i <= 9; i++) {
		let filename = '../scraper/pool_1__' + i + '.json'
		let rawdata = fs.readFileSync(filename);
		let docs = JSON.parse(rawdata);

		var start = new Date().getTime()
		const body = docs.flatMap(doc => {
			let _id = uuidv4();
			doc['doc_id'] = _id;
			if (doc.platform) {
				let lc = doc.platform.toLowerCase();
				doc['protocol_id'] = (lc in protos) ? protos[lc] : '';
				doc['protocol_name'] = doc.platform;
			}
			doc['name'] = doc.poolName;
			delete doc['poolName'];
			delete doc['platform'];
			delete doc['roi'];
			delete doc['usdLiquidity'];
			delete doc['usdVolume'];
			doc.assets.map(d => {
				delete d['balance'];
				delete d['weight'];
			});
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


/**
 * ===================================================================================================
{
  assets: [
	{
	  address: '0x2bd75ef020f27a0fadf657c9ec87f27ea860575f',
	  balance: 0.00099999999999998,
	  name: 'Bear',
	  symbol: 'BEAR',
	  weight: 0.5
	},
	{
	  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
	  balance: 0.001,
	  name: 'Wrapped Ether',
	  symbol: 'WETH',
	  weight: 0.5
	}
  ],
  exchange: '0x1ae09ef6a8a68cc40b47e24e5fb7f557fc06c861',
  ownershipToken: '0x1ae09ef6a8a68cc40b47e24e5fb7f557fc06c861',
  platform: 'Uniswap-v2',
  poolName: 'Uniswap BEAR-WETH',
  roi: 1,
  tags: [],
  usdLiquidity: 0.44997150294487837,
  usdVolume: 0,
  _id: '317e760c-7e24-41b7-ad3b-2eb84f647267'
}


| #    | Field Name  | Comment                                                      |
| ---- | ----------- | ------------------------------------------------------------ |
| 1    | id          | address                                                      |
| 2    | protocol_id | =meta_protocol.id, yet how to get this is still an open question. |
| 3    | name        | e.g., KIBA/ETH                                               |
| 4    | logo_uri    | maybe local file is better, https://cryptologos.cc/          |

 */
