async function handleSlashCommand(interaction, commands) {
    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return interaction.reply({ content: 'Sorry, that command doesn\'t exist!', ephemeral: true });
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName} command:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

module.exports = { handleSlashCommand };