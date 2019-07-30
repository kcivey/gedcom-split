const parseGedcom = require('parse-gedcom').parse;
const {fixOptions, flatten, unique} = require('./utilities');

class GedcomStore {

    constructor(gedcom) {
        const rawList = parseGedcom(gedcom);
        this.objects = {};
        this.head = rawList.shift();
        this.trailer = rawList.pop();
        for (const raw of rawList) {
            if (this.objects[raw.pointer]) {
                throw new Error(`Duplicate pointer "${raw.pointer}" found`);
            }
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

    getAncestorsOrDescendants(type, options = {}) {
        const {min, max} = fixOptions(options, {min: 1, max: 20, avoid: []});
        const resultsByGeneration = this.getAncestorsOrDescendantsByGeneration(type, options);
        return unique(flatten(resultsByGeneration.slice(min, max + 1)));
    }

    getAncestorsOrDescendantsByGeneration(type, options) {
        const {max, avoid} = fixOptions(options, {min: 1, max: 20, avoid: []});
        const isDescendants = /^d/i.test(type);
        const resultsByGeneration = [[this]];
        const method = isDescendants ? 'getChildren' : 'getParents';
        for (let generation = 1; generation <= max; generation++) {
            const prevResults = resultsByGeneration[generation - 1];
            let results = flatten(prevResults.map(ind => ind[method]()));
            if (generation === 1 && avoid.length) {
                results = results.filter(ind => !avoid.includes(ind));
            }
            resultsByGeneration.push(results);
        }
        return resultsByGeneration;
    }

    getAncestors(options = {}) {
        return this.getAncestorsOrDescendants('a', options);
    }

    getDescendants(options = {}) {
        return this.getAncestorsOrDescendants('d', options);
    }

    getCollaterals(options = {}) {
        const {min, max} = fixOptions(options, {min: 1, max: 20});
        const ancestorsByGeneration = this.getAncestorsOrDescendantsByGeneration('a', max);
        const collaterals = [];
        const maxDegree = Math.min(max, ancestorsByGeneration.length - 1);
        for (let degree = 1; degree <= maxDegree; degree++) {
            const minUp = Math.max(1, min);
            for (let up = minUp; up <= maxDegree; up++) {
                const minDown = Math.max(1, min - up + 1);
                const maxDown = max - up + 1;
                if (minDown <= maxDown) {
                    collaterals.push(
                        flatten(
                            ancestorsByGeneration[up]
                                .map(function (individual) {
                                    return individual.getDescendants({
                                        min: minDown,
                                        max: maxDown,
                                        avoid: ancestorsByGeneration[up - 1],
                                    });
                                })
                        )
                    );
                }
            }
        }
        return unique(flatten(collaterals));
    }

    getName() {
        return this.getTree('NAME')[0].data;
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

    getAncestorsOrDescendants(type, options = {}) {
        const {min, max} = fixOptions(options, {min: 1, max: 20});
        const isDescendants = /^d/i.test(type);
        const resultsByGeneration = [[this.getParents()]];
        let start = 1;
        if (isDescendants) {
            resultsByGeneration.push(this.getChildren());
            start = 2;
        }
        const method = isDescendants ? 'getChildren' : 'getParents';
        for (let generation = start; generation <= max; generation++) {
            const prevResults = resultsByGeneration[generation - 1];
            resultsByGeneration.push(
                flatten(prevResults.map(ind => ind[method]()))
            );
        }
        return unique(flatten(resultsByGeneration.slice(min, max + 1)));
    }

    getAncestors(options = {}) {
        return this.getAncestorsOrDescendants('a', options);
    }

    getDescendants(options = {}) {
        return this.getAncestorsOrDescendants('d', options);
    }

}

module.exports = GedcomStore;
