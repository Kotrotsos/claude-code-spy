// Main library exports - ties together all modules
module.exports = {
    colors: require('./colors'),
    utils: require('./utils'),
    logger: require('./logger'),
    config: require('./config'),
    core: require('./core'),
    input: require('./input'),
    models: require('./models'),
    watch: require('./watch')
};
