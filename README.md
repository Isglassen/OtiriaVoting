# OtiriaVoting

[![GitHub issues](https://img.shields.io/github/issues/Isglassen/OtiriaVoting)](https://github.com/Isglassen/OtiriaVoting/issues) [![GitHub Discussions](https://img.shields.io/github/discussions/Isglassen/OtiriaVoting)](https://github.com/Isglassen/OtiriaVoting/discussions) [![GitHub package.json version](https://img.shields.io/github/package-json/v/Isglassen/OtiriaVoting)](https://github.com/Isglassen/OtiriaVoting/commits/main)

En bot som håller i röstningar för Otiria på Minecraftservern jag spelar på

## Att göra

Saker jag vill få gjorda

- Ladda automatiskt upp compiled kod i releases
- Skapa en branch med compiled kod som min host kan ladda ner automatiskt

## Användning

### `bot-config.json`

`bot-config.json` är en fil som förväntas vara i root av projektet tillsammans med `index.js`, `deployCommands.js`, och `package.json`
Om du kan json schema kan du använda det i `bot-config.schema.json`. Annars kan du följa detta:

- `bot`: Information om boten
  - `token`: Botens discord token som du kan finna i *Bot* kategorin på [din bots sida](https://discord.com/developers/applications)
  - `clientId`: Botens client id/application id som du kan finna i *General Information* kategorin på [din bots sida](https://discord.com/developers/applications)
  - `ownerId`: Ditt user id på discord. [Where can I find my User/Server/Message ID?](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-)
- `database`: Information om databasen. Se även nedan hur du sätter upp den
  - `host`: Den domän eller ip som databasen ligger på
  - `user`: Den användare som boten ska logga in med
  - `password`: Lösenordet för att logga in
  - `port`: Den port som databasen ligger på
  - `database`: Det databasnamn på destinationen som ska användas

### Databas

Det är väldigt viktigt att sätta upp din SQL databas rätt eftersom boten inte kollar att den ska fungera.

Alla `BIGINT` kan också vara någon sorts string som har plats för ett discord id
Alla `STRING(n)` kan vara någon sorts string som har plats för `n` tecken (vi använder `VARCHAR(n)`)
Databasen behöver följande tabeller:

- `guilds`: Olika röstningar
  - `name`: `STRING(64) NOT NULL`, Röstningens namn
  - `description`: `STRING(512) NOT NULL`, Röstningens beskrivning
  - `channel_id`: `BIGINT NOT NULL`, Den kanal som röstningen ska vara i
  - `message_id`: `BIGINT`, Meddelandet som röstingen är på
  - `status_message_id`: `BIGINT NOT NULL`, Meddelandet som visar röstningens status för skaparen
  - `status_message_channel_id`: `BIGINT NOT NULL`, Kanalen för ovan kollumn
  - `creation_time`: `BIGINT NOT NULL`, Epoch timestamp i millisekunder för när röstningen skapades, och dens id
  - `started`: `BOOLEAN NOT NULL`, Ifall röstningen har startats eller inte
  - `ended`: `BOOLEAN NOT NULL`, Ifall röstningen har avslutats eller inte
  - `can_vote_id`: `BIGINT NOT NULL`, Den roll som krävs för att rösta
  - `mention_role_id`: `BIGINT`, Den roll som ska nämnas när röstningen startar
  - `guild_id`: `BIGINT NOT NULL`, Den guild som röstningen är i
  - `live_result`: `BOOLEAN NOT NULL`, Ifall röstningens resultat ska uppdateras live
  - `start_time`: `BIGINT`, Epoch timestamp i millisekunder för när röstningen ska starta/har startat
  - `end_time`: `BIGINT`, Epoch timestamp i millisekunder för när röstningen ska sluta/har slutat
- `choices`: Olika alternativ för röstningar
  - `guild_id`: `BIGINT NOT NULL`, den guild som alternativet hör till
  - `creation_time`: `BIGINT NOT NULL`, id till den röstning som alternativet hör till
  - `name`: `STRING(32) NOT NULL`, Namnet på alternativet
  - `description`: `STRING(256) NOT NULL`: Beskrivningen av alternativet
- `votes`: Olika röster på röstningar
  - `guild_id`: `BIGINT NOT NULL`, Den guild som rösten hör till
  - `creation_time`: `BIGINT NOT NULL`, id till den röstning som rösten hör till
  - `user_id`: `BIGINT NOT NULL`, Den användare som rösten hör till
  - `choice`: `STRING(32)`, Det alternativ som användaren har röstat på

### Använd source code

Om du har source coden så kan du följa dessa stegen för att köra boten

Du måste ha node.js installerat

- Första gången
  - Kör `npm install`
  - Lägg till en `bot-config.json` fil (se ovan)
- Efter ändringar (också första gången)
  - Kör `npm run build` (samma sak som `rd /s /q compiled && npx tsc`) i root mappen
    - Om du inte är på windows måste du manuelt ta bort compiled mappen om den finns, och sen köra `npx tsc`
  - Kör `node ./deployCommands.js`
- Varje start
  - Starta boten med `node .`

### Använd compiled kod

Om koden du har är compiled så kan du följa dessa stegen

Du måste ha node.js installerat

- Första gången
  - Kör `npm install`
  - Lägg till en `bot-config.json` fil (se ovan)
- Efter ändringar (också första gången)
  - Kör `node ./deployCommands.js`
- Varje start
  - Starta boten med `node .`
