const parseGedcom = require('parse-gedcom').parse;
const Individual = require('./individual');
const Family = require('./family');
const Record = require('./record');

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

module.exports = GedcomStore;
