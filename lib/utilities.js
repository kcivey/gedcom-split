module.exports = {

    fixOptions(options, defaults) {
        for (const key of Object.keys(options)) {
            if (!defaults.hasOwnProperty(key)) {
                throw new Error(`Unrecognized option "${key}"`);
            }
        }
        return {...defaults, ...options};
    },

    flatten(arrays) {
        return [].concat(...arrays);
    },

    unique(array) {
        return [...new Set(array)];
    },

};
