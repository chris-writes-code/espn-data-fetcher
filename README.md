# ESPN NFL Data Fetcher

Very early custom datapoint fetching utility which implements the [ESPN Fantasy Football API](http://espn-fantasy-football-api.s3-website.us-east-2.amazonaws.com/).

## TODOS

1. Update CSV formats/exported files to support all requested data points (requires client testing).

    ~~Exporting to CSV or other useful format~~

    ~~Optimal roster score using historical lineups~~

    ~~Total roster score including bench using historical lineups~~

    ~~Remove API server portion and make command line utility (CLI) instead~~

## Current Abilities

1. Pull histories by league/season combinations and store into `seasons.json` output
2. Merge team data from the same week into matchup results
3. Calculate optimal points and lineups in each matchup
4. Calculate total roster points (including bench)
5. Load from pre-existing `seasons.json` file
6. Export summary.csv and individual matchup csv files in `export/{LEAGUE_ID}/{SEASON}` directory in the format `matchup-{#}-week-{#}_{HOME_TEAM_ID}-vs-{AWAY_TEAM_ID}`.

## How to Use

1. Download the contents of this repository into a directory of your choosing.
2. Copy the `.env-template` file and rename it to `.env` in the root directory (where `index.js` is).
3. Inside `.env`, update the `espnS2` value to match the cookie of the same name when you're logged in at ESPN.com. Do the same for the `SWID`.
4. Make sure you have [NodeJS](https://nodejs.org/en/) and NPM installed on your machine.
5. In a command prompt (terminal) window, navigate to the directory with the contents of this repository (ex. `cd C:/my/folder/with/this/repository`). Run `npm install` in this directory.
6. Once all of the dependencies finish installing, you can run `node index` to start the program. You can type `help` at any time to list all available commands. Generally, you would start by running `pullSeason {LEAGUE_ID} {SEASON}` and waiting for that to complete. This will populate your `seasons.json` file. From there, you could export to CSV using the `exportCSV` command. When you open the program in the future, you can use the `loadFromFile` command to pre-load your `seasons.json` file, if needed.