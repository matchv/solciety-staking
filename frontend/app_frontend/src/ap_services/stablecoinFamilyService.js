import axios from 'axios';

export async function getAll() {
    let res = await axios.post('/api/metadata_stablecoin_family_all', {});
    return res.data.data
}

export async function update(tableName, searchField, keywords, orderBy) {
    let body = { keywords: keywords }
    let res = await axios.post('/api/metadata_token_read', body);
    return res.data.data
}