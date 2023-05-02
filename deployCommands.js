const config = require('./bot-config.json');
const { deployCommands } = require('./compiled/deployCommands');

deployCommands(config);