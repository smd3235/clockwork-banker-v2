// In handlers/modalHandler.js - UPDATED WITH QUANTITY SUPPORT
// handlers/modalHandler.js - UPDATED WITH QUANTITY SUPPORT AND FORUM TAGS

const { EmbedBuilder, MessageFlags } = require('discord.js');
const { EmbedBuilder, MessageFlags, ChannelType } = require('discord.js');
const { bankData, activeRequests, getNextRequestId } = require('../data/bankData');
const { formatItemForRequest } = require('../utils/itemFormatting');
const config = require('../config');

// Helper function to parse item name and quantity from input line
function parseItemAndQuantity(line) {
    // Clean the line first
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    // Split by spaces to check for trailing number
    const parts = trimmedLine.split(/\s+/);
    let quantity = 1;
    let itemNameParts = [...parts];

    // Check if the last part is a number
    const lastPart = parts[parts.length - 1];
    const parsedQuantity = parseInt(lastPart);

    // If it's a valid positive number, use it as quantity
    if (!isNaN(parsedQuantity) && parsedQuantity > 0 && parsedQuantity.toString() === lastPart) {
        quantity = parsedQuantity;
        itemNameParts = parts.slice(0, -1); // Remove the quantity from name parts
        itemNameParts = parts.slice(0, -1);
    }

    // Rejoin the name parts
    const itemName = itemNameParts.join(' ');

    // Ensure we have a valid item name after quantity extraction
    if (!itemName.trim()) {
        return null;
    }
    if (!itemName.trim()) return null;

    return {
        name: itemName.trim(),
        quantity: quantity
    };
}
async function handleModalSubmit(interaction) {
    if (interaction.customId.startsWith('requestModal_')) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const userId = interaction.customId.split('_')[1];
        const itemsInput = interaction.fields.getTextInputValue('itemsInput');
        const characterInput = interaction.fields.getTextInputValue('characterInput');
        const notesInput = interaction.fields.getTextInputValue('notesInput');

        console.log('=== MODAL DEBUG START ===');
        console.log('itemsInput raw:', JSON.stringify(itemsInput));
        console.log('itemsInput length:', itemsInput.length);
        console.log('bankData.items.size:', bankData?.items?.size || 'undefined');
        console.log('bankData initialized:', !!bankData);
        const notesInput = interaction.fields.getTextInputValue('notesInput') || '';

        // Parse requested items with quantity and quality
        const requestedItems = itemsInput.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // Parse item name and quantity
                const parsed = parseItemAndQuantity(line);
                if (!parsed) {
                    console.log(`[DEBUG] Failed to parse line: "${line}"`);
                    return null;
                }

                if (!parsed) return null;

                let name = parsed.name;
                let quantity = parsed.quantity;
                let quality = 'raw';

                console.log(`[DEBUG] Parsed: name="${name}", quantity=${quantity}`);

                // Extract quality tags from the name
                // Quality extraction (enchanted, legendary, raw)
                const enchantedMatch = name.match(/\(enchanted\)$/i);
                const legendaryMatch = name.match(/\(legendary\)$/i);
                const rawMatch = name.match(/\(raw\)$/i);
                if (enchantedMatch) {
                    quality = 'enchanted';
                    name = name.substring(0, enchantedMatch.index).trim();
                } else if (legendaryMatch) {
                    quality = 'legendary';
                    name = name.substring(0, legendaryMatch.index).trim();
                } else if (rawMatch) {
                    quality = 'raw';
                if (enchantedMatch) {
                    quality = 'enchanted';
                    name = name.substring(0, enchantedMatch.index).trim();
                } else if (legendaryMatch) {
                    quality = 'legendary';
                    name = name.substring(0, legendaryMatch.index).trim();
                } else if (rawMatch) {
                    quality = 'raw';
                    name = name.substring(0, rawMatch.index).trim();
                }

                console.log(`[DEBUG] After quality extraction: name="${name}", quality="${quality}", quantity=${quantity}`);

                // First try exact match
                // Try exact match
                const foundItem = bankData.items.get(name.toLowerCase());
                if (foundItem) {
                    return { 
                        name: foundItem.name, 
                        quality: quality, 
                        quantity: quantity,
                        status: 'confirmed',
                        name: foundItem.name, 
                        quality: quality, 
                        quantity: quantity,
                        status: 'confirmed',
                        id: foundItem.id 
                    };
                } else {
                    // Try fuzzy matching
                    // Fuzzy match
                    const fuzzyMatch = Array.from(bankData.items.values()).find(item =>
                        item.name.toLowerCase().includes(name.toLowerCase()) ||
                        name.toLowerCase().includes(item.name.toLowerCase())
                    );
                    if (fuzzyMatch) {
                        return { 
                            name: name, 
                            quality: quality, 
                            quantity: quantity,
                            status: 'suggested', 
                            suggestedMatch: fuzzyMatch.name,
                            id: fuzzyMatch.id 
                        };
                    }
                    return { 
                        name: name, 
                        quality: quality, 
                        quantity: quantity,
                        status: 'needs_verification' 
                    );
                    if (fuzzyMatch) {
                        return { 
                            name: name, 
                            quality: quality, 
                            quantity: quantity,
                            status: 'suggested', 
                            suggestedMatch: fuzzyMatch.name,
                            id: fuzzyMatch.id 
                        };
                    }
                    return { 
                        name: name, 
                        quality: quality, 
                        quantity: quantity,
                        status: 'needs_verification' 
                    };
                }
            })
            .filter(item => item !== null); // Remove any failed parses

        console.log('requestedItems final:', requestedItems);
        console.log('requestedItems.length:', requestedItems.length);
        console.log('=== MODAL DEBUG END ===');
            .filter(item => item !== null);

        const confirmedItems = requestedItems.filter(item => item.status === 'confirmed');
        const suggestedItems = requestedItems.filter(item => item.status === 'suggested');
        const needVerification = requestedItems.filter(item => item.status === 'needs_verification');

        // Fixed channel finding logic - ensure it's a text channel
        const channel = interaction.guild.channels.cache.find(ch =>
            ch.isTextBased() && (ch.name === config.bankChannelName || ch.name.includes('bank-request'))
        );

        if (!channel) {
        if (requestedItems.length === 0) {
            await interaction.editReply({
                content: 'Bank requests channel not found. Please contact any bank staff.',
                content: '❌ No items found in your request. Please check item names and try again.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const requestId = getNextRequestId();

        // Build items list string for embed
        let itemsList = '';
        if (confirmedItems.length > 0) {
            itemsList += '**Confirmed Items:**\n' + confirmedItems.map(item => `✅ ${formatItemForRequest(item)}`).join('\n') + '\n';
        }
        if (suggestedItems.length > 0) {
            itemsList += '\n**Suggested Matches (Bank Staff Review):**\n' + suggestedItems.map(item => `⚠️ ${formatItemForRequest(item)} (Bot suggests: ${item.suggestedMatch})`).join('\n') + '\n';
        }
        if (needVerification.length > 0) {
        }
        if (suggestedItems.length > 0) {
            itemsList += '\n**Suggested Matches (Bank Staff Review):**\n' + suggestedItems.map(item => `⚠️ ${formatItemForRequest(item)} (Bot suggests: ${item.suggestedMatch})`).join('\n') + '\n';
        }
        if (needVerification.length > 0) {
            itemsList += '\n**Items to Verify (Bank Staff Review):**\n' + needVerification.map(item => `❓ ${formatItemForRequest(item)}`).join('\n');
        }

        // Don't reject if we have any items at all
        if (requestedItems.length === 0) {
            await interaction.editReply({
                content: '❌ No items found in your request. Please check item names and try again.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        activeRequests.set(requestId, {
            id: requestId,
            userId: interaction.user.id,
            characterName: characterInput,
            items: requestedItems,
            notes: notesInput,
            requestedAt: new Date(),
            status: 'pending'
        });

        // Create embed
        const requestEmbed = new EmbedBuilder()
            .setTitle(`🎒 Guild Bank Request #${requestId}`)
            .setColor(0x4CAF50)
            .addFields(
                { name: 'Requested by', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Send to Character', value: characterInput, inline: true },
                { name: 'Request ID', value: `#${requestId}`, inline: true },
                { name: 'Items Requested', value: itemsList || 'No items specified.', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Staff: Use /fulfill, /deny, or /partial commands with this ID' });
        if (notesInput) {
            requestEmbed.addFields({ name: 'Additional Notes', value: notesInput, inline: false });
            .addFields(
                { name: 'Requested by', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Send to Character', value: characterInput, inline: true },
                { name: 'Request ID', value: `#${requestId}`, inline: true },
                { name: 'Items Requested', value: itemsList || 'No items specified.', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Staff: Use /fulfill, /deny, or /partial commands with this ID' });
        if (notesInput) {
            requestEmbed.addFields({ name: 'Additional Notes', value: notesInput, inline: false });
        }

        try {
            const threadName = `Request #${requestId} - ${characterInput}`;
            const requestMessage = await channel.send({
                embeds: [requestEmbed]
            });
            // Find the forum channel named "bank-requests"
            const forumChannel = interaction.guild.channels.cache.find(ch =>
                ch.type === ChannelType.GuildForum && ch.name === 'bank-requests'
            );

            if (!forumChannel) {
                await interaction.editReply({
                    content: 'Forum channel "bank-requests" not found. Please contact any bank staff.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const thread = await requestMessage.startThread({
            // Find the "Pending" tag, if available
            const pendingTag = forumChannel.availableTags.find(tag => tag.name === 'Pending');

            // Create a new forum post (thread) with embed + message
            const threadName = `Request #${requestId} - ${characterInput}`;
            const thread = await forumChannel.threads.create({
                name: threadName,
                message: {
                    embeds: [requestEmbed],
                    content: `Hello Bank Staff! This is a new bank request from <@${interaction.user.id}> for **${characterInput}**.\n\nUse the staff commands to update its status: \`/fulfill\`, \`/deny\`, or \`/partial\`.`
                },
                autoArchiveDuration: 1440,
                reason: `Bank request #${requestId} by ${interaction.user.username}`
                appliedTags: pendingTag ? [pendingTag.id] : [],
                reason: `Bank request #${requestId} by ${interaction.user.username}`,
            });

            await thread.send(`Hello Bank Staff! This is a new bank request from <@${interaction.user.id}> for **${characterInput}**.\n\nUse the staff commands to update its status: \`/fulfill\`, \`/deny\`, or \`/partial\`.`);

            activeRequests.get(requestId).messageId = requestMessage.id;
            activeRequests.get(requestId).threadId = thread.id;
            // Store request tracking info
            activeRequests.set(requestId, {
                id: requestId,
                userId: interaction.user.id,
                characterName: characterInput,
                items: requestedItems,
                notes: notesInput,
                requestedAt: new Date(),
                status: 'pending',
                threadId: thread.id,
                messageId: thread.id,  // thread.id represents the post message ID in forum threads
            });

            // Compose confirmation reply
            let replyMessage = `✅ Request #${requestId} submitted successfully!\n\n`;

            if (confirmedItems.length > 0) {
                replyMessage += `**✅ Confirmed items:** ${confirmedItems.length} items found directly in bank.\n`;
            }
            if (suggestedItems.length > 0) {
                replyMessage += `**✅ Confirmed items:** ${confirmedItems.length} items found directly in bank.\n`;
            }
            if (suggestedItems.length > 0) {
                replyMessage += `**⚠️ Suggested matches:** ${suggestedItems.length} items with close matches found. Staff will verify these.\n`;
            }
            if (needVerification.length > 0) {
                replyMessage += `**❓ Items to verify:** ${needVerification.length} items require manual verification by staff. They may not be in the bank or are misspelled.\n`;
                replyMessage += `**❓ Items to verify:** ${needVerification.length} items require manual verification by staff.\n`;
            }

            replyMessage += `\n**Send to:** ${characterInput}`;
            if (notesInput) {
                replyMessage += `\n**Notes:** ${notesInput}`;
            }
            if (notesInput) replyMessage += `\n**Notes:** ${notesInput}`;
            if (suggestedItems.length > 0 || needVerification.length > 0) {
                replyMessage += `\n\n💡 **Tip:** To ensure perfect matches, copy item names directly from the bank website when using the \`/request\` form!`;
                replyMessage += `\n\n💡 **Tip:** Copy item names directly from the bank website for better matching.`;
            }

            await interaction.editReply({
                content: replyMessage,
                flags: MessageFlags.Ephemeral
                content: replyMessage,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('Error sending request to channel:', error);
            console.error('Error sending request to forum:', error);
            await interaction.editReply({
                content: 'An error occurred while submitting your request. Please try again.',
                content: '❌ An error occurred while submitting your request. Please try again or contact an admin.',
                flags: MessageFlags.Ephemeral
            });
        }

    } else {
        console.warn('Unknown modal submitted:', interaction.customId);
        await interaction.reply({
            content: 'An unknown modal was submitted. Please try again or contact support.',
            content: '❌ Unknown form submission. Please try again or contact support.',
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = { handleModalSubmit };
module.exports = { handleModalSubmit };
