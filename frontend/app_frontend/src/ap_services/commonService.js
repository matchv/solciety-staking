import axios from 'axios';
const { v4: uuidv4 } = require('uuid');

export function insert_rec(tableName, data) {
    let all = getAll(tableName);
    data['id'] = generateId(tableName)
    all.push(data)
    localStorage.setItem(tableName, JSON.stringify(all))
}

export function update_rec(tableName, data) {
    let all = getAll(tableName);
    let recordIndex = all.findIndex(x => x.id == data.id);
    all[recordIndex] = { ...data }
    localStorage.setItem(tableName, JSON.stringify(all));
}

export function delete_rec(tableName, id) {
    let all = getAll(tableName);
    all = all.filter(x => x.id != id);
    localStorage.setItem(tableName, JSON.stringify(all));
}

export function generateId(tableName) {
    var key = tableName + '/id';
    if (localStorage.getItem(key) == null)
        localStorage.setItem(key, '0')
    var id = parseInt(localStorage.getItem(key))
    localStorage.setItem(key, (++id).toString())
    return id;
}

const MAX_ROWS = 200
export async function search(tableName, searchField, keywords, orderBy, endpoint, mock) {
    if (mock) {
        let all = getAll(tableName);

        if (keywords != '') {
            keywords = keywords.toLowerCase()
            all = all.filter(x => x[searchField].toLowerCase().includes(keywords))
        }

        if (all.length > 0 && orderBy in all[0]) {
            all.sort((a, b) => (a[orderBy] > b[orderBy]) ? 1 : ((b[orderBy] > a[orderBy]) ? -1 : 0))
        }
        return all
    } else {
        let body = { keywords: keywords }
        let res = await axios.post('/api/metadata_token_read', body);
        return res.data.data
    }
}

export async function query_by_id(tableName, id) {
    let body = { id: id, index: tableName}
    let res = await axios.post('/api/query_by_id', body);
    console.log('query_by_id=', res.data.data)
    return res.data.data
}

export async function query_by_size(tableName, size) {
    let body = { size: size, index: tableName}
    let res = await axios.post('/api/metadata_query_by_size', body);
    console.log('query_by_size=', res.data.data)
    return res.data.data
}

export async function update_doc(tableName, doc) {
    let body = { doc: doc, index: tableName}
    let res = await axios.post('/api/metadata_update', body);
    // return res.data.data
    console.log('res=', res)
    return ''
}

export async function insert_doc(tableName, doc) {
    console.log('insert_doc====', doc);
    doc['doc_id'] = uuidv4();
    let body = { doc: doc, index: tableName}
    let res = await axios.post('/api/metadata_insert', body);
    console.log('res=', res)
    return res.data;
    // return []
}

export async function delete_doc(tableName, doc) {
    let body = { doc_id: doc.doc_id, index: tableName}
    let res = await axios.post('/api/metadata_delete', body);
    console.log('res=', res)
    return res.data;
}

export function getAll(tableName) {
    if (localStorage.getItem(tableName) == null)
        localStorage.setItem(tableName, JSON.stringify([]))
    let all = JSON.parse(localStorage.getItem(tableName));
    return all;
}