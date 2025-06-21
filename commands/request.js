// In commands/request.js - UPDATED TO USE SHARED MODAL UTILITY

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createRequestModal } = require('../utils/modalUtils'); // Import the shared modal utility

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription('Open a form to request multiple items at once'),
    async execute(interaction) {
        // Create and show the modal using the shared utility
        const modal = createRequestModal(interaction.user.id);
        await interaction.showModal(modal);
    },
};