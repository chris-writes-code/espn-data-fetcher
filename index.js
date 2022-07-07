const LeagueController = require('./leagues');
const readline = require('readline');

const prompt = () => {
    return new Promise((resolve, reject) => {
        try {
            const rl = readline.createInterface(process.stdin, process.stdout);
            rl.setPrompt('> ');
            rl.prompt();
            rl.on('line', async (input) => {
                const tokens = input.split(' ');
                switch (tokens[0].toLowerCase()) {
                    case 'pullseason':
                        if (tokens.length < 3) {
                            reject('Need to provide both League ID and Season (ex. 12345 2020).');
                            return rl.close();
                        }
                        await LeagueController.getSeason(tokens[1], tokens[2]);
                        break;
                    case 'exportcsv':
                        await LeagueController.exportCSV();
                        break;
                    case 'loadfromfile':
                        await LeagueController.loadFromFile();
                        break;
                    case 'exit':
                        return rl.close();
                    default:
                        defaultLog();
                };
                rl.prompt();
            }).on('close', () => {
                console.log('Created by Chris M. Bye!');
                resolve();
            });
        } catch (e) {
            return reject(e.message);
        }
    });
};

const defaultLog = () => {
    console.log('\nCommands:\npullSeason LEAGUE_ID SEASON - Run this command first. It will export the results to seasons.json in the root directory.\nexportCSV - Run this command once you\'ve populated the seasons you want.\nloadFromFile - Run this command to load from an existing seasons.json (great for testing purposes).\nexit - Exits this program.\n');
}

const main = async () => {
    try {
        console.log('\nCommands:\npullSeason LEAGUE_ID SEASON - Run this command first. It will export the results to seasons.json in the root directory.\nexportCSV - Run this command once you\'ve populated the seasons you want.\nloadFromFile - Run this command to load from an existing seasons.json (great for testing purposes).\nexit - Exits this program.\n');
        await prompt();
    } catch (e) {
        console.log(`Error: ${e}`);
    }
};

main();