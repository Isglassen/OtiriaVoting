const config = require('./bot-config.json');
const packageData = require('./package.json');
const { main } = require('./compiled/main');

main(config, packageData);