"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const messageCreators_1 = require("../messageCreators");
const automaticActions_1 = require("../automaticActions");
module.exports = new customClient_1.ButtonData('start', async function (interaction) {
    const args = interaction.customId.split('.');
    const logger = interaction.client.logger;
    logger.info(`${interaction.user.tag} tried to start vote ${args[1]}.${args[2]}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], args[2]);
    if (voteData === undefined) {
        logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${args[2]} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const messageChannel = await interaction.guild.channels.fetch(voteData.channel_id);
    if (!(messageChannel.isTextBased() && messageChannel.permissionsFor(interaction.client.user).has(discord_js_1.PermissionsBitField.Flags.SendMessages))) {
        logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${args[2]} because the bot can not send messages in channel`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kan inte skicka meddelanden i kanalen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[1], voteData.creation_time);
    if (choices.length < 2) {
        logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${voteData.creation_time} because there were too few options`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Lägg till lite alternativ')
            .setDescription('Det är svårt att rösta om något när det finns färre än 2 alternativ, och du har bara ' + choices.length)
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, automaticActions_1.startVote)(interaction.client, interaction.guildId, voteData)) {
        return;
    }
    logger.info(`${interaction.user.tag} successfully started vote ${args[1]}.${args[2]}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Startad!')
        .setDescription(`Röstningen har startats i ${messageChannel}`)
        .setColor('Green');
    await interaction.reply({ embeds: [embed], ephemeral: true });
});
