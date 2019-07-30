class Record {

    constructor(store, raw) {
        this.store = store;
        this.raw = raw;
    }

    getObject(pointer) {
        return this.store.getObject(pointer);
    }

    getData() {
        return this.raw.data;
    }

    getPointer() {
        return this.raw.pointer;
    }

    getTree(tag = '') {
        const tree = this.raw.tree;
        return tag ? tree.filter(o => o.tag === tag) : tree;
    }

    toJSON() {
        const obj = {...this};
        delete obj.store;
        return obj;
    }

}

module.exports = Record;
