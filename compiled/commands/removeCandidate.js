"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customClient_1 = require("../customClient");
const idAutocorrect_1 = require("../idAutocorrect");
const messageCreators_1 = require("../messageCreators");
module.exports = new customClient_1.CommandData(new discord_js_1.SlashCommandBuilder()
    .setName('remove-choice')
    .setDescription('Remove a choice from the vote')
    .setNameLocalization('sv-SE', 'ta-bort-alternativ')
    .setDescriptionLocalization('sv-SE', 'Ta bort ett alternativ från röstningen')
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
    .setDescription('The name of the choice to remove')
    .setNameLocalization('sv-SE', 'alternativ-namn')
    .setDescriptionLocalization('sv-SE', 'Namnet på alternativet att ta bort')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(32)
    .setAutocomplete(true)), async function (interaction) {
    const vote_id = interaction.options.getString('vote-id', true);
    const new_name = interaction.options.getString('choice-name', true);
    const args = vote_id.split('.');
    console.log(`${interaction.user.tag} tried to remove option ${new_name} from ${vote_id}`);
    if (!await (0, messageCreators_1.checkCreateMessage)(interaction))
        return;
    if (args[0] != interaction.guildId) {
        console.log(`${interaction.user.tag} failed to remove option of ${vote_id} because it's in an other guild`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kunde inte ta bort alternativ')
            .setDescription('Det id du anget är för en röstning på en annan server')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    const currentChoices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    if (currentChoices === undefined) {
        console.log(`${interaction.user.tag} failed to remove option from ${vote_id} because the vote is not in the database`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunnde inte hitta röstningen')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    if (!await (0, idAutocorrect_1.checkCreating)(interaction, args[0], args[1]))
        return;
    if (!currentChoices.some((val) => val.name == new_name)) {
        console.log(`${interaction.user.tag} couldn't remove option from ${vote_id} because the option didn't exist`);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Misslyckades')
            .setDescription('Kunde inte ta bort alternativ eftersom det inte finns ett alternativ med det namnet')
            .setColor('Red');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    await interaction.client.customData.choices.removeChoice(interaction.client.database, args[0], args[1], new_name);
    console.log(`${interaction.user.tag} successfully removed option from ${vote_id}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Klart!')
        .setDescription(`Alternativet "${new_name}" har nu tagits bort`)
        .setColor('Green');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    const infoMessageChannel = await interaction.guild.channels.fetch(newData.status_message_channel_id);
    if (!infoMessageChannel.isTextBased()) {
        console.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${args.join('.')}`);
        return;
    }
    const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);
    if (!infoMessage) {
        console.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${args.join('.')}`);
        return;
    }
    await infoMessage.edit(await (0, messageCreators_1.voteCreateMessage)(interaction.client, args[0], newData, choices, false));
}, async function (interaction) {
    if (interaction.options.getFocused(true).name == 'vote-id')
        return await (0, idAutocorrect_1.default)(idAutocorrect_1.getCreating)(interaction);
    const vote_id = interaction.options.getString('vote-id');
    if (typeof vote_id != 'string')
        return await interaction.respond([]);
    const args = vote_id.split('.');
    if (args[0] != interaction.guildId)
        return await interaction.respond([]);
    const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
    if (!Array.isArray(choices))
        return await interaction.respond([]);
    const filtered = choices.filter((val) => val.name.startsWith(interaction.options.getFocused()));
    await interaction.respond(filtered.map((val) => ({ name: val.name, value: val.name })));
});
