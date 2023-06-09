"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('add-choice')
    .setDescription('Add a choice to the vote')
    .setNameLocalization('sv-SE', 'lägg-till-alternativ')
    .setDescriptionLocalization('sv-SE', 'Lägg till ett alternativ till röstningen')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option => option
    .setName('vote-id')
    .setDescription('The id of the vote')
    .setNameLocalization('sv-SE', 'röstnings-id')
    .setDescriptionLocalization('sv-SE', 'Röstningens id')
    .setRequired(true)
    .setAutocomplete(true))
    .addStringOption(option => option
    .setName('choice-name')
    .setDescription('The name of the choice to add')
    .setNameLocalization('sv-SE', 'alternativ-namn')
    .setDescriptionLocalization('sv-SE', 'Det nya alternativets namn')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(32))
    .addStringOption(option => option
    .setName('choice-description')
    .setDescription('The description of the choice to add')
    .setNameLocalization('sv-SE', 'alternativ-beskrivning')
    .setDescriptionLocalization('sv-SE', 'Det nya alternativets beskrivning')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(256)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const new_name = interaction.options.getString('choice-name', true);
    const new_description = interaction.options.getString('choice-description', true);
    const args = vote_id.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to add option ${new_name}: ${new_description} to ${vote_id}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    if (args[0] != interaction.guildId) {
        logger.info(`${interaction.user.tag} failed to add option to ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte lägga till alternativ')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const currentChoices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    if (currentChoices === undefined) {
        logger.info(`${interaction.user.tag} failed to add option to ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkCreating)(interaction, args[0], args[1]))
        return;
    if (currentChoices.some((val) => val.name == new_name)) {
        logger.info(`${interaction.user.tag} couldn't add option to ${vote_id} because it already had the specified name`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunde inte lägga till alternativ eftersom ett alternativ med samma namn redan finns')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (currentChoices.length >= 25) {
        logger.info(`${interaction.user.tag} couldn't add option to ${vote_id} because it has the maximum option count`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Röstningen har redan 25 alternativ, vilket är gränsen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    await interaction.client.customData.choices.addChoice(interaction.client.database, args[0], args[1], { name: new_name, description: new_description });
    logger.info(`${interaction.user.tag} successfully added option to ${vote_id}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Klart!')
        .setDescription(`Alternativet "${new_name}" har nu laggts till`)
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
