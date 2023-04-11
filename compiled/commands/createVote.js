"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messageCreators_1 = require("../messageCreators");
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('create-vote')
    .setDescription('Starts creating a vote')
    .setNameLocalization('sv-SE', 'skapa-röstning')
    .setDescriptionLocalization('sv-SE', 'Påbörjar skapandet av en röstning')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option => option
    .setName('name')
    .setDescription('The name of the vote')
    .setNameLocalization('sv-SE', 'namn')
    .setDescriptionLocalization('sv-SE', 'Röstningens namn')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(64))
    .addStringOption(option => option
    .setName('description')
    .setDescription('The description of the vote')
    .setNameLocalization('sv-SE', 'beskrivning')
    .setDescriptionLocalization('sv-SE', 'Röstningens beskrivning')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(512))
    .addChannelOption(option => option
    .setName('vote-channel')
    .setDescription('The channel for vote announcements')
    .setNameLocalization('sv-SE', 'röstnings-kanal')
    .setDescriptionLocalization('sv-SE', 'Kanalen för röstningsmeddelanden')
    .setRequired(true)
    .addChannelTypes(discord_js_1.ChannelType.GuildText))
    .addRoleOption(option => option
    .setName('voting-rights')
    .setDescription('The role required to participate in the vote')
    .setNameLocalization('sv-SE', 'rösträtt')
    .setDescriptionLocalization('sv-SE', 'Rollen som krävs för att delta i röstningen')
    .setRequired(false))
    .addRoleOption(option => option
    .setName('ping')
    .setDescription('The role to mention for vote announcements')
    .setDescriptionLocalization('sv-SE', 'Rollen som ska nämnas för röstningsmeddelanden')
    .setRequired(false))
    .addBooleanOption(option => option
    .setName('live-result')
    .setDescription('Show the current vote numbers even before the vote has ended')
    .setNameLocalization('sv-SE', 'live-resultat')
    .setDescriptionLocalization('sv-SE', 'Visa antalet röster även innan röstningen är slut')
    .setRequired(false)), async function (interaction) {
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description', true);
    const channel = interaction.options.getChannel('vote-channel', true, [discord_js_1.ChannelType.GuildText]);
    const rights = interaction.options.getRole('voting-rights', false);
    const can_vote_id = rights === null ? await (0, messageCreators_1.getRole)(interaction.client, interaction.guildId) : rights;
    const ping = interaction.options.getRole('ping', false);
    const mention_role_id = ping === null ? null : ping.id;
    const liveResult = interaction.options.getBoolean('live-result', false);
    const live_result = liveResult === null ? false : liveResult;
    // Create base command data
    const voteData = {
        name: name,
        description: description,
        status_message_channel_id: '',
        status_message_id: '',
        creation_time: (+new Date).toString(),
        started: false,
        ended: false,
        channel_id: channel.id,
        can_vote_id: can_vote_id.id,
        mention_role_id: mention_role_id,
        live_result: live_result,
        message_id: null,
    };
    console.log(`${interaction.user.tag} tried to created vote ${interaction.guildId}.${voteData.creation_time} at ${new Date(parseInt(voteData.creation_time)).toUTCString()}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    console.log(`${interaction.user.tag} created vote ${interaction.guildId}.${voteData.creation_time} at ${new Date(parseInt(voteData.creation_time)).toUTCString()}`);
    // Respond so we can save the message id
    const message = await interaction.reply({ ...await (0, messageCreators_1.voteCreateMessage)(interaction.client, interaction.guildId, voteData, [], true), fetchReply: true });
    voteData.status_message_channel_id = message.channelId;
    voteData.status_message_id = message.id;
    // Save command data
    await interaction.client.customData.votes.createVote(interaction.client.database, interaction.guildId, voteData);
    await message.edit(await (0, messageCreators_1.voteCreateMessage)(interaction.client, interaction.guildId, voteData, []));
});
