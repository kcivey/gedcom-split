const generateGedcom = require('generate-gedcom');
const {unique} = require('./utilities');

class Record {

    constructor(store, raw) {
        this.store = store;
        this.raw = raw;
    }

    getTag() {
        return this.raw.tag;
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

    getObject(pointer) {
        return this.store.getObject(pointer);
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

    getReferencedPointers(raw = this.getRaw(), history = []) {
        console.warn(raw.tag, history)
        const pointers = [];
        const pointer = raw.data;
        if (looksLikePointer(pointer)) {
            if (history.includes(pointer)) {
                return [];
            }
            const obj = this.getObject(pointer);
            if (obj.getTag() === 'INDI') {
                return [];
            }
            history.push(pointer);
            pointers.push(pointer, ...obj.getReferencedPointers(obj.getRaw(true), history));
        }
        for (const item of raw.tree) {
            pointers.push(...this.getReferencedPointers(item, history));
        }
        return unique(pointers);
    }

    getReferencedObjects(raw) {
        return this.getReferencedPointers(raw)
            .map(pointer => this.store.getObject(pointer));
    }

}

function looksLikePointer(s) {
    return /^@.+@$/.test(s);
}

module.exports = Record;
