import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CommandData, CustomCommandInteraction } from '../customClient';
import * as util from 'util';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('stop-bot')
		.setDescription('Safely stops the bot')
		.setNameLocalization('sv-SE', 'stanna-bot')
		.setDescriptionLocalization('sv-SE', 'Stannar boten på ett säkert sätt')
		.setDefaultMemberPermissions('0'),
	async function(interaction: CustomCommandInteraction) {
		async function noPermission() {
			const embed = new EmbedBuilder()
				.setTitle('Stop!')
				.setDescription('Du äger inte denna boten, så du kan inte stänga av den')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if (interaction.user.id != interaction.client.config.bot.ownerId) {
			await noPermission();
			return;
		}

		const embed = new EmbedBuilder()
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
		await interaction.client.database.saveAll(interaction.client.customData);
		await interaction.client.database.end();
	},
);