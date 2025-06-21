// utils/modalUtils.js - UPDATED WITH QUANTITY SUPPORT INSTRUCTIONS

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function createRequestModal(userId) {
    const modal = new ModalBuilder()
        .setCustomId(`requestModal_${userId}`)
        .setTitle('🎒 Guild Bank Request Form');

    const itemsInput = new TextInputBuilder()
        .setCustomId('itemsInput')
        .setLabel('Items to Request (One per line, Thank You!)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Sword of Flame\nShield 5\nRobe (Enchanted) 2')
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

/**
 * Create a feedback modal for staff responses
 * @param {string} requestId - Request ID for the feedback
 * @param {string} action - Action type (fulfill, deny, partial)
 * @returns {ModalBuilder} Configured feedback modal
 */
function createFeedbackModal(requestId, action) {
    const modal = new ModalBuilder()
        .setCustomId(`feedback_modal_${requestId}_${action}`)
        .setTitle(`${action.charAt(0).toUpperCase() + action.slice(1)} Request #${requestId}`);

    let inputs = [];

    if (action === 'deny') {
        const reasonInput = new TextInputBuilder()
            .setCustomId('denial_reason')
            .setLabel('Reason for Denial')
            .setPlaceholder('e.g., Item out of stock, Character not found, etc.')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(200);

        inputs.push(new ActionRowBuilder().addComponents(reasonInput));
    }

    if (action === 'partial') {
        const sentItemsInput = new TextInputBuilder()
            .setCustomId('sent_items')
            .setLabel('Items Sent')
            .setPlaceholder('List items that were successfully sent (include quantities)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        const unavailableItemsInput = new TextInputBuilder()
            .setCustomId('unavailable_items')
            .setLabel('Unavailable Items')
            .setPlaceholder('List items that could not be sent (include quantities)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        inputs.push(new ActionRowBuilder().addComponents(sentItemsInput));
        inputs.push(new ActionRowBuilder().addComponents(unavailableItemsInput));
    }

    // Always add optional notes field
    const notesInput = new TextInputBuilder()
        .setCustomId('staff_notes')
        .setLabel('Staff Notes (Optional)')
        .setPlaceholder('Additional notes or comments for the player')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500);

    inputs.push(new ActionRowBuilder().addComponents(notesInput));

    // Add all input rows to modal (max 5 components)
    inputs.forEach(row => modal.addComponents(row));

    return modal;
}

/**
 * Validate modal input values
 * @param {Object} inputs - Object containing input values to validate
 * @param {string} modalType - Type of modal being validated
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateModalInputs(inputs, modalType) {
    const errors = [];
    
    switch (modalType) {
        case 'request':
            if (!inputs.characterInput || inputs.characterInput.trim().length === 0) {
                errors.push('Character name is required');
            }
            if (!inputs.itemsInput || inputs.itemsInput.trim().length === 0) {
                errors.push('At least one item must be requested');
            }
            if (inputs.characterInput && inputs.characterInput.length > 50) {
                errors.push('Character name must be 50 characters or less');
            }
            break;
            
        case 'deny':
            if (!inputs.denial_reason || inputs.denial_reason.trim().length === 0) {
                errors.push('Denial reason is required');
            }
            break;
            
        case 'partial':
            if (!inputs.sent_items || inputs.sent_items.trim().length === 0) {
                errors.push('Sent items list is required');
            }
            if (!inputs.unavailable_items || inputs.unavailable_items.trim().length === 0) {
                errors.push('Unavailable items list is required');
            }
            break;
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

module.exports = { 
    createRequestModal, 
    createFeedbackModal, 
    validateModalInputs 
};