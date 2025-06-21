const { userCarts, activeRequests, bankData } = require('../data/bankData');
const { getHighestQuality } = require('../utils/itemFormatting');
const { createRequestModal } = require('../utils/modalUtils'); // Import the modal utility

async function handleButtonClick(interaction) {
    const [action, ...params] = interaction.customId.split('_');

    try {
        // Handle persistent request button
        if (interaction.customId === 'persistent_request_instructions') {
            console.log('[DEBUG] Handling persistent request instructions button');
            
            // Show the request modal directly
            const modal = createRequestModal(interaction.user.id);
            await interaction.showModal(modal);
            return;
        }

        // Handle add item to cart button
        if (action === 'additem') {
            const [userId, itemName, quality] = params;
            
            // Security check: ensure the user clicking is the one who initiated
            if (userId !== interaction.user.id) {
                await interaction.reply({ 
                    content: 'You can only add items to your own cart!', 
                    ephemeral: true 
                });
                return;
            }

            // Find the item in bankData
            const itemKey = itemName.toLowerCase();
            const item = bankData.items.get(itemKey);
            
            if (!item) {
                await interaction.reply({ 
                    content: `Item "${itemName}" not found in bank inventory.`, 
                    ephemeral: true 
                });
                return;
            }

            // Check if the quality is available
            let availableQuality = quality;
            if (quality === 'legendary' && item.legendaryCount === 0) {
                if (item.enchantedCount > 0) {
                    availableQuality = 'enchanted';
                } else if (item.baseCount > 0) {
                    availableQuality = 'raw';
                } else {
                    await interaction.reply({ 
                        content: `"${itemName}" is out of stock.`, 
                        ephemeral: true 
                    });
                    return;
                }
            } else if (quality === 'enchanted' && item.enchantedCount === 0) {
                if (item.baseCount > 0) {
                    availableQuality = 'raw';
                } else {
                    await interaction.reply({ 
                        content: `"${itemName}" (Enchanted) is out of stock.`, 
                        ephemeral: true 
                    });
                    return;
                }
            } else if (quality === 'raw' && item.baseCount === 0) {
                await interaction.reply({ 
                    content: `"${itemName}" is out of stock.`, 
                    ephemeral: true 
                });
                return;
            }

            // Add to user's cart
            if (!userCarts.has(userId)) {
                userCarts.set(userId, []);
            }
            
            const userCart = userCarts.get(userId);
            userCart.push({
                name: item.name,
                quality: availableQuality,
                id: item.id
            });

            // Prepare quality display text
            let qualityText = '';
            if (availableQuality === 'enchanted') {
                qualityText = ' (Enchanted)';
            } else if (availableQuality === 'legendary') {
                qualityText = ' (Legendary)';
            }

            await interaction.reply({ 
                content: `✅ Added **${item.name}${qualityText}** to your cart! You now have ${userCart.length} item(s).\n*Use \`/cart\` to view your cart or \`/cart character:YourName\` to submit.*`, 
                ephemeral: true 
            });
        }

        // Handle cart clear button
        else if (action === 'cart' && params[0] === 'clear') {
            const userId = params[1];
            
            if (userId !== interaction.user.id) {
                await interaction.reply({ 
                    content: 'You can only clear your own cart!', 
                    ephemeral: true 
                });
                return;
            }

            userCarts.set(userId, []);
            await interaction.update({ 
                content: '🗑️ Your cart has been cleared!', 
                embeds: [], 
                components: [] 
            });
        }

        // Handle unknown actions
        else {
            console.warn(`Unknown button action: ${action}`);
            await interaction.reply({ 
                content: 'This button is not recognized.', 
                ephemeral: true 
            });
        }

    } catch (error) {
        console.error('Error handling button click:', error);
        await interaction.reply({ 
            content: 'An error occurred while processing your request.', 
            ephemeral: true 
        }).catch(() => {}); // Catch in case the interaction already failed
    }
}

module.exports = { handleButtonClick };