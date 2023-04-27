"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('change-start')
    .setDescription('Change the start time of a vote')
    .setNameLocalization('sv-SE', 'ändra-start')
    .setDescriptionLocalization('sv-SE', 'Ändra start tiden på en röstning')
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
    .setName('start-time')
    .setDescription('The start time of the vote')
    .setNameLocalization('sv-SE', 'start-tid')
    .setDescriptionLocalization('sv-SE', 'Röstningens nya start tid')
    .setRequired(false)
    .setMinValue(-8640000000000)
    .setMaxValue(8640000000000)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const new_time = interaction.options.getInteger('start-time', false);
    const start_time = new_time === null ? null : `${new_time * 1000}`;
    const args = vote_id.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to change the start time of ${vote_id} to ${start_time}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    if (args[0] != interaction.guildId) {
        logger.info(`${interaction.user.tag} failed to change start time of ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte byta start tid')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const oldTime = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'start_time');
    if (oldTime === undefined) {
        logger.info(`${interaction.user.tag} failed to change start time of ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkCreating)(interaction, args[0], args[1]))
        return;
    if (oldTime === start_time) {
        logger.info(`${interaction.user.tag} didn't change start time of ${vote_id} because it already had the specified time`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Klart!')
            .setDescription('Start tiden ändrades inte eftersom du angav samma tid som redan var')
            .setColor('Green');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'start_time', start_time);
    logger.info(`${interaction.user.tag} successfully changed the start time of ${vote_id}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Klart!')
        .setDescription(`Start tiden har nu ändrats till "${start_time}"`)
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
}, (0, idAutocorrect_1.default)(idAutocorrect_1.getCreating));
