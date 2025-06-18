// In commands/staff/banksetup.js - FINAL VERSION WITH REQUEST BUTTON LINKING TO YOUR OWN GITHUB PAGES

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banksetup')
        .setDescription('[STAFF] Sets up the persistent bank interaction buttons in a channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the bank buttons message to.')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ ephemeral: true });

        const targetChannel = interaction.options.getChannel('channel');

        if (!targetChannel || !targetChannel.isTextBased()) {
            return interaction.editReply({ content: 'Please provide a valid text channel.', flags: MessageFlags.Ephemeral });
        }

        const bankListButton = new ButtonBuilder() 
            .setLabel('🏦 View Full Bank')
            .setStyle(ButtonStyle.Link)
            .setURL('https://thj-dnt.web.app/bank'); // This remains the EXTERNAL guild bank website

        // === CRITICAL CHANGE: Request button URL corrected to YOUR OWN GitHub Pages ===
        const requestInstructionsURL = 'https://grumpy-gaming.github.io/clockwork-banker-v2/request-instructions.html'; // <--- THIS IS YOUR FINAL, CORRECT GITHUB PAGES URL!

        const requestButton = new ButtonBuilder()
            .setLabel('🎒 Request Items (Instructions)')
            .setStyle(ButtonStyle.Link)
            .setURL(requestInstructionsURL);
        // ==============================================================================

        const row = new ActionRowBuilder()
            .addComponents(bankListButton, requestButton); 

        try {
            await targetChannel.send({
                content: '**👋 Welcome to the Death and Taxes Guild Bank!**\n\nClick a button below to get started:',
                components: [row]
            });

            await interaction.editReply({ content: `Bank interaction buttons successfully sent to ${targetChannel}!`, flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('Error sending bank setup message:', error);
            await interaction.editReply({ content: 'Failed to send bank setup message. Check bot permissions.', flags: MessageFlags.Ephemeral });
        }
    },
};
