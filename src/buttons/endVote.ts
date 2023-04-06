import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { ButtonData, CustomButtomInteraction } from '../customClient';
import { voteCreateMessage, voteMessage } from '../messageCreators';

module.exports = new ButtonData(
	'stop',
	async function(interaction: CustomButtomInteraction) {
		const args = interaction.customId.split('.');

		console.log(`${interaction.user.tag} tried to end vote ${args[1]}.${args[2]}`);

		const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], parseInt(args[2]));
		const votes = await interaction.client.customData.voteData.getVotes(interaction.client.database, args[1], parseInt(args[2]));

		if (voteData == null || votes === null) {
			console.log(`${interaction.user.tag} failed to end vote ${args[1]}.${args[2]} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const messageChannel = await interaction.guild.channels.fetch(voteData.channel_id);

		if (!(messageChannel.isTextBased() && messageChannel.permissionsFor(interaction.client.user).has(PermissionsBitField.Flags.SendMessages))) {
			console.log(`${interaction.user.tag} failed to end vote ${args[1]}.${args[2]} because the bot can not send messages in channel`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kan inte skicka meddelanden i kanalen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const summary = {};

		votes.forEach((vote) => {
			if (summary[vote.voted_for] === undefined) summary[vote.voted_for] = 0;
			summary[vote.voted_for] += 1;
		});

		const info_message = await messageChannel.messages.fetch(voteData.message_id);

		await info_message.edit(await voteMessage(interaction.client, args[1], voteData, true, summary));

		console.log(`${interaction.user.tag} successfully ended vote ${args[1]}.${args[2]}`);

		const embed = new EmbedBuilder()
			.setTitle('Avslutad!')
			.setDescription(`Röstningen har nu avslutats och resultaten finns i ${messageChannel}`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		const infoEmbed = new EmbedBuilder()
			.setTitle('Avslutad')
			.setDescription('Röstningen är nu avslutat och ni kan istället finna resultaten ovan')
			.setColor('Blurple');

		await info_message.reply({ embeds: [infoEmbed] });

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[1], parseInt(args[2]), 'ended', true);

		const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], parseInt(args[2]));
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

		await infoMessage.edit(await voteCreateMessage(interaction.client, args[1], newData, false));
	},
);