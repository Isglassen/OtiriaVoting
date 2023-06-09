"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('change-end')
    .setDescription('Change the end time of a vote')
    .setNameLocalization('sv-SE', 'ändra-slut')
    .setDescriptionLocalization('sv-SE', 'Ändra slut tiden på en röstning')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option => option
    .setName('vote-id')
    .setDescription('The id of the vote')
    .setNameLocalization('sv-SE', 'röstnings-id')
    .setDescriptionLocalization('sv-SE', 'Röstningens id')
    .setRequired(true)
    .setAutocomplete(true))
    .addIntegerOption(option => option
    .setName('end-time')
    .setDescription('The end time of the vote. unixtimestamp.com')
    .setNameLocalization('sv-SE', 'slut-tid')
    .setDescriptionLocalization('sv-SE', 'Röstningens nya slut tid. unixtimestamp.com')
    .setRequired(false)
    .setMinValue(-8640000000000)
    .setMaxValue(8640000000000)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const new_time = interaction.options.getInteger('end-time', false);
    const end_time = new_time === null ? null : `${new_time * 1000}`;
    const args = vote_id.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to change the end time of ${vote_id} to ${end_time}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    if (args[0] != interaction.guildId) {
        logger.info(`${interaction.user.tag} failed to change end time of ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte byta slut tid')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const oldTime = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'end_time');
    if (oldTime === undefined) {
        logger.info(`${interaction.user.tag} failed to change end time of ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkNotEnd)(interaction, args[0], args[1]))
        return;
    if (oldTime === end_time) {
        logger.info(`${interaction.user.tag} didn't change end time of ${vote_id} because it already had the specified time`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Klart!')
            .setDescription('Slut tiden ändrades inte eftersom du angav samma tid som redan var')
            .setColor('Green');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'end_time', end_time);
    logger.info(`${interaction.user.tag} successfully changed the end time of ${vote_id}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Klart!')
        .setDescription(`Slut tiden har nu ändrats till "${end_time}"`)
        .setColor('Green');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    const infoMessageChannel = await interaction.guild.channels.fetch(newData.status_message_channel_id);
    if (!infoMessageChannel.isTextBased()) {
        logger.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${args.join('.')}`);
        return;
    }
    const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);
    if (!infoMessage) {
        logger.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${args.join('.')}`);
        return;
    }
    await infoMessage.edit(await (0, messageCreators_1.voteCreateMessage)(interaction.client, args[0], newData, choices, false));
    if (newData.message_id === null)
        return;
    const voteMessageChannel = await interaction.guild.channels.fetch(newData.channel_id);
    if (!voteMessageChannel.isTextBased()) {
        logger.warn(`Vote message channel ${newData.status_message_channel_id} is not text based for vote ${args.join('.')}`);
        return;
    }
    if (!voteMessageChannel.permissionsFor(interaction.client.user).has('SendMessages')) {
        logger.warn(`Vote message channel ${newData.status_message_channel_id} does not give permissions to send messages for vote ${args.join('.')}`);
        return;
    }
    const voteMessageObj = await voteMessageChannel.messages.fetch(newData.message_id);
    if (!voteMessageObj) {
        logger.warn(`Vote message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${args.join('.')}`);
        return;
    }
    const voteChoices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    const votes = await interaction.client.customData.voteData.getVotes(interaction.client.database, args[0], args[1]);
    await voteMessageObj.edit(await (0, messageCreators_1.voteMessage)(interaction.client, args[0], newData, voteChoices, false, (0, messageCreators_1.generateSummary)(voteChoices, votes)));
}, (0, idAutocorrect_1.default)(idAutocorrect_1.getNotEnd));
