// In commands/request.js

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription('Open a form to request multiple items at once'),
    async execute(interaction) {
        // No deferReply needed here as showModal implicitly defers and responds
        // if (!interaction.member.permissions.has('MANAGE_MESSAGES')) { // Example permission - add if needed for /request directly
        //     return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        // }

        // --- PASTE THE MODAL CREATION LOGIC HERE ---
        const modal = new ModalBuilder()
            .setCustomId(`requestModal_${interaction.user.id}`)
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
        // --- END PASTE ---

        // Show the modal
        await interaction.showModal(modal);
    },
};