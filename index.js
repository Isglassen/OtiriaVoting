const { GatewayIntentBits } = require("discord.js");
const { CustomClient } = require('./compiled/customClient.js');
const config = require("./bot-config.json");

const client = new CustomClient({ intents: [GatewayIntentBits.Guilds] }, config.database);

async function main() {
  await client.database.connect()
  await client.database.firstData()
  await client.database.end()
}

main()