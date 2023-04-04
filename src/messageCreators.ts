import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, BaseMessageOptions } from 'discord.js';
import { serverVoteData } from './databaseActions';
import { CustomClient } from './customClient';

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

export async function voteCreateMessage(client: CustomClient, guild_id: string, voteData: serverVoteData, disableButtons: boolean = false): Promise<BaseMessageOptions> {
	const embed = new EmbedBuilder()
		.setTitle(voteData.name)
		.setDescription(voteData.description)
		.setColor('Blurple')
		.addFields([
			{ name: 'Röstningens alternativ', value: voteData.candidates.length > 0 ? '**' + voteData.candidates.join('**, **') + '**' : '*Inga än*' },
			{ name: 'Har startat', value: voteData.started ? 'Ja' : 'Nej', inline: true },
			{ name: 'Har avslutats', value: voteData.ended ? 'Ja' : 'Nej', inline: true },
			{ name: 'Kanal', value: `<#${voteData.channel_id}>` },
			{ name: 'Rösträtt', value: (await getRole(client, guild_id, voteData.can_vote_id)).toString(), inline: true },
			{ name: 'Ping', value: voteData.mention_role_id ? (await getRole(client, guild_id, voteData.mention_role_id)).toString() : '*Ingen*', inline: true },
			{ name: 'Röstningens id', value: `\`${guild_id}.${voteData.creation_time}\`` },
		])
		.setTimestamp(new Date(voteData.creation_time));
	if ('message_id' in voteData) {
		embed.addFields({ name: 'Meddelande', value: `https://discord.com/channels/${guild_id}/${voteData.channel_id}/${voteData.message_id}` });
	}

	if (voteData.started) embed.setColor('Green');
	if (voteData.ended) embed.setColor('Red');

	const components = voteCreateButtons(guild_id, voteData.creation_time, voteData.started, voteData.ended, disableButtons);

	return { embeds: [embed], components: components, content: `Skapa röstning

Använd olika kommandon för att ändra på saker tills röstningen är som du vill ha den
När du är klar kan du starta och sedan avsluta röstningen med knapparna nedan` };
}