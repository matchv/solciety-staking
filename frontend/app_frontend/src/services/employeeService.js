const mock = true;

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
    all = all.filter(x => x.id != id)
    localStorage.setItem(tableName, JSON.stringify(all));
}

export function generateId(tableName) {
    var key = tableName+'/id';
    if (localStorage.getItem(key) == null)
        localStorage.setItem(key, '0')
    var id = parseInt(localStorage.getItem(key))
    localStorage.setItem(key, (++id).toString())
    return id;
}

export function getAll(tableName) {
    if (localStorage.getItem(tableName) == null)
        localStorage.setItem(tableName, JSON.stringify([]))
    let all = JSON.parse(localStorage.getItem(tableName));
    return all;
}