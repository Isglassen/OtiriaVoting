import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, BaseMessageOptions, StringSelectMenuBuilder } from 'discord.js';
import { serverVoteData, voteData as userVoteData } from './databaseActions';
import { CustomClient } from './customClient';

const MESSAGE_CONTENT = `Skapa röstning

Använd olika kommandon för att ändra på saker tills röstningen är som du vill ha den
När du är klar kan du starta och sedan avsluta röstningen med knapparna nedan`;

export async function getRole(client: CustomClient, guild_id: string, role_id?: string) {
	const guild = await client.guilds.fetch(guild_id);
	if (typeof role_id != 'string') return guild.roles.everyone;
	return await guild.roles.fetch(role_id);
}

export function voteCreateButtons(guild_id: string, creation_time: number, started: boolean, ended: boolean, disableButtons: boolean): ActionRowBuilder<ButtonBuilder>[] {
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

export async function voteMessage(client: CustomClient, guild_id: string, voteData: serverVoteData, disableVoting: boolean = false, votes: {[name: string]: number}): Promise<BaseMessageOptions> {
	let total = 0;

	Object.values(votes).forEach(num => total += num);

	const embed = new EmbedBuilder()
		.setTitle(voteData.name)
		.setDescription(voteData.description)
		.setColor('Blurple')
		.addFields({
			name: 'För att rösta',
			value: voteData.ended ?
				`Röstningen för alla ${await getRole(client, guild_id, voteData.can_vote_id)} är nu över, så du kan inte rösta längre` :
				`Välj helt enkelt ett av alternativen nedan!\n${await getRole(client, guild_id, voteData.can_vote_id)} krävs för att rösta.`,
		})
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

	voteData.candidates.forEach((candidate) => {
		embed.addFields({ name: candidate.name + (voteData.ended ? (': ' + votes[candidate.name]) : ''), value: candidate.description });
		selectMenu.addOptions({
			label: candidate.name,
			value: candidate.name,
			description: candidate.description,
		});
	});

	const component = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

	return { content: voteData.mention_role_id == undefined ? undefined : (await getRole(client, guild_id, voteData.mention_role_id)).toString(), embeds: [embed], components: voteData.candidates.length < 1 || disableVoting ? undefined : [component] };
}

export async function voteCreateMessage(client: CustomClient, guild_id: string, voteData: serverVoteData, disableButtons: boolean = false): Promise<BaseMessageOptions> {
	const choices = voteData.candidates.map((val) => val.name);
	const embed = new EmbedBuilder()
		.setTitle(voteData.name)
		.setDescription(voteData.description)
		.setColor('Blurple')
		.addFields([
			{ name: 'Röstningens alternativ', value: choices.length > 0 ? '**' + choices.join('**, **') + '**' : '*Inga än*' },
			{ name: 'Alternativens beskrivningar', value: 'Du kan läsa alternativens beskrivningar med `/förhandsgranska`' },
			{ name: 'Stadie', value: voteData.ended ? 'Avslutad' : voteData.started ? 'Startad' : 'Skapas' },
			{ name: 'Kanal', value: `<#${voteData.channel_id}>` },
			{ name: 'Rösträtt', value: (await getRole(client, guild_id, voteData.can_vote_id)).toString(), inline: true },
			{ name: 'Ping', value: voteData.mention_role_id ? (await getRole(client, guild_id, voteData.mention_role_id)).toString() : '*Ingen*', inline: true },
			{ name: 'Röstningens id', value: `\`${voteData.creation_time}\`` },
		])
		.setTimestamp(new Date(voteData.creation_time));

	if ('message_id' in voteData) {
		embed.setURL(`https://discord.com/channels/${guild_id}/${voteData.channel_id}/${voteData.message_id}`);
	}

	if (voteData.started) embed.setColor('Green');
	if (voteData.ended) embed.setColor('Red');

	const components = voteCreateButtons(guild_id, voteData.creation_time, voteData.started, voteData.ended, disableButtons);

	return { embeds: [embed], components: components, content: MESSAGE_CONTENT };
}

export function generateSummary(candidates: serverVoteData['candidates'], rawVotes: userVoteData[]): {[name: string]: number} {
	const summary = {};

	candidates.forEach((choice) => summary[choice.name] = 0);
	rawVotes.forEach((vote) => summary[vote.voted_for] += 1);

	return summary;
}