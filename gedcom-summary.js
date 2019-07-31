#!/usr/bin/env node

const fs = require('fs');
const GedcomStore = require('./lib/gedcom-store');
const inputFiles = process.argv.slice(2);
const recordTypes = {
    SUBM: 'Submitter',
    INDI: 'Individuals',
    FAM: 'Families',
    SOUR: 'Sources',
    REPO: 'Repositories',
};

for (const inputFile of inputFiles) {
    write(inputFile, '\n');
    const gedcom = fs.readFileSync(inputFile, 'utf-8');
    const store = new GedcomStore(gedcom);
    const stats = {
        'Lines': store.getOriginalLineCount().toLocaleString(),
    };
    for (const [key, value] of Object.entries(store.getRecordTypeCounts())) {
        const name = recordTypes[key] || `${key} records`;
        stats[name] = value.toLocaleString();
    }
    for (const [key, value] of Object.entries(stats)) {
        write(key.padEnd(12), value.padStart(12), '\n');
    }
    write('\n');
}

function write(...text) {
    return process.stdout.write(text.join(''));
}
