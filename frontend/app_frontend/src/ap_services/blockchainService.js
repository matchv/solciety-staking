import axios from 'axios';

export async function search(tableName, searchField, keywords, orderBy) {
    let body = { keywords: keywords }
    let res = await axios.post('/api/metadata_blockchain_read', body);
    return res.data.data
}