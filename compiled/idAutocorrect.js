"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = exports.getNotEnd = exports.getDone = exports.checkDone = exports.checkNotEnd = exports.checkCreating = exports.getCreating = void 0;
const discord_js_1 = require("discord.js");
function idAutocorrect(getPossibilities) {
    return async function (interaction) {
        const focusedOption = interaction.options.getFocused();
        const choices = await getPossibilities(interaction.client, interaction.guildId);
        const filters = [
            choice => `${interaction.guildId}.${choice.creation_time}`.startsWith(focusedOption),
            choice => `${choice.creation_time}`.startsWith(focusedOption),
            choice => choice.name.startsWith(focusedOption),
        ];
        const filterFn = (choice) => {
            for (let i = 0; i < filters.length; i++) {
                if (filters[i](choice))
                    return true;
            }
            return false;
        };
        const filtered = choices.filter(filterFn);
        const choiceName = (choice) => {
            const choiceDate = new Date(parseInt(choice.creation_time));
            // Add repeating lead 0 (min - `${val}`.length) times to start of `${val}` and return it
            const lead0 = (val, min = 2) => '0'.repeat(Math.max(min - `${val}`.length, 0)) + `${val}`;
            return `${choice.name}: ${choiceDate.getFullYear()}-${lead0(choiceDate.getMonth() + 1)}-${lead0(choiceDate.getDate())} ${lead0(choiceDate.getHours())}:${lead0(choiceDate.getMinutes())}:${lead0(choiceDate.getSeconds())} (${lead0(choiceDate.getMilliseconds(), 3)})`;
        };
        interaction.client.logger.info(`Responding with votes: ${filtered.map(choice => choiceName(choice))}`);
        await interaction.respond(filtered.map(choice => ({ name: choiceName(choice), value: `${interaction.guildId}.${choice.creation_time}` })));
    };
}
exports.default = idAutocorrect;
async function getCreating(client, guildId) {
    const votes = (await client.database.pool.execute('SELECT * FROM guilds WHERE guild_id = ? AND started = 0', [guildId]))[0];
    const editable = [];
    if (!Array.isArray(votes))
        return editable;
    for (let i = 0; i < votes.length; i++) {
        const data = votes[i];
        if (!('creation_time' in data))
            continue;
        editable.push({
            name: data.name,
            description: data.description,
            channel_id: data.channel_id,
            message_id: data.message_id,
            status_message_id: data.status_message_id,
            status_message_channel_id: data.status_message_channel_id,
            creation_time: data.creation_time,
            started: !!data.started,
            ended: !!data.ended,
            can_vote_id: data.can_vote_id,
            mention_role_id: data.mention_role_id,
            live_result: !!data.live_result,
            start_time: data.start_time,
            end_time: data.end_time,
        });
    }
    return editable;
}
exports.getCreating = getCreating;
async function checkCreating(interaction, guild_id, creation_time) {
    const started = await interaction.client.customData.votes.getProperty(interaction.client.database, guild_id, creation_time, 'started');
    if (!started)
        return true;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Misslyckades')
        .setDescription('Röstningen har redans startats')
        .setColor('Red');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return false;
}
exports.checkCreating = checkCreating;
async function checkNotEnd(interaction, guild_id, creation_time) {
    const ended = await interaction.client.customData.votes.getProperty(interaction.client.database, guild_id, creation_time, 'ended');
    if (!ended)
        return true;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Misslyckades')
        .setDescription('Röstningen har redans avslutats')
        .setColor('Red');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return false;
}
exports.checkNotEnd = checkNotEnd;
async function checkDone(interaction, guild_id, creation_time) {
    const ended = await interaction.client.customData.votes.getProperty(interaction.client.database, guild_id, creation_time, 'ended');
    if (ended)
        return true;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Misslyckades')
        .setDescription('Röstningen har inte avslutats')
        .setColor('Red');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return false;
}
exports.checkDone = checkDone;
async function getDone(client, guildId) {
    const votes = (await client.database.pool.execute('SELECT * FROM guilds WHERE guild_id = ? AND ended = 1', [guildId]))[0];
    const editable = [];
    if (!Array.isArray(votes))
        return editable;
    for (let i = 0; i < votes.length; i++) {
        const data = votes[i];
        if (!('creation_time' in data))
            continue;
        editable.push({
            name: data.name,
            description: data.description,
            channel_id: data.channel_id,
            message_id: data.message_id,
            status_message_id: data.status_message_id,
            status_message_channel_id: data.status_message_channel_id,
            creation_time: data.creation_time,
            started: !!data.started,
            ended: !!data.ended,
            can_vote_id: data.can_vote_id,
            mention_role_id: data.mention_role_id,
            live_result: !!data.live_result,
            start_time: data.start_time,
            end_time: data.end_time,
        });
    }
    return editable;
}
exports.getDone = getDone;
async function getNotEnd(client, guildId) {
    const votes = (await client.database.pool.execute('SELECT * FROM guilds WHERE guild_id = ? AND ended = 0', [guildId]))[0];
    const editable = [];
    if (!Array.isArray(votes))
        return editable;
    for (let i = 0; i < votes.length; i++) {
        const data = votes[i];
        if (!('creation_time' in data))
            continue;
        editable.push({
            name: data.name,
            description: data.description,
            channel_id: data.channel_id,
            message_id: data.message_id,
            status_message_id: data.status_message_id,
            status_message_channel_id: data.status_message_channel_id,
            creation_time: data.creation_time,
            started: !!data.started,
            ended: !!data.ended,
            can_vote_id: data.can_vote_id,
            mention_role_id: data.mention_role_id,
            live_result: !!data.live_result,
            start_time: data.start_time,
            end_time: data.end_time,
        });
    }
    return editable;
}
exports.getNotEnd = getNotEnd;
async function getAll(client) {
    const votes = (await client.database.pool.execute('SELECT * FROM guilds'))[0];
    const editable = [];
    if (!Array.isArray(votes))
        return editable;
    for (let i = 0; i < votes.length; i++) {
        const data = votes[i];
        if (!('creation_time' in data))
            continue;
        editable.push({
            name: data.name,
            description: data.description,
            channel_id: data.channel_id,
            message_id: data.message_id,
            status_message_id: data.status_message_id,
            status_message_channel_id: data.status_message_channel_id,
            creation_time: data.creation_time,
            started: !!data.started,
            ended: !!data.ended,
            can_vote_id: data.can_vote_id,
            mention_role_id: data.mention_role_id,
            live_result: !!data.live_result,
            start_time: data.start_time,
            end_time: data.end_time,
        });
    }
    return editable;
}
exports.getAll = getAll;
