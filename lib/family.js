const Record = require('./record');
const {fixOptions, flatten, unique} = require('./utilities');

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

    getCollaterals(options = {}) {
        return unique(flatten(
            this.getParents().map(ind => ind.getCollaterals(options))
        ));
    }

}

module.exports = Family;
