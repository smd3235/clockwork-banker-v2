/**
 * banksetup.js - Discord Bot Bank Setup Command
 * 
 * Purpose: Sets up persistent bank interaction buttons in a specified channel.
 * Provides users with easy access to bank viewing and item request functionality.
 * 
 * Author: Assistant (OpenAI)
 * Version: 2.0.0
 * Created: 2024
 * 
 * Features:
 * - Staff permission validation
 * - Persistent bank interface buttons
 * - External bank website link
 * - Interactive request button
 * - Channel validation and error handling
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require('discord.js');
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
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ ephemeral: true });

        const targetChannel = interaction.options.getChannel('channel');

        if (!targetChannel || !targetChannel.isTextBased()) {
            return interaction.editReply({ content: 'Please provide a valid text channel.', flags: MessageFlags.Ephemeral });
        }

        // View Full Bank button - remains as link button
        const bankListButton = new ButtonBuilder() 
            .setLabel('🏦 View Full Bank')
            .setStyle(ButtonStyle.Link)
            .setURL('https://thj-dnt.web.app/bank'); // External guild bank website

        // Request Items button - changed to interactive button
        const requestButton = new ButtonBuilder()
            .setLabel('🎒 Request Items')
            .setStyle(ButtonStyle.Primary)  // Changed from Link to Primary
            .setCustomId('persistent_request_instructions');  // Added custom ID for interaction

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