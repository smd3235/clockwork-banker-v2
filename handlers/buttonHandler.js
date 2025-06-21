// In handlers/buttonHandler.js - UPDATED WITH QUANTITY SUPPORT

const { bankData } = require('../data/bankData');
const { getHighestQuality } = require('../utils/itemFormatting');
const { createRequestModal } = require('../utils/modalUtils');
const { addItemToCart, getUserCart } = require('../commands/cart'); // Import cart functions

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

            // Create item object for cart
            const cartItem = {
                name: item.name,
                quality: availableQuality,
                quantity: 1, // Buttons always add quantity 1
                id: item.id
            };

            // Add to user's cart using the cart utility function
            const userCart = addItemToCart(userId, cartItem);
            
            // Calculate total items in cart
            const totalItems = userCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const uniqueItems = userCart.length;

            // Prepare quality display text
            let qualityText = '';
            if (availableQuality === 'enchanted') {
                qualityText = ' (Enchanted)';
            } else if (availableQuality === 'legendary') {
                qualityText = ' (Legendary)';
            }

            // Check if item was consolidated (already existed in cart)
            const existingItem = userCart.find(cartItem => 
                cartItem.name.toLowerCase() === item.name.toLowerCase() && 
                cartItem.quality === availableQuality
            );
            
            let responseMessage;
            if (existingItem && existingItem.quantity > 1) {
                responseMessage = `✅ Added **${item.name}${qualityText}** to your cart! You now have ${existingItem.quantity}x of this item.\n*Total: ${totalItems} item(s) (${uniqueItems} unique). Use \`/cart\` to view or \`/cart character:YourName\` to submit.*`;
            } else {
                responseMessage = `✅ Added **${item.name}${qualityText}** to your cart!\n*Total: ${totalItems} item(s) (${uniqueItems} unique). Use \`/cart\` to view or \`/cart character:YourName\` to submit.*`;
            }

            await interaction.reply({ 
                content: responseMessage, 
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

            // Clear the cart using userCarts from bankData
            const { userCarts } = require('../data/bankData');
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