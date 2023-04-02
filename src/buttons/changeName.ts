import { ActionRowBuilder, CacheType, EmbedBuilder, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ButtonData, CustomButtomInteraction } from '../customClient';
import { voteCreateMessage } from '../messageCreators';

// TODO: Check that interaction exists

module.exports = new ButtonData(
	'name',
	async function(interaction: CustomButtomInteraction) {
		const args = interaction.customId.split('.');

		const currentName = await interaction.client.customData.votes.getProperty(interaction.client.database, args[1], parseInt(args[2]), 'name');
		const startTime = new Date;
		console.log(`${interaction.user.tag} started name change on vote ${args[1]}.${args[2]}: ${currentName} at ${startTime.toUTCString()}`);

		const modal = new ModalBuilder()
			.setCustomId(interaction.customId)
			.setTitle('Ändra namn på röstningen (1 min timeout)')
			.addComponents([
				new ActionRowBuilder<TextInputBuilder>()
					.addComponents([
						new TextInputBuilder()
							.setCustomId('newName')
							.setLabel('Skriv in ett nytt namn')
							.setPlaceholder(currentName)
							.setStyle(TextInputStyle.Short)
							.setRequired(false),
					]),
			]);

		await interaction.showModal(modal);

		let modal_interaction: ModalSubmitInteraction<CacheType>;
		try {
			modal_interaction = await interaction.awaitModalSubmit({
				time: 60_000,
				filter: i => i.customId == interaction.customId,
			});
		}
		catch (error) {
			if (error.code != 'InteractionCollectorError') throw error;
			console.log(`${interaction.user.tag} cancled name change for vote ${args[1]}.${args[2]}: ${currentName} from ${startTime.toUTCString()}`);
			return;
		}

		const response = modal_interaction.fields.getTextInputValue('newName');
		if (response.length < 1 || response === currentName) {
			console.log(`${interaction.user.tag} entered the same name for vote ${args[1]}.${args[2]}: ${currentName} at ${new Date().toUTCString()}`);
			const replyEmbed = new EmbedBuilder()
				.setTitle('Ingen ändring')
				.setDescription('Du skrev inte in något namn eller så var det samma som tidigare')
				.setColor('Greyple');

			await modal_interaction.reply({ embeds: [replyEmbed], ephemeral: true });
			return;
		}
		console.log(`${interaction.user.tag} changed name of vote ${args[1]}.${args[2]}: ${currentName} to ${response} at ${new Date().toUTCString()}`);

		const replyEmbed = new EmbedBuilder()
			.setTitle('Ändrat')
			.setDescription(`Röstningens namn har nu ändrats till **${response}**`)
			.setColor('Green');

		await modal_interaction.reply({ embeds: [replyEmbed], ephemeral: true });
		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[1], parseInt(args[2]), 'name', response);
		const fullData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], parseInt(args[2]));
		await interaction.message.edit(await voteCreateMessage(interaction.client, args[1], fullData));
	},
);