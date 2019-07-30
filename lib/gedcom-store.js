const parseGedcom = require('parse-gedcom').parse;

class GedcomStore {

    constructor(gedcom) {
        const rawList = parseGedcom(gedcom);
        this.objects = {};
        for (const raw of rawList) {
            this.objects[raw.pointer] = this.createObject(raw);
        }
    }

    createObject(raw) {
        const Class = raw.tag === 'INDI' ? Individual : raw.tag === 'FAM' ? Family : Record;
        return new Class(this, raw);
    }

    getObject(pointer) {
        return this.objects[pointer];
    }

}

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

class Individual extends Record {

    getFamilies(type) {
        if (!this.families) {
            this.families = {};
        }
        if (!this.families[type]) {
            this.families[type] = this.getTree(type).map(o => this.getObject(o.data));
        }
        return this.families[type];
    }

    getChildren() {
        if (!this.children) {
            this.children = [];
            for (const family of this.getFamilies('FAMS')) {
                this.children = this.children.concat(family.getChildren());
            }
        }
        return this.children;
    }

    getSpouses() {
        if (!this.spouses) {
            this.spouses = [];
            for (const family of this.getFamilies('FAMS')) {
                this.spouses = this.spouses.concat(
                    family.getParents()).filter(ind => ind.getPointer() !== this.getPointer()
                );
            }
        }
        return this.spouses;
    }

    getParents() {
        if (!this.parents) {
            this.parents = [];
            for (const family of this.getFamilies('FAMC')) {
                this.parents = this.parents.concat(family.getParents());
            }
        }
        return this.parents;
    }

}

class Family extends Record {

    getChildren() {
        if (!this.children) {
            this.children = this.getTree('CHIL')
                .map(o => this.getObject(o.data));
        }
        return this.children;
    }

    getParents() {
        if (!this.parents) {
            this.parents = this.getTree('HUSB').concat(this.getTree('WIFE'))
                .map(o => this.getObject(o.data));
        }
        return this.parents;
    }

}

module.exports = GedcomStore;
