import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, BaseMessageOptions, StringSelectMenuBuilder, TextChannel, MessageComponentInteraction, ChatInputCommandInteraction } from 'discord.js';
import { choiceData, serverVoteData, voteData as userVoteData } from './databaseActions';
import { CustomClient, CustomInteraction } from './customClient';

const MESSAGE_CONTENT = `Skapa röstning

Använd olika kommandon för att ändra på saker tills röstningen är som du vill ha den
När du är klar kan du starta och sedan avsluta röstningen med knapparna nedan`;

// TODO: Change start_time and end_time to the real time it happened

export async function getRole(client: CustomClient, guild_id: string, role_id?: string) {
	const guild = await client.guilds.fetch(guild_id);
	if (typeof role_id != 'string') return guild.roles.everyone;
	return await guild.roles.fetch(role_id);
}

export function voteCreateButtons(guild_id: string, creation_time: string, started: boolean, ended: boolean, disableButtons: boolean): ActionRowBuilder<ButtonBuilder>[] {
	return [
		new ActionRowBuilder<ButtonBuilder>()
			.addComponents([
				new ButtonBuilder()
					// .setEmoji('✅')
					.setLabel('Starta röstning')
					.setStyle(ButtonStyle.Success)
					.setCustomId(`start.${guild_id}.${creation_time}`)
					.setDisabled(started || disableButtons),
				new ButtonBuilder()
					// .setEmoji('✖️')
					.setLabel('Avsluta röstning')
					.setStyle(ButtonStyle.Danger)
					.setCustomId(`stop.${guild_id}.${creation_time}`)
					.setDisabled(!started || ended || disableButtons),
			]),
	];
}

export async function voteMessage(client: CustomClient, guild_id: string, voteData: serverVoteData, choiceList: choiceData[], disableVoting: boolean = false, votes: {[name: string]: number}, message_id: string): Promise<BaseMessageOptions> {
	let total = 0;

	Object.values(votes).forEach(num => total += num);

	const embed = new EmbedBuilder()
		.setTitle(voteData.name)
		.setDescription(voteData.description)
		.setColor('Blurple')
		.addFields([{
			name: 'För att rösta',
			value: voteData.ended ?
				`Röstningen för alla med ${await getRole(client, guild_id, voteData.can_vote_id)} är nu över, så du kan inte rösta längre` :
				`Välj helt enkelt ett av alternativen nedan!\n${await getRole(client, guild_id, voteData.can_vote_id)} krävs för att rösta.`,
		},
		{
			name: 'Tider',
			value: `Startade: <t:${voteData.end_time}:F>; ${voteData.ended ? 'Slutade' : 'Slutar'}: ${voteData.end_time === null ? '*Manuellt*' :
				voteData.ended ? `<t:${voteData.end_time}:F>` : `<t:${voteData.end_time}:F> (<t:${voteData.end_time}:R>)}`}`,
		}])
		.setFooter({ text: `Totala röster: ${total}` });

	if (voteData.ended) {
		embed.setColor('Greyple');
	}

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(`vote.${guild_id}.${voteData.creation_time}`)
		.setDisabled(voteData.ended || disableVoting)
		.setMaxValues(1)
		.setMinValues(1)
		.setPlaceholder('Välj alternativ');

	choiceList.forEach((candidate) => {
		embed.addFields({ name: candidate.name + (voteData.ended || voteData.live_result ? (': ' + votes[candidate.name]) : ''), value: candidate.description });
		selectMenu.addOptions({
			label: candidate.name,
			value: candidate.name,
			description: candidate.description,
		});
	});

	const component = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

	const out: BaseMessageOptions = { content: '', embeds: [embed], components: [] };

	if (voteData.mention_role_id !== null) {
		out.content = `${await getRole(client, guild_id, voteData.mention_role_id)}`;
	}

	if (choiceList.length > 1 && !disableVoting) {
		out.components = [component];
	}

	return out;
}

export async function checkCreateMessage(interaction: MessageComponentInteraction | ChatInputCommandInteraction): Promise<boolean> {
	if (!interaction.channel.permissionsFor(interaction.client.user).has('SendMessages')) {
		const embed = new EmbedBuilder()
			.setTitle('Misslyckades')
			.setDescription('Kunde inte utföra kommandot eftersom boten inte får skriva i denna kanalen')
			.setColor('Red');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		return false;
	}

	return true;
}

export async function voteCreateMessage(client: CustomClient, guild_id: string, voteData: serverVoteData, choiceList: choiceData[], disableButtons: boolean = false): Promise<BaseMessageOptions> {
	const choices = choiceList.map((val) => val.name);
	const embed = new EmbedBuilder()
		.setTitle(voteData.name)
		.setDescription(voteData.description)
		.setColor('Blurple')
		.addFields([
			{ name: 'Röstningens alternativ', value: choices.length > 0 ? '**' + choices.join('**, **') + '**' : '*Inga än*' },
			{ name: 'Alternativens beskrivningar', value: 'Du kan läsa alternativens beskrivningar med `/förhandsgranska`' },
			{ name: 'Stadie', value: voteData.ended ? 'Avslutad' : voteData.started ? 'Startad' : 'Skapas', inline: true },
			{ name: 'Kanal', value: `<#${voteData.channel_id}>`, inline: true },
			{ name: 'Live resultat', value: voteData.live_result ? 'Ja' : 'Nej', inline: true },
			{ name: 'Rösträtt', value: `${await getRole(client, guild_id, voteData.can_vote_id)}`, inline: true },
			{ name: 'Ping', value: voteData.mention_role_id ? `${await getRole(client, guild_id, voteData.mention_role_id)}` : '*Ingen*', inline: true },
			{ name: 'Automatiska tider', value: 'Automatiska tider aktiveras som tidigast 10 minuter efter att boten startat efter t.ex. en krasch. Detta är så att det finns tid att ändra på de' },
			{ name: 'Startar', value: voteData.start_time === null ? '*Manuellt*' : `<t:${voteData.start_time.substring(0, voteData.start_time.length - 3)}:f>`, inline: true },
			{ name: 'Slutar', value: voteData.end_time === null ? '*Manuellt*' : `<t:${voteData.start_time.substring(0, voteData.start_time.length - 3)}:f>`, inline: true },
		])
		.setFooter({ text: voteData.creation_time })
		.setTimestamp(new Date(parseInt(voteData.creation_time)));

	if (voteData.message_id !== null) {
		embed.setURL(`https://discord.com/channels/${guild_id}/${voteData.channel_id}/${voteData.message_id}`);
	}

	if (voteData.started) embed.setColor('Green');
	if (voteData.ended) embed.setColor('Red');

	const components = voteCreateButtons(guild_id, voteData.creation_time, voteData.started, voteData.ended, disableButtons);

	return { embeds: [embed], components: components, content: MESSAGE_CONTENT };
}

export function generateSummary(candidates: choiceData[], rawVotes: userVoteData[]): {[name: string]: number} {
	const summary = {};

	candidates.forEach((choice) => summary[choice.name] = 0);
	rawVotes.forEach((vote) => summary[vote.voted_for] += 1);

	return summary;
}