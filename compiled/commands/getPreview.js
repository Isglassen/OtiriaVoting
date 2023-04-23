"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('preview')
    .setDescription('Get a preview of the vote')
    .setNameLocalization('sv-SE', 'förhandsgranska')
    .setDescriptionLocalization('sv-SE', 'Få en förhandsgranskning av en röstning')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option => option
    .setName('vote-id')
    .setDescription('The id of the vote')
    .setNameLocalization('sv-SE', 'röstnings-id')
    .setDescriptionLocalization('sv-SE', 'Röstningens id')
    .setRequired(true)
    .setAutocomplete(true)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const args = vote_id.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to preview vote ${vote_id}`);
    if (args[0] != interaction.guildId) {
        logger.info(`${interaction.user.tag} failed to preview vote ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte förhandsgranska')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
    if (voteData === undefined) {
        logger.info(`${interaction.user.tag} failed to preview vote ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    if (!await (0, idAutocorrect_1.checkCreating)(interaction, args[0], args[1]))
        return;
    logger.info(`${interaction.user.tag} successfully previewed vote ${vote_id}`);
    await interaction.reply({ ...await (0, messageCreators_1.voteMessage)(interaction.client, args[0], voteData, choices, true, (0, messageCreators_1.generateSummary)(choices, [])), ephemeral: true });
}, (0, idAutocorrect_1.default)(idAutocorrect_1.getCreating));
