"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('get-result')
    .setDescription('Get the result of a vote')
    .setNameLocalization('sv-SE', 'få-resultat')
    .setDescriptionLocalization('sv-SE', 'Få resultatet på en röstning')
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
    console.log(`${interaction.user.tag} tried to view result of ${vote_id}`);
    if (args[0] != interaction.guildId) {
        console.log(`${interaction.user.tag} failed to view results of ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte visa resultat')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    const votes = await interaction.client.customData.voteData.getVotes(interaction.client.database, args[0], args[1]);
    let true_votes = votes;
    if (votes === undefined) {
        true_votes = [];
    }
    if (voteData === undefined) {
        console.log(`${interaction.user.tag} failed to view results of ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkDone)(interaction, args[0], args[1]))
        return;
    const summary = (0, messageCreators_1.generateSummary)(choices, true_votes);
    await interaction.reply({ ...await (0, messageCreators_1.voteMessage)(interaction.client, args[0], voteData, choices, true, summary), ephemeral: true });
}, (0, idAutocorrect_1.default)(idAutocorrect_1.getDone));
