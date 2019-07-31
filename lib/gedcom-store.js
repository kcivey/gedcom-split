const generateGedcom = require('generate-gedcom');
const parseGedcom = require('parse-gedcom').parse;
const Individual = require('./individual');
const Family = require('./family');
const Record = require('./record');
const {flatten, unique} = require('./utilities');

class GedcomStore {

    constructor(gedcom) {
        const rawList = parseGedcom(gedcom);
        this.objects = {};
        this.head = rawList.shift();
        if (rawList[0].tag === 'SUBM') {
            this.submitter = rawList.shift();
        }
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

    getExportableIndividuals() {
        return this.exportableIndividuals;
    }

    setExportableIndividuals(individuals) {
        this.exportableIndividuals = new Set(individuals);
        return this;
    }

    addSpousesToExportables() {
        const spouses = flatten([...this.getExportableIndividuals()].map(ind => ind.getSpouses()));
        this.addExportableIndividuals(spouses);
    }

    addExportableIndividual(individual) {
        return this.getExportableIndividuals().add(individual);
    }

    addExportableIndividuals(individuals) {
        for (const individual of individuals) {
            this.addExportableIndividual(individual);
        }
    }

    isExportableIndividual(individual) {
        if (!this.exportableIndividuals) {
            throw new Error('Need to set exportable individuals before calling');
        }
        return this.exportableIndividuals.has(individual);
    }

    getExportableObjects() {
        const objects = [];
        for (const individual of this.getExportableIndividuals()) {
            objects.push(individual, ...individual.getExportableObjects());
        }
        return unique(objects);
    }

    getGedcom() {
        return generateGedcom([this.head]) + '\n' +
            (this.submitter ? generateGedcom([this.submitter]) + '\n' : '') +
            this.getExportableObjects().map(obj => obj.getGedcom()).join('') +
            generateGedcom([this.trailer]) + '\n';
    }

}

module.exports = GedcomStore;
