// TODO: You can not escape mentions
// TODO: Doesn't actually fetch names (because it's a test)

/**
 * @param {string} text;
 */
function replaceMentions(text) {
	let roleIndex = text.indexOf('<@&');
	while (roleIndex > -1) {
		const endIndex = text.indexOf('>', roleIndex);
		if (endIndex == -1) {
			break;
		}

		const id = text.substring(roleIndex + 3, endIndex);

		if (!(/^\d+$/.test(id))) {
			roleIndex = text.indexOf('<@&', roleIndex + 3);
			continue;
		}

		text = text.replace('<@&' + id + '>', '@' + getRoleName(id));

		roleIndex = text.indexOf('<@&', roleIndex + 3);
	}

	let userIndex = text.indexOf('<@');
	while (userIndex > -1) {
		const endIndex = text.indexOf('>', userIndex);
		if (endIndex == -1) {
			break;
		}

		const id = text.substring(userIndex + 2, endIndex);

		if (!(/^\d+$/.test(id))) {
			userIndex = text.indexOf('<@', userIndex + 2);
			continue;
		}

		text = text.replace('<@' + id + '>', '@' + getUserNick(id));

		userIndex = text.indexOf('<@&', userIndex + 2);
	}

	return text;
}

const users = {
	'1234': 'Test user',
};

const roles = {
	'1111': 'Test name',
};

function getUserNick(id) {
	return users[id];
}

function getRoleName(id) {
	return roles[id];
}