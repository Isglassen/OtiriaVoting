"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.SelectMenuData('vote', discord_js_1.ComponentType.StringSelect, async function (interaction) {
    if (!interaction.isStringSelectMenu())
        return;
    const args = interaction.customId.split('.');
    console.log(`${interaction.user.tag} tried to vote for ${args[1]}.${args[2]}`);
    const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], args[2]);
    if (voteData === undefined) {
        console.log(`${interaction.user.tag} failed to vote for ${args[1]}.${args[2]} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const can_vote_id = voteData.can_vote_id;
    if ((Array.isArray(interaction.member.roles) && !interaction.member.roles.includes(can_vote_id))
        || (!Array.isArray(interaction.member.roles)) && !interaction.member.roles.cache.some(role => role.id == can_vote_id)) {
        console.log(`${interaction.user.tag} failed to vote for ${args[1]}.${args[2]} because they did not have permissions`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Ingen rösträtt')
            .setDescription('Du saknar den roll som krävs för att rösta här')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    console.log(`${interaction.user.tag} successfully voted for ${args[1]}.${args[2]}`);
    await interaction.client.customData.voteData.setVote(interaction.client.database, args[1], args[2], interaction.user.id, interaction.values[0]);
    const true_votes = await interaction.client.customData.voteData.getVotes(interaction.client.database, args[1], args[2]);
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[1], args[2]);
    const summary = (0, messageCreators_1.generateSummary)(choices, true_votes);
    await interaction.message.edit(await (0, messageCreators_1.voteMessage)(interaction.client, args[1], voteData, choices, false, summary));
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Röstat')
        .setDescription(`Din röst har nu satts till "${interaction.values[0]}"`)
        .setColor('Green');
    await interaction.reply({ embeds: [embed], ephemeral: true });
});
