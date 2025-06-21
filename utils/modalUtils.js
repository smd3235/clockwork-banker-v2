// utils/modalUtils.js - Shared modal creation utility

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function createRequestModal(userId) {
    const modal = new ModalBuilder()
        .setCustomId(`requestModal_${userId}`)
        .setTitle('🎒 Guild Bank Request Form');

    const itemsInput = new TextInputBuilder()
        .setCustomId('itemsInput')
        .setLabel('Items to Request (One per line, Thank You!)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter items here. E.g., "Sword of Flame (Enchanted)" or "Velium Shield"')
        .setRequired(true)
        .setMaxLength(1000);

    const characterInput = new TextInputBuilder()
        .setCustomId('characterInput')
        .setLabel('Character Name (where to send items)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter character name')
        .setRequired(true)
        .setMaxLength(50);

    const notesInput = new TextInputBuilder()
        .setCustomId('notesInput')
        .setLabel('Additional Notes (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Any special instructions or notes')
        .setRequired(false)
        .setMaxLength(200);

    const firstActionRow = new ActionRowBuilder().addComponents(itemsInput);
    const secondActionRow = new ActionRowBuilder().addComponents(characterInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(notesInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    
    return modal;
}

module.exports = { createRequestModal };