"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('set-live-result')
    .setDescription('Change if the vote should have live results')
    .setNameLocalization('sv-SE', 'sätt-live-resultat')
    .setDescriptionLocalization('sv-SE', 'Ändra ifall röstningen ska ha live resultat')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option => option
    .setName('vote-id')
    .setDescription('The id of the vote')
    .setNameLocalization('sv-SE', 'röstnings-id')
    .setDescriptionLocalization('sv-SE', 'Röstningens id')
    .setRequired(true)
    .setAutocomplete(true))
    .addBooleanOption(option => option
    .setName('live-result')
    .setDescription('Show the current vote numbers even before the vote has ended')
    .setNameLocalization('sv-SE', 'live-resultat')
    .setDescriptionLocalization('sv-SE', 'Visa antalet röster även innan röstningen är slut')
    .setRequired(true)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const live_result = interaction.options.getBoolean('live-result', true);
    const args = vote_id.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to change live result of ${vote_id}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    if (args[0] != interaction.guildId) {
        logger.info(`${interaction.user.tag} failed to change live result of ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte ändra live resultat')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const currentLiveResult = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'live_result');
    if (currentLiveResult === undefined) {
        logger.info(`${interaction.user.tag} failed to change live result of ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkCreating)(interaction, args[0], args[1]))
        return;
    if (currentLiveResult === live_result) {
        logger.info(`${interaction.user.tag} couldn't change live result of ${vote_id} because it already had the specified value`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Ingen ändring')
            .setDescription('Värdet du anget är samma som redan var')
            .setColor('Green');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'live_result', live_result);
    logger.info(`${interaction.user.tag} successfully changed live result of ${vote_id}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Klart!')
        .setDescription('Har nu ändrat live resulat till det angivna värdet')
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
