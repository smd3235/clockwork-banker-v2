// In handlers/buttonHandler.js - FINAL PRODUCTION VERSION (Request button handling removed)

// Removed: ModalBuilder, TextInputBuilder, TextInputStyle as they are no longer used here
const { userCarts, bankData, getHighestQuality } = require('../data/bankData');
const { formatItemForRequest } = require('../utils/itemFormatting');
const config = require('../config');
const { EmbedBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');


// Helper function to get or create user cart
function getUserCart(userId) {
    if (!userCarts.has(userId)) {
        userCarts.set(userId, []);
    }
    return userCarts.get(userId);
}

// Helper function to create cart management buttons
function createCartButtons(userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`cart_clear_${userId}`)
                .setLabel('Clear Cart')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cart_submit_${userId}`)
                .setLabel('Submit Request (Use /cart CharName)')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );
}


async function handleButtonClick(interaction) {
    // This handler will now ONLY process 'additem', 'cart', and 'bank_list' buttons.
    // The 'request_instructions' button is now a pure link, so its click is NOT handled by the bot.
    
    const [action, userId, ...rest] = interaction.customId.split('_');
    
    // Only allow specific users for cart buttons
    if (action !== 'persistent' && userId !== interaction.user.id) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        return interaction.followUp({
            content: 'You can only use your own cart buttons!',
            flags: MessageFlags.Ephemeral
        });
    }
    
    try {
        if (action === 'additem' || action === 'cart') {
            await interaction.deferUpdate(); // Acknowledge the button click (non-visible)

            if (action === 'additem') {
                const quality = rest.pop();
                const itemName = rest.join('_');
                
                const item = bankData.items.get(itemName.toLowerCase());
                if (!item) {
                    return interaction.followUp({ content: 'Item not found!', flags: MessageFlags.Ephemeral });
                }
                
                const userCart = getUserCart(userId);
                userCart.push({ name: item.name, quality: quality || 'raw' });
                userCarts.set(userId, userCart);
                
                const qualityLabel = quality.charAt(0).toUpperCase() + quality.slice(1);
                
                await interaction.followUp({
                    content: `✅ Added **${item.name}** (${qualityLabel}) to your cart! Use \`/cart\` to view or submit.`,
                    flags: MessageFlags.Ephemeral
                });
            } else if (action === 'cart') {
                const subAction = rest[0];
                
                if (subAction === 'clear') {
                    userCarts.set(userId, []);
                    await interaction.followUp({ content: '🗑️ Cart cleared!', flags: MessageFlags.Ephemeral });
                } else if (subAction === 'submit') {
                    await interaction.followUp({
                        content: 'Please use `/cart character:YourName` to submit your request.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        } else if (action === 'persistent') {
            const persistentAction = rest[0];

            // Removed: The 'request_instructions' handling block as it's now a pure link button
            // if (persistentAction === 'request_instructions') { ... }

            if (persistentAction === 'bank_list') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const embed = new EmbedBuilder()
                    .setTitle('🏦 Guild Bank Inventory')
                    .setColor(0xFF9800)
                    .setDescription('Click the link below to browse the full bank inventory with item stats and descriptions.')
                    .addFields({
                        name: '🔗 Full Bank Website',
                        value: '[**Browse Bank Inventory →**](https://thj-dnt.web.app/bank)',
                        inline: false
                    })
                    .addFields({
                        name: '💡 How to Request Items',
                        value: '1. Browse items on the website\n2. Come back to Discord\n3. Use `/search ItemName` to find what you want\n4. Click add buttons to build your cart\n5. Use `/cart character:YourName` to submit',
                        inline: false
                    })
                    .setFooter({ text: 'No need to type long item names - just use the search and add buttons!' });

                await interaction.followUp({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            } else { // Fallback for any other unexpected persistent button customIds
                 await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                 await interaction.followUp({
                     content: `Unhandled persistent button clicked: ${interaction.customId}.`,
                     flags: MessageFlags.Ephemeral
                 });
            }
        }
    } catch (error) {
        console.error('Error handling button click:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An unexpected error occurred.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.followUp({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
        }
    }
}

module.exports = { handleButtonClick };