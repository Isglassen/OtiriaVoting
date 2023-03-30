const Database = require("./compiled/databaseActions.js").default;
const config = require("./bot-config.json");

let database = new Database(config.database)

async function main() {
  await database.connect()
  await database.firstData()
  await database.end()
}

main()