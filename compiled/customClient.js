"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomClient = exports.ButtonData = exports.SelectMenuData = exports.CommandData = void 0;
const discord_js_1 = require("discord.js");
const databaseActions_1 = require("./databaseActions");
const automaticActions_1 = require("./automaticActions");
class CommandData {
    data;
    execute;
    autocomplete;
    constructor(data, execute, autocomplete) {
        this.data = data;
        this.execute = execute;
        this.autocomplete = autocomplete;
    }
}
exports.CommandData = CommandData;
class SelectMenuData {
    name;
    type;
    execute;
    constructor(name, type, execute) {
        this.name = name;
        this.type = type;
        this.execute = execute;
    }
}
exports.SelectMenuData = SelectMenuData;
class ButtonData {
    name;
    execute;
    constructor(name, execute) {
        this.name = name;
        this.execute = execute;
    }
}
exports.ButtonData = ButtonData;
class CustomClient extends discord_js_1.Client {
    database;
    customData;
    botData;
    config;
    logger;
    updateTask;
    constructor(options, config, logger, interactionHandler) {
        super(options);
        this.logger = logger;
        this.customData = new databaseActions_1.DatabaseData(this.logger);
        this.on(discord_js_1.Events.InteractionCreate, interactionHandler);
        this.config = config;
        this.database = new databaseActions_1.default(config.database);
        this.botData = { commands: new discord_js_1.Collection, buttons: new discord_js_1.Collection, selectMenus: new discord_js_1.Collection, interactionHandler: interactionHandler };
    }
    destroy() {
        clearInterval(this.updateTask);
        super.destroy();
    }
    startUpdates(packageData) {
        const time = new Date;
        time.setMinutes(time.getMinutes() + 10);
        time.setSeconds(0);
        time.setMilliseconds(0);
        const timeString = (`${time.getUTCHours()}`.length < 2 ? '0' + time.getUTCHours() : `${time.getUTCHours()}`) +
            ':' + (`${time.getUTCMinutes()}`.length < 2 ? '0' + time.getUTCMinutes() : `${time.getUTCMinutes()}`);
        this.user.setPresence({
            status: 'idle',
            activities: [{
                    name: `Startat om. Kör automatiska kommandon ${timeString} UTC`,
                    type: discord_js_1.ActivityType.Playing,
                }],
        });
        setTimeout(() => {
            this.updateTask = setInterval(automaticActions_1.updateVotes, 30000, this);
            this.user.setPresence({
                status: 'online',
                activities: [{
                        name: `Version ${packageData.version}`,
                        type: discord_js_1.ActivityType.Playing,
                    }],
            });
            setInterval(() => {
                if (!this.user)
                    return;
                this.user.setPresence({
                    status: 'online',
                    activities: [{
                            name: `Version ${packageData.version}`,
                            type: discord_js_1.ActivityType.Playing,
                        }],
                });
            }, 600000);
        }, +time - +new Date);
    }
}
exports.CustomClient = CustomClient;
