// In index.js - DEBUGGING INTERACTION CREATE LISTENER

const { Client, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const { initializeBankData } = require('./firebase/firebase');

const { handleButtonClick } = require('./handlers/buttonHandler');
const { handleModalSubmit } = require('./handlers/modalHandler');
const { handleSlashCommand } = require('./handlers/slashCommandHandler');

const requestCommand = require('./commands/request');
const searchCommand = require('./commands/search');
const cartCommand = require('./commands/cart');
const banklistCommand = require('./commands/banklist');
const helpCommand = require('./commands/help');
const fulfillCommand = require('./commands/staff/fulfill');
const denyCommand = require('./commands/staff/deny');
const partialCommand = require('./commands/staff/partial');
const banksetupCommand = require('./commands/staff/banksetup');


const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.commands.set(requestCommand.data.name, requestCommand);
client.commands.set(searchCommand.data.name, searchCommand);
client.commands.set(cartCommand.data.name, cartCommand);
client.commands.set(banklistCommand.data.name, banklistCommand);
client.commands.set(helpCommand.data.name, helpCommand);
client.commands.set(fulfillCommand.data.name, fulfillCommand);
client.commands.set(denyCommand.data.name, denyCommand);
client.commands.set(partialCommand.data.name, partialCommand);
client.commands.set(banksetupCommand.data.name, banksetupCommand);


client.once('ready', async () => {
    console.log(`${client.user.tag} is online!`);
    
    await initializeBankData();
    
    try {
        console.log('Registering slash commands...');
        const commandsToRegister = client.commands.map(command => command.data.toJSON());
        await client.application.commands.set(commandsToRegister);
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// --- CRITICAL DEBUGGING: Add logs to interactionCreate listener ---
client.on('interactionCreate', async interaction => {
    console.log(`[DEBUG_INTERACTION] Interaction received: Type - ${interaction.type}`); // Log any interaction
    console.log(`[DEBUG_INTERACTION]   isChatInputCommand: ${interaction.isChatInputCommand()}`);
    console.log(`[DEBUG_INTERACTION]   isButton: ${interaction.isButton()}`);
    console.log(`[DEBUG_INTERACTION]   isModalSubmit: ${interaction.isModalSubmit()}`);

    if (interaction.isChatInputCommand()) {
        console.log(`[DEBUG_INTERACTION]   -> Handling ChatInputCommand: ${interaction.commandName}`);
        await handleSlashCommand(interaction, client.commands);
    } else if (interaction.isButton()) {
        console.log(`[DEBUG_INTERACTION]   -> Handling ButtonInteraction: ${interaction.customId}`);
        await handleButtonClick(interaction);
    } else if (interaction.isModalSubmit()) {
        console.log(`[DEBUG_INTERACTION]   -> Handling ModalSubmitInteraction: ${interaction.customId}`);
        await handleModalSubmit(interaction);
    } else {
        console.log(`[DEBUG_INTERACTION]   -> Unhandled Interaction Type.`);
    }
});
// --- END CRITICAL DEBUGGING ---

client.login(config.token);