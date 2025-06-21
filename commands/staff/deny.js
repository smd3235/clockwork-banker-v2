/**
 * deny.js - Discord Bot Staff Command for Denying Bank Requests
 * 
 * Purpose: Allows staff members to deny bank requests with reasons and notifications.
 * Updates request status, notifies users via DM and thread, and maintains audit trail.
 * 
 * 
 * Features:
 * - Staff permission validation
 * - Request status updates with denial reasons
 * - User notifications via DM and thread
 * - Safe channel and message handling
 * - Comprehensive error handling and logging
 */

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { activeRequests } = require('../../data/bankData');
const config = require('../../config');
const { getBankChannel } = require('../../utils/getBankChannel'); // Use the new dedicated utility

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deny')
        .setDescription('[STAFF] Deny a bank request due to unavailable items')
        .addIntegerOption(option =>
            option.setName('request-id')
                .setDescription('Request ID number to deny')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for denial (e.g., "Sword of Flame out of stock")')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('staff-notes')
                .setDescription('Optional notes to include (e.g., "will be restocked soon")')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Defer immediately

        // Permission check
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            await interaction.editReply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        const requestId = interaction.options.getInteger('request-id');
        const reason = interaction.options.getString('reason');
        const staffNotes = interaction.options.getString('staff-notes'); 

        const request = activeRequests.get(requestId);

        if (!request) {
            await interaction.editReply({ content: `Request #${requestId} not found.`, flags: MessageFlags.Ephemeral });
            return;
        }

        request.status = 'denied';
        request.deniedBy = interaction.user.username;
        request.denialReason = reason;
        request.staffNotes = staffNotes; 

        try {
            // Use the new helper to safely obtain the bank channel
            const bankChannel = await getBankChannel(interaction.guild, config);
            
            // If channel not found, reply with error and exit early
            if (!bankChannel) {
                await interaction.editReply({
                    content: 'Bank request channel not found. Please contact an administrator to configure the bot properly.',
                    flags: MessageFlags.Ephemeral
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
                    console.warn(`[DENY] Message ${request.messageId} has no embeds`);
                    await interaction.editReply({
                        content: `❌ Request #${requestId} could not be updated (original message has no embed), but has been marked as denied.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                
                embed = EmbedBuilder.from(message.embeds[0]);
                embed.setColor(0xFF0000); // Red for denied
                embed.setFooter({ text: `Denied by ${request.deniedBy} at ${new Date().toLocaleString()}` });
                embed.addFields(
                    { name: 'Status', value: '❌ Denied', inline: true },
                    { name: 'Reason', value: reason, inline: false }
                );
                if (staffNotes) {
                    embed.addFields({ name: 'Staff Notes', value: staffNotes, inline: false });
                }

                await message.edit({ embeds: [embed] });

            } catch (messageError) {
                // Handle missing or deleted message gracefully
                console.warn(`[DENY] Could not fetch or update message ${request.messageId}:`, messageError.message);
                await interaction.editReply({
                    content: `❌ Request #${requestId} has been marked as denied, but the original message could not be updated (it may have been deleted).`,
                    flags: MessageFlags.Ephemeral
                });
                // Continue processing to handle thread and DM notifications
            }

            // Handle thread operations (continue even if message update failed)
            try {
                const thread = await interaction.client.channels.fetch(request.threadId);
                if (thread && thread.isThread()) {
                    if (thread.archived) {
                        await thread.setArchived(false, 'Unarchiving to send denial message');
                        console.log(`[DENY] Unarchived thread ${thread.name} to send denial message.`);
                    }
                    let threadMessage = `❌ This request has been **denied** by ${interaction.user.tag} for the following reason:\n*${reason}*`;
                    if (staffNotes) {
                        threadMessage += `\nStaff Notes: *${staffNotes}*`;
                    }
                    await thread.send(threadMessage);
                    await thread.setArchived(true, 'Request denied');
                }
            } catch (threadError) {
                console.warn(`[DENY] Could not update thread ${request.threadId}:`, threadError.message);
            }

            await interaction.editReply({ content: `❌ Request #${requestId} marked as denied.`, flags: MessageFlags.Ephemeral });

            try {
                const user = await interaction.client.users.fetch(request.userId);
                let dmMessage = `Your bank request #${requestId} for character **${request.characterName}** has been **denied** by a staff member.\n\nReason: *${reason}*`;
                if (staffNotes) {
                    dmMessage += `\nStaff Notes: *${staffNotes}*`;
                }
                await user.send(dmMessage);
            } catch (dmError) {
                console.warn(`Could not DM user ${request.userId}: ${dmError}`);
            }

            activeRequests.delete(requestId);
        } catch (error) {
            console.error('Error denying request:', error);
            await interaction.editReply({ content: 'An error occurred while denying the request.', flags: MessageFlags.Ephemeral });
        }
    }
};