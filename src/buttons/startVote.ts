import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { ButtonData, CustomButtonInteraction } from '../customClient';
import { checkCreateMessage } from '../messageCreators';
import { startVote } from '../automaticActions';

module.exports = new ButtonData(
	'start',
	async function(interaction: CustomButtonInteraction) {
		const args = interaction.customId.split('.');

		const logger = interaction.client.logger;

		logger.info(`${interaction.user.tag} tried to start vote ${args[1]}.${args[2]}`);

		if (!await checkCreateMessage(interaction)) return;

		const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], args[2]);

		if (voteData === undefined) {
			logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${args[2]} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const messageChannel = await interaction.guild.channels.fetch(voteData.channel_id);

		if (!(messageChannel.isTextBased() && messageChannel.permissionsFor(interaction.client.user).has(PermissionsBitField.Flags.SendMessages))) {
			logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${args[2]} because the bot can not send messages in channel`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kan inte skicka meddelanden i kanalen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[1], voteData.creation_time);

		if (choices.length < 2) {
			logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${voteData.creation_time} because there were too few options`);
			const embed = new EmbedBuilder()
				.setTitle('Lägg till lite alternativ')
				.setDescription('Det är svårt att rösta om något när det finns färre än 2 alternativ, och du har bara ' + choices.length)
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (!await startVote(interaction.client, interaction.guildId, voteData)) {return;}

		logger.info(`${interaction.user.tag} successfully started vote ${args[1]}.${args[2]}`);

		const embed = new EmbedBuilder()
			.setTitle('Startad!')
			.setDescription(`Röstningen har startats i ${messageChannel}`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
);