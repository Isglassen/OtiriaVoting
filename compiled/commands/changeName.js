"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('change-name')
    .setDescription('Change the name of a vote')
    .setNameLocalization('sv-SE', 'ändra-namn')
    .setDescriptionLocalization('sv-SE', 'Ändra namnet på en röstning')
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
    .setName('name')
    .setDescription('The name of the vote')
    .setNameLocalization('sv-SE', 'namn')
    .setDescriptionLocalization('sv-SE', 'Röstningens nya namn')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(64)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const new_name = interaction.options.getString('name', true);
    const args = vote_id.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to change the name of ${vote_id} to ${new_name}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    if (args[0] != interaction.guildId) {
        logger.info(`${interaction.user.tag} failed to change name of ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte byta namn')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const oldName = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'name');
    if (oldName === undefined) {
        logger.info(`${interaction.user.tag} failed to change name of ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkCreating)(interaction, args[0], args[1]))
        return;
    if (oldName == new_name) {
        logger.info(`${interaction.user.tag} didn't change name of ${vote_id} because it already had the specified name`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Klart!')
            .setDescription('Namnet ändrades inte eftersom du angav samma namn som redan var')
            .setColor('Green');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'name', new_name);
    logger.info(`${interaction.user.tag} successfully changed the name of ${vote_id}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Klart!')
        .setDescription(`Namnet har nu ändrats till "${new_name}"`)
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
