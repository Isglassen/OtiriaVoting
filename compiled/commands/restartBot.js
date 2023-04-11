"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('restart-bot')
    .setDescription('Safely restarts the bot')
    .setNameLocalization('sv-SE', 'starta-om-bot')
    .setDescriptionLocalization('sv-SE', 'Startar om boten på ett säkert sätt')
    .setDefaultMemberPermissions('0'), async function (interaction) {
    if (interaction.user.id != interaction.client.config.bot.ownerId) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Stop!')
            .setDescription('Du äger inte denna boten, så du kan inte starta om den')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Startar om!')
        .setDescription('Boten är helt av om 8.5 sekunder')
        .setColor('Blurple');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Restarting for ${interaction.user.tag} at ${new Date().toUTCString()}`);
    process.emit('SIGINT');
});
