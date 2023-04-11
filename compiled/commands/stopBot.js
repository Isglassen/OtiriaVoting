"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const util = require("util");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('stop-bot')
    .setDescription('Safely stops the bot')
    .setNameLocalization('sv-SE', 'stanna-bot')
    .setDescriptionLocalization('sv-SE', 'Stannar boten på ett säkert sätt')
    .setDefaultMemberPermissions('0'), async function (interaction) {
    if (interaction.user.id != interaction.client.config.bot.ownerId) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Stop!')
            .setDescription('Du äger inte denna boten, så du kan inte stänga av den')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Stannar!')
        .setDescription('Boten är helt av om 5 sekunder')
        .setColor('Blurple');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Stoping for ${interaction.user.tag} at ${new Date().toUTCString()}`);
    console.log('Letting discord finish in 0.5 seconds');
    await util.promisify(setTimeout)(500);
    console.log('Logged out of discord. Waiting 5 seconds for database to finish');
    interaction.client.destroy();
    await util.promisify(setTimeout)(5000);
    console.log('Disconnecting from database');
    await interaction.client.database.end();
    setTimeout(process.exit, 2500);
});
