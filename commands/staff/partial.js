// In commands/staff/partial.js - COMPLETE FILE

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { activeRequests } = require('../../data/bankData');
const config = require('../../config'); // Correct path: up one level to root

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partial')
        .setDescription('[STAFF] Partially fulfill request - some items sent, others unavailable')
        .addIntegerOption(option =>
            option.setName('request-id')
                .setDescription('Request ID number')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sent-items')
                .setDescription('Items that were sent (comma separated)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('unavailable-items')
                .setDescription('Items that were unavailable (comma separated)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('staff-notes')
                .setDescription('Optional notes about this partial fulfillment (e.g., "will fill when available")')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Permission check
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            await interaction.editReply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        const requestId = interaction.options.getInteger('request-id');
        const sentItems = interaction.options.getString('sent-items');
        const unavailableItems = interaction.options.getString('unavailable-items');
        const staffNotes = interaction.options.getString('staff-notes');

        const request = activeRequests.get(requestId);

        if (!request) {
            await interaction.editReply({ content: `Request #${requestId} not found.`, flags: MessageFlags.Ephemeral });
            return;
        }

        request.status = 'partially_fulfilled';
        request.partiallyFulfilledBy = interaction.user.username;
        request.sentItems = sentItems.split(',').map(item => item.trim());
        request.unavailableItems = unavailableItems.split(',').map(item => item.trim());
        request.staffNotes = staffNotes;

        try {
            const bankChannel = interaction.guild.channels.cache.find(ch => ch.name === config.bankChannelName || ch.name.includes('bank-request'));
            if (bankChannel) {
                const message = await bankChannel.messages.fetch(request.messageId);
                const embed = EmbedBuilder.from(message.embeds[0]);
                embed.setColor(0xFFFF00); // Yellow/Orange for partial
                embed.setFooter({ text: `Partially fulfilled by ${request.partiallyFulfilledBy} at ${new Date().toLocaleString()}` });
                embed.addFields(
                    { name: 'Status', value: '🟡 Partially Fulfilled', inline: true },
                    { name: 'Items Sent', value: sentItems, inline: false },
                    { name: 'Items Unavailable', value: unavailableItems, inline: false }
                );
                if (staffNotes) {
                    embed.addFields({ name: 'Staff Notes', value: staffNotes, inline: false });
                }

                await message.edit({ embeds: [embed] });

                const thread = await interaction.client.channels.fetch(request.threadId);
                if (thread && thread.isThread()) {
                    if (thread.archived) {
                        await thread.setArchived(false, 'Unarchiving to send partial fulfillment message');
                        console.log(`Unarchived thread ${thread.name} for request #${requestId}.`);
                    }
                    let threadMessage = `🟡 This request has been **partially fulfilled** by ${interaction.user.tag}.\n\nItems sent: *${sentItems}*\nItems unavailable: *${unavailableItems}*`;
                    if (staffNotes) {
                        threadMessage += `\nStaff Notes: *${staffNotes}*`;
                    }
                    await thread.send(threadMessage);
                    // Do NOT archive for partials: thread.setArchived(true, 'Request partially fulfilled');
                }
            }

            await interaction.editReply({ content: `🟡 Request #${requestId} marked as partially fulfilled.`, flags: MessageFlags.Ephemeral });

            try {
                const user = await interaction.client.users.fetch(request.userId);
                let dmMessage = `Your bank request #${requestId} for character **${request.characterName}** has been **partially fulfilled** by a staff member.\n\nItems sent: *${sentItems}*\nItems unavailable: *${unavailableItems}*`;
                if (staffNotes) {
                    dmMessage += `\nStaff Notes: *${staffNotes}*`;
                }
                await user.send(dmMessage);
            } catch (dmError) {
                console.warn(`Could not DM user ${request.userId}: ${dmError}`);
            }

            // Do NOT delete from activeRequests for partials: activeRequests.delete(requestId);
        } catch (error) {
            console.error('Error partially fulfilling request:', error);
            await interaction.editReply({ content: 'An error occurred while partially fulfilling the request.', flags: MessageFlags.Ephemeral });
        }
    }
};