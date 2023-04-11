"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomClient = exports.ButtonData = exports.SelectMenuData = exports.CommandData = void 0;
const discord_js_1 = require("discord.js");
const databaseActions_1 = require("./databaseActions");
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
    customData = new databaseActions_1.DatabaseData();
    botData;
    config;
    constructor(options, config, interactionHandler) {
        super(options);
        this.on(discord_js_1.Events.InteractionCreate, interactionHandler);
        this.config = config;
        this.database = new databaseActions_1.default(config.database);
        this.botData = { commands: new discord_js_1.Collection, buttons: new discord_js_1.Collection, selectMenus: new discord_js_1.Collection, interactionHandler: interactionHandler };
    }
}
exports.CustomClient = CustomClient;
