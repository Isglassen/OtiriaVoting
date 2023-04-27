import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { ButtonData, CustomButtomInteraction } from '../customClient';
import { checkCreateMessage, generateSummary, voteCreateMessage, voteMessage } from '../messageCreators';
import { endVote } from '../automaticActions';

module.exports = new ButtonData(
	'stop',
	async function(interaction: CustomButtomInteraction) {
		const args = interaction.customId.split('.');

		const logger = interaction.client.logger;

		logger.info(`${interaction.user.tag} tried to end vote ${args[1]}.${args[2]}`);

		if (!await checkCreateMessage(interaction)) return;

		const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], args[2]);

		if (voteData === undefined) {
			logger.info(`${interaction.user.tag} failed to end vote ${args[1]}.${args[2]} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const messageChannel = await interaction.guild.channels.fetch(voteData.channel_id);

		if (!(messageChannel.isTextBased() && messageChannel.permissionsFor(interaction.client.user).has(PermissionsBitField.Flags.SendMessages))) {
			logger.info(`${interaction.user.tag} failed to end vote ${args[1]}.${args[2]} because the bot can not send messages in channel`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kan inte skicka meddelanden i kanalen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await endVote(interaction.client, interaction.guildId, voteData);

		logger.info(`${interaction.user.tag} successfully ended vote ${args[1]}.${args[2]}`);

		const embed = new EmbedBuilder()
			.setTitle('Avslutad!')
			.setDescription(`Röstningen har nu avslutats och resultaten finns i ${messageChannel}`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
);