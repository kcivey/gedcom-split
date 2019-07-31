#!/usr/bin/env node

const fs = require('fs');
const stateNameToAbbr = require('./lib/state-name-to-abbr');
const inputFile = process.argv[2];
const lines = fs.readFileSync(inputFile, 'utf-8').split('\n');

for (const line of lines) {
    let newLine = line.trim();
    if (newLine === '') {
        continue;
    }
    const m = line.match(/^(\d\d?)(?:\s+(@[^@]+@))?\s+(\w+)\s*(.*)/);
    if (!m) {
        throw new Error(`Invalid GEDCOM line: ${line}`);
    }
    const [, level, pointer, tag, content] = m;
    if (tag === 'PLAC') {
        let placeParts = content.split(/\s*,\s*/);
        if (/^(?:USA?|United States(?: of America)?)$/.test(placeParts[placeParts.length - 1])) {
            placeParts.pop();
        }
        if (placeParts[placeParts.length - 1] === 'District of Columbia') {
            placeParts = placeParts.slice(-1);
        }
        if (placeParts.length > 1) {
            placeParts[placeParts.length - 1] = stateNameToAbbr(placeParts[placeParts.length - 1]);
            placeParts[placeParts.length - 2] = placeParts[placeParts.length - 2].replace('County', 'Co');
        }
        const newContent = placeParts.join(', ');
        const lineParts = [level];
        if (pointer) {
            lineParts.push(pointer);
        }
        lineParts.push(tag);
        if (content) {
            lineParts.push(newContent);
        }
        newLine = lineParts.join(' ');
    }
    writeln(newLine);
}

function writeln(...text) {
    process.stdout.write(text.join('') + '\n');
}
