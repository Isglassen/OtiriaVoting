import { ActionRowBuilder, EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ModalSubmitInteraction, CacheType } from 'discord.js';
import { ButtonData, CustomButtomInteraction } from '../customClient';
import { voteCreateButtons, voteCreateMessage } from '../messageCreators';

module.exports = new ButtonData(
	'remove',
	async function(interaction: CustomButtomInteraction) {
		const args = interaction.customId.split('.');

		const currentData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], parseInt(args[2]));
		if (!currentData) {
			const embed = new EmbedBuilder()
				.setTitle('Något gick fel')
				.setDescription('Denna röstningen verkar inte finnas i databasen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });

			const newComponents = voteCreateButtons(interaction.guildId, parseInt(args[2]), false, false, true);
			const originalEmbed = new EmbedBuilder(interaction.message.embeds[0])
				.setColor('Red');

			await interaction.message.edit({ embeds: [originalEmbed], content: 'Röstningen finns inte i databasen längre', components: newComponents });

			return;
		}

		const startTime = new Date;
		console.log(`${interaction.user.tag} started option remove on vote ${args[1]}.${args[2]}: ${currentData.name} at ${startTime.toUTCString()}`);

		const modal = new ModalBuilder()
			.setCustomId(interaction.customId + '.' + +startTime)
			.setTitle('Ta bort alternativ (1 min timeout)')
			.addComponents([
				new ActionRowBuilder<TextInputBuilder>()
					.addComponents([
						new TextInputBuilder()
							.setCustomId('newOption')
							.setLabel('Skriv in ett alternativ at ta bort')
							.setStyle(TextInputStyle.Short)
							.setRequired(false),
					]),
			]);

		await interaction.showModal(modal);

		let modal_interaction: ModalSubmitInteraction<CacheType>;
		try {
			modal_interaction = await interaction.awaitModalSubmit({
				time: 60_000,
				filter: i => i.customId == interaction.customId + '.' + +startTime,
			});
		}
		catch (error) {
			if (error.code != 'InteractionCollectorError') throw error;
			console.log(`${interaction.user.tag} cancled option remove for vote ${args[1]}.${args[2]}: ${currentData.name} from ${startTime.toUTCString()}`);
			return;
		}

		const response = modal_interaction.fields.getTextInputValue('newOption');
		if (response.length < 1 || !currentData.candidates.includes(response)) {
			console.log(`${interaction.user.tag} entered invalid option to remove for vote ${args[1]}.${args[2]}: ${currentData.name} at ${new Date().toUTCString()}`);
			const replyEmbed = new EmbedBuilder()
				.setTitle('Ingen ändring')
				.setDescription('Du skrev inte in något alternativ eller så var det ett som inte finns')
				.setColor('Greyple');

			await modal_interaction.reply({ embeds: [replyEmbed], ephemeral: true });
			return;
		}
		console.log(`${interaction.user.tag} removed option ${response} from vote ${args[1]}.${args[2]}: ${currentData.name} at ${new Date().toUTCString()}`);

		const replyEmbed = new EmbedBuilder()
			.setTitle('Borttaget')
			.setDescription(`Har nu tagit bort alternativet **${response}**`)
			.setColor('Green');

		await modal_interaction.reply({ embeds: [replyEmbed], ephemeral: true });
		const newCandidates = [...currentData.candidates];
		newCandidates.splice(currentData.candidates.indexOf(response), 1);
		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[1], parseInt(args[2]), 'candidates', newCandidates);
		const fullData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], parseInt(args[2]));
		await interaction.message.edit(await voteCreateMessage(interaction.client, args[1], fullData));
	},
);