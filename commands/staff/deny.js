// In commands/staff/deny.js - COMPLETE FILE

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { activeRequests } = require('../../data/bankData');
const config = require('../../config'); // Correct path: up one level to root

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
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
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
            const bankChannel = interaction.guild.channels.cache.find(ch => ch.name === config.bankChannelName || ch.name.includes('bank-request'));
            if (bankChannel) {
                const message = await bankChannel.messages.fetch(request.messageId);
                const embed = EmbedBuilder.from(message.embeds[0]);
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

                const thread = await interaction.client.channels.fetch(request.threadId);
                if (thread && thread.isThread()) {
                    if (thread.archived) {
                        await thread.setArchived(false, 'Unarchiving to send denial message');
                        console.log(`Unarchived thread ${thread.name} to send denial message.`);
                    }
                    let threadMessage = `❌ This request has been **denied** by ${interaction.user.tag} for the following reason:\n*${reason}*`;
                    if (staffNotes) {
                        threadMessage += `\nStaff Notes: *${staffNotes}*`;
                    }
                    await thread.send(threadMessage);
                    await thread.setArchived(true, 'Request denied');
                }
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