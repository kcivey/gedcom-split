#!/usr/bin/env node

const fs = require('fs');
const yargs = require('yargs');
const GedcomStore = require('./lib/gedcom-store');
const {flatten, unique} = require('./lib/utilities');
const argv = getArgv();
const inputFile = argv._[0];
const gedcom = fs.readFileSync(inputFile, 'utf-8');
const store = new GedcomStore(gedcom);
const start = store.getObject(argv.individual || argv.family);
const degree = argv.degree;
const types = argv.types;
const typeMethod = {
    ancestors: 'getAncestors',
    descendants: 'getDescendants',
    collateral: 'getCollaterals',
};
const individualsToExport = unique(flatten(
    types.map(function (type) {
        const method = typeMethod[type];
        return start[method]({min: 0, max: degree});
    })
));
console.log(individualsToExport.map(ind => ind.getName()));

function getArgv() {
    const argv = yargs
        .options({
            family: {
                type: 'string',
                describe: 'family ID/pointer to export connected record for',
                alias: 'f',
            },
            individual: {
                type: 'string',
                describe: 'individual ID/pointer to export connected record for',
                alias: 'i',
            },
            degree: {
                type: 'number',
                describe: 'maximum degree of relatedness to export',
                default: 20,
                alias: 'd',
            },
            types: {
                type: 'array',
                describe: 'types of relatives to export',
                default: ['ancestors', 'descendants', 'collateral'],
                alias: 't',
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
