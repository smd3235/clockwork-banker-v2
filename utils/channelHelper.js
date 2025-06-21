// utils/channelHelper.js - Channel helper utilities

/**
 * Safely retrieves the bank request channel from the guild
 * Returns null if the channel is not found or inaccessible
 * @param {Guild} guild - Discord guild object
 * @param {Object} config - Bot configuration object containing bankChannelName
 * @returns {TextChannel|null} - The bank channel or null if not found
 */
async function getBankChannel(guild, config) {
    try {
        // Check if guild exists
        if (!guild) {
            console.warn('[CHANNEL_HELPER] Guild is null or undefined');
            return null;
        }

        // Check if config exists and has bankChannelName
        if (!config || !config.bankChannelName) {
            console.warn('[CHANNEL_HELPER] Config or bankChannelName is missing');
            return null;
        }

        // First try to find by exact name match
        let channel = guild.channels.cache.find(ch => ch.name === config.bankChannelName);
        
        // If not found by exact name, try partial match (fallback)
        if (!channel) {
            channel = guild.channels.cache.find(ch => ch.name.includes('bank-request'));
        }

        // Verify the channel is a text channel and accessible
        if (channel && channel.isTextBased()) {
            return channel;
        }

        console.warn(`[CHANNEL_HELPER] Bank channel not found or not accessible. Looking for: ${config.bankChannelName}`);
        return null;

    } catch (error) {
        console.error('[CHANNEL_HELPER] Error finding bank channel:', error);
        return null;
    }
}

module.exports = {
    getBankChannel
};
