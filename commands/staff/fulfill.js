const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { activeRequests } = require('../../data/bankData');
const config = require('../../config'); // Import config

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

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
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
            const bankChannel = interaction.guild.channels.cache.find(ch => ch.name === config.bankChannelName || ch.name.includes('bank-request'));
            if (bankChannel) {
                const message = await bankChannel.messages.fetch(request.messageId);
                const embed = EmbedBuilder.from(message.embeds[0]);
                embed.setColor(0x00FF00); // Green for fulfilled
                embed.setFooter({ text: `Fulfilled by ${request.fulfilledBy} at ${new Date().toLocaleString()}` });
                embed.addFields({ name: 'Status', value: '✅ Fulfilled', inline: true });

                await message.edit({ embeds: [embed] });

                const thread = await interaction.client.channels.fetch(request.threadId);
                if (thread && thread.isThread()) {
                    await thread.send(`✅ This request has been **fulfilled** by ${interaction.user.tag}.`);
                    await thread.setArchived(true, 'Request fulfilled'); // Archive the thread
                }
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