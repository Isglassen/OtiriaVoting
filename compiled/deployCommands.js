"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployCommands = void 0;
const discord_js_1 = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
function deployCommands({ bot }) {
    const commands = [];
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if ('data' in command && 'execute' in command) {
            console.log(`Loading ${file}`);
            commands.push(command.data.toJSON());
        }
        else {
            console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
        }
    }
    // Construct and prepare an instance of the REST module
    const rest = new discord_js_1.REST({ version: '10' }).setToken(bot.token);
    // and deploy your commands!
    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(('guildId' in bot && typeof bot.guildId == 'string') ?
                discord_js_1.Routes.applicationGuildCommands(bot.clientId, bot.guildId) :
                discord_js_1.Routes.applicationCommands(bot.clientId), { body: commands });
            if (typeof data == 'object' && data !== null && 'length' in data)
                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        }
        catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();
}
exports.deployCommands = deployCommands;
