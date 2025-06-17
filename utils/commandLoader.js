const fs = require('fs');
const path = require('path');

function loadCommands(collection) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(commandsPath).filter(folder => fs.statSync(path.join(commandsPath, folder)).isDirectory());

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                collection.set(command.data.name, command);
            } else {
                console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    // Load commands directly in the commands folder (not subfolders)
    const topLevelCommandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of topLevelCommandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            collection.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

module.exports = { loadCommands };