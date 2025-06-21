/**
 * fulfill.js - Discord Bot Staff Command for Fulfilling Bank Requests
 * 
 * Purpose: Allows staff members to mark bank requests as completely fulfilled.
 * Updates request status, archives threads, notifies users, and removes from active requests.
 * 
 * 
 * Features:
 * - Staff permission validation
 * - Complete request fulfillment processing
 * - User notifications via DM and thread
 * - Thread archival automation
 * - Safe channel and message handling
 * - Comprehensive error handling and logging
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { activeRequests } = require('../../data/bankData');
const config = require('../../config');
const { getBankChannel } = require('../../utils/getBankChannel'); // Use the new dedicated utility

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fulfill')
        .setDescription('[STAFF] Mark a bank request as fulfilled')
        .addIntegerOption(option =>
            option.setName('request-id')
                .setDescription('Request ID number to fulfill')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            await interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return; // Exit the function after sending the final reply
        }

        const requestId = interaction.options.getInteger('request-id');
        const request = activeRequests.get(requestId);

        if (!request) {
            return interaction.editReply({ content: `Request #${requestId} not found.`, ephemeral: true });
        }

        request.status = 'fulfilled';
        request.fulfilledBy = interaction.user.username;

        try {
            // Use the new helper to safely obtain the bank channel
            const bankChannel = await getBankChannel(interaction.guild, config);
            
            // If channel not found, reply with error and exit early
            if (!bankChannel) {
                await interaction.editReply({
                    content: 'Bank request channel not found. Please contact an administrator to configure the bot properly.',
                    ephemeral: true
                });
                return;
            }

            // Wrap message fetch in try/catch to handle missing/deleted messages gracefully
            let message;
            let embed;
            try {
                message = await bankChannel.messages.fetch(request.messageId);
                
                // Check if the message has embeds before trying to access them
                if (!message.embeds || message.embeds.length === 0) {
                    console.warn(`[FULFILL] Message ${request.messageId} has no embeds`);
                    await interaction.editReply({
                        content: `✅ Request #${requestId} could not be updated (original message has no embed), but has been marked as fulfilled.`,
                        ephemeral: true
                    });
                    return;
                }
                
                embed = EmbedBuilder.from(message.embeds[0]);
                embed.setColor(0x00FF00); // Green for fulfilled
                embed.setFooter({ text: `Fulfilled by ${request.fulfilledBy} at ${new Date().toLocaleString()}` });
                embed.addFields({ name: 'Status', value: '✅ Fulfilled', inline: true });

                await message.edit({ embeds: [embed] });

            } catch (messageError) {
                // Handle missing or deleted message gracefully
                console.warn(`[FULFILL] Could not fetch or update message ${request.messageId}:`, messageError.message);
                await interaction.editReply({
                    content: `✅ Request #${requestId} has been marked as fulfilled, but the original message could not be updated (it may have been deleted).`,
                    ephemeral: true
                });
                // Continue processing to handle thread and DM notifications
            }

            // Handle thread operations (continue even if message update failed)
            try {
                const thread = await interaction.client.channels.fetch(request.threadId);
                if (thread && thread.isThread()) {
                    if (thread.archived) {
                        await thread.setArchived(false, 'Unarchiving to send fulfillment message');
                        console.log(`[FULFILL] Unarchived thread ${thread.name} to send fulfillment message.`);
                    }
                    await thread.send(`✅ This request has been **fulfilled** by ${interaction.user.tag}.`);
                    await thread.setArchived(true, 'Request fulfilled');
                }
            } catch (threadError) {
                console.warn(`[FULFILL] Could not update thread ${request.threadId}:`, threadError.message);
            }

            await interaction.editReply({ content: `✅ Request #${requestId} marked as fulfilled!`, ephemeral: true });

            // Notify the requesting user
            try {
                const user = await interaction.client.users.fetch(request.userId);
                await user.send(`Your bank request #${requestId} for character **${request.characterName}** has been **fulfilled** by a staff member!`);
            } catch (dmError) {
                console.warn(`Could not DM user ${request.userId}: ${dmError}`);
            }

            activeRequests.delete(requestId); // Remove from active requests
        } catch (error) {
            console.error('Error fulfilling request:', error);
            await interaction.editReply({ content: 'There was an error updating the request message.', ephemeral: true });
        }
    },
};