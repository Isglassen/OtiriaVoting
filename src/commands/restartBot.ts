import { SlashCommandBuilder, EmbedBuilder, Events } from 'discord.js';
import { CommandData, CustomCommandInteraction } from '../customClient';
import * as util from 'util';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('restart-bot')
		.setDescription('Safely restarts the bot')
		.setNameLocalization('sv-SE', 'starta-om-bot')
		.setDescriptionLocalization('sv-SE', 'Startar om boten på ett säkert sätt')
		.setDefaultMemberPermissions('0'),
	async function(interaction: CustomCommandInteraction) {
		if (interaction.user.id != interaction.client.config.bot.ownerId) {
			const embed = new EmbedBuilder()
				.setTitle('Stop!')
				.setDescription('Du äger inte denna boten, så du kan inte stänga av den')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle('Stannar!')
			.setDescription('Boten är helt av om 8.5 sekunder')
			.setColor('Blurple');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		console.log(`Stoping for ${interaction.user.tag} at ${new Date().toUTCString()}`);

		process.emit('SIGINT');
	},
);