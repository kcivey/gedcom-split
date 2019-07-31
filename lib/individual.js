const Record = require('./record');
const Family = require('./family');
const {fixOptions, flatten, unique} = require('./utilities');

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
                this.children.push(...family.getChildren());
            }
        }
        return this.children;
    }

    getSpouses() {
        if (!this.spouses) {
            this.spouses = [];
            for (const family of this.getFamilies('FAMS')) {
                this.spouses.push(
                    ...family.getParents().filter(ind => ind.getPointer() !== this.getPointer())
                );
            }
        }
        return this.spouses;
    }

    getParents() {
        if (!this.parents) {
            this.parents = [];
            for (const family of this.getFamilies('FAMC')) {
                this.parents.push(...family.getParents());
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

    isExportable() {
        return this.store.isExportableIndividual(this);
    }

    getRaw(forExport = false) {
        return forExport ? this.getExportableRaw() : this.raw;
    }

    getExportableRaw() {
        if (!this.isExportable()) {
            return null;
        }
        if (this.exportableRecord === undefined) {
            const newTree = [];
            for (const item of this.getTree()) {
                const tag = item.tag;
                if (['FAMC', 'FAMS'].includes(tag)) {
                    const family = this.store.getObject(item.data);
                    if (!family.isExportable()) {
                        continue;
                    }
                }
                else if (tag === 'INDI') {
                    continue;
                }
                newTree.push(item);
            }
            this.exportableRecord = {...this.getRaw(), tree: newTree};
        }
        return this.exportableRecord;
    }

    getExportableObjects() {
        return this.getReferencedObjects(this.getExportableRaw())
            .filter(function (obj) {
                return !(obj instanceof Individual) && !(obj instanceof Family && !obj.isExportable());
            });
    }

}

module.exports = Individual;
