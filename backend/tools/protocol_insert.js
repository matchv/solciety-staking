
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
	node: 'http://localhost:9200'
})
const indexName = 'protocol';
var dedup = {};

//Use pool data to extract protocol data
(async () => {
	for (var i = 1; i <= 9; i++) {
		let filename = '../scraper/pool_1__' + i + '.json'
		let rawdata = fs.readFileSync(filename);
		let docs = JSON.parse(rawdata);

		var start = new Date().getTime();
		var body = [];
		let x = docs.flatMap(doc => {
			if (doc.platform) {

				if (doc.platform in dedup) {

				} else {
					let _id = uuidv4();
					let doc2 = { doc_id: _id };
					if (doc.platform) {
						doc2['name'] = doc.platform;
						dedup[doc.platform] = 1;
						body = body.concat([{ index: { _index: indexName, _id: _id } }, doc2])
					}
				}
			}
		})
console.log(body);

		if(body.length==0)continue;
		
		const { body: bulkResponse } = await client.bulk({ refresh: true, body })
		var elapsed = new Date().getTime() - start
		if (bulkResponse.errors) {
			const erroredDocuments = []
			bulkResponse.items.forEach((action, i) => {
				const operation = Object.keys(action)[0]
				if (action[operation].error) {
					erroredDocuments.push({
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


| #    | Field Name          | Comment                                           |
| ---- | ------------------- | ------------------------------------------------- |
| 1    | id                  | e.g., UniSwap                                     |
| 2    | blockchain_id       | =meta_blockchain.id                               |
| 3    | name                |                                                   |
| 4    | category            | dex\|lending\|derivative\|payment\|asset          |
| 5    | lauched_date        |                                                   |
| 6    | is_hacked           | boolean                                           |
| 7    | is_audited          | boolean                                           |
| 8    | auto_compound       | boolean                                           |
| 9    | has_multisig_wallet | boolean                                           |
| 10   | risk                | number, only risk manager has privilege to update |

 */
