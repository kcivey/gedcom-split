#!/usr/bin/env node

const fs = require('fs');
const yargs = require('yargs');
const GedcomStore = require('./lib/gedcom-store');
const argv = getArgv();
const inputFile = argv._[0];
const gedcom = fs.readFileSync(inputFile, 'utf-8');
const store = new GedcomStore(gedcom);

console.log(store.getObject(argv.individual || argv.family));

function getArgv() {
    const argv = yargs
        .options({
            'family': {
                type: 'string',
                describe: 'family ID/pointer to export connected record for',
                alias: 'f',
            },
            'individual': {
                type: 'string',
                describe: 'individual ID/pointer to export connected record for',
                alias: 'i',
            },
            'up': {
                type: 'number',
                describe: 'number of generations up to go',
                default: Infinity,
            },
            'down': {
                type: 'number',
                describe: 'number of generations down to go',
                default: Infinity,
            },
            'collateral': {
                type: 'number',
                describe: 'maximum degree of relation for collateral relatives to include',
                default: Infinity,
            },
            'inlaws': {
                type: 'boolean',
                describe: 'include parents-in-law',
            },
        })
        .check(function (argv) {
            if (argv._.length !== 1) {
                throw new Error('One filename must be provided');
            }
            if (!argv.family && !argv.individual) {
                throw new Error('Either family or individual is required');
            }
            if (argv.family && argv.individual) {
                throw new Error('Only one of family and individual can be specified');
            }
            return true;
        })
        .strict(true)
        .argv;
    if (argv.family && !argv.family.includes('@')) {
        argv.family = '@' + argv.family + '@';
    }
    if (argv.individual && !argv.individual.includes('@')) {
        argv.individual = '@' + argv.individual + '@';
    }
    return argv;
}
