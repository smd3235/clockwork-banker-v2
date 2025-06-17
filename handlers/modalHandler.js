const { EmbedBuilder } = require('discord.js');
const { bankData, activeRequests, getNextRequestId } = require('../data/bankData');
const { formatItemForRequest } = require('../utils/itemFormatting');
const config = require('../config'); // Import config

async function handleModalSubmit(interaction) {
    if (interaction.customId.startsWith('requestModal_')) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.customId.split('_')[1];
        const itemsInput = interaction.fields.getTextInputValue('itemsInput');
        const characterInput = interaction.fields.getTextInputValue('characterInput');
        const notesInput = interaction.fields.getTextInputValue('notesInput');

        const requestedItems = itemsInput.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                let name = line;
                let quality = 'raw';

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
                    name = name.substring(0, rawMatch.index).trim();
                }

                const foundItem = bankData.items.get(name.toLowerCase());
                if (foundItem) {
                    return { name: foundItem.name, quality: quality, status: 'confirmed' };
                } else {
                    const fuzzyMatch = Array.from(bankData.items.values()).find(item =>
                        item.name.toLowerCase().includes(name.toLowerCase()) ||
                        name.toLowerCase().includes(item.name.toLowerCase())
                    );
                    if (fuzzyMatch) {
                        return { name: name, quality: quality, status: 'suggested', suggestedMatch: fuzzyMatch.name };
                    }
                    return { name: name, quality: quality, status: 'needs_verification' };
                }
            });

        const confirmedItems = requestedItems.filter(item => item.status === 'confirmed');
        const suggestedItems = requestedItems.filter(item => item.status === 'suggested');
        const needVerification = requestedItems.filter(item => item.status === 'needs_verification');

        const channel = interaction.guild.channels.cache.find(ch =>
            ch.name === config.bankChannelName || ch.name.includes('bank-request')
        );

        if (!channel) {
            await interaction.editReply({
                content: 'Bank requests channel not found. Please contact any bank staff.',
                ephemeral: true
            });
            return;
        }

        
        const requestId = getNextRequestId();

        let itemsList = '';
        if (confirmedItems.length > 0) {
            itemsList += '**Confirmed Items:**\n' + confirmedItems.map(item => `✅ ${formatItemForRequest(item)}`).join('\n') + '\n';
        }
        if (suggestedItems.length > 0) {
            itemsList += '\n**Suggested Matches (Bank Staff Review):**\n' + suggestedItems.map(item => `⚠️ ${formatItemForRequest(item)} (Bot suggests: ${item.suggestedMatch})`).join('\n') + '\n';
        }
        if (needVerification.length > 0) {
            itemsList += '\n**Items to Verify (Bank Staff Review):**\n' + needVerification.map(item => `❓ ${formatItemForRequest(item)}`).join('\n');
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
        }

        const threadName = `Request #${requestId} - ${characterInput}`;
        const requestMessage = await channel.send({
            embeds: [requestEmbed]
        });

        const thread = await requestMessage.startThread({
            name: threadName,
            autoArchiveDuration: 1440,
            reason: `Bank request #${requestId} by ${interaction.user.username}`
        });

        await thread.send(`Hello Bank Staff! This is a new bank request from <@${interaction.user.id}> for **${characterInput}**.\n\nUse the staff commands to update its status: \`/fulfill\`, \`/deny\`, or \`/partial\`.`);

        activeRequests.get(requestId).messageId = requestMessage.id;
        activeRequests.get(requestId).threadId = thread.id;

        let replyMessage = `✅ Request #${requestId} submitted successfully!\n\n`;

        if (confirmedItems.length > 0) {
            replyMessage += `**✅ Confirmed items:** ${confirmedItems.length} items found directly in bank.\n`;
        }
        if (suggestedItems.length > 0) {
            replyMessage += `**⚠️ Suggested matches:** ${suggestedItems.length} items with close matches found. Staff will verify these.\n`;
        }
        if (needVerification.length > 0) {
            replyMessage += `**❓ Items to verify:** ${needVerification.length} items require manual verification by staff. They may not be in the bank or are misspelled.\n`;
        }

        replyMessage += `\n**Send to:** ${characterInput}`;
        if (notesInput) {
            replyMessage += `\n**Notes:** ${notesInput}`;
        }
        if (suggestedItems.length > 0 || needVerification.length > 0) {
            replyMessage += `\n\n💡 **Tip:** To ensure perfect matches, copy item names directly from the bank website when using the \`/request\` form!`;
        }

        await interaction.editReply({
            content: replyMessage,
            ephemeral: true
        });

    } else {
        console.warn('Unknown modal submitted:', interaction.customId);
        await interaction.editReply({
            content: 'An unknown modal was submitted. Please try again or contact support.',
            ephemeral: true
        });
    }
}

module.exports = { handleModalSubmit };