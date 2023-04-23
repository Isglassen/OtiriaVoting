import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { ButtonData, CustomButtomInteraction } from '../customClient';
import { checkCreateMessage, generateSummary, getRole, voteCreateMessage, voteMessage } from '../messageCreators';

module.exports = new ButtonData(
	'start',
	async function(interaction: CustomButtomInteraction) {
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

		const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[1], args[2]);

		if (choices.length < 2) {
			logger.info(`${interaction.user.tag} failed to start vote ${args[1]}.${args[2]} because there were too few options`);
			const embed = new EmbedBuilder()
				.setTitle('Lägg till lite alternativ')
				.setDescription('Det är svårt att rösta om något när det finns färre än 2 alternativ, och du har bara ' + choices.length)
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const info_message = await messageChannel.send({
			...await voteMessage(interaction.client, args[1], voteData, choices, false, generateSummary(choices, [])),
			content: voteData.mention_role_id !== null ? `${await getRole(interaction.client, interaction.guildId, voteData.mention_role_id)}` : '',
		});

		logger.info(`${interaction.user.tag} successfully started vote ${args[1]}.${args[2]}`);

		const embed = new EmbedBuilder()
			.setTitle('Startad!')
			.setDescription(`Röstningen har startats i ${messageChannel}`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[1], args[2], 'started', true);
		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[1], args[2], 'message_id', info_message.id);

		const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], args[2]);
		const infoMessageChannel = await interaction.guild.channels.fetch(newData.status_message_channel_id);

		if (!infoMessageChannel.isTextBased()) {
			logger.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${args.join('.')}`);
			return;
		}

		const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);

		if (!infoMessage) {
			logger.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${args.join('.')}`);
			return;
		}

		await infoMessage.edit(await voteCreateMessage(interaction.client, args[1], newData, choices, false));
	},
);