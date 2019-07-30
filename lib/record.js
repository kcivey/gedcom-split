const generateGedcom = require('generate-gedcom');
const {unique} = require('./utilities');

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

    getRaw() {
        return this.raw;
    }

    getGedcom() {
        return generateGedcom([this.getRaw(true)]) + '\n';
    }

    unsetExportableRaw() {
        delete this.exportableRaw;
    }

    getReferencedPointers(raw) {
        let pointers = looksLikePointer(raw.data) ? [raw.data] : [];
        for (const item of raw.tree) {
            pointers = pointers.concat(this.getReferencedPointers(item));
        }
        return unique(pointers);
    }

}

function looksLikePointer(s) {
    return /^@.+@$/.test(s);
}

module.exports = Record;
