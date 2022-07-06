# ESPN NFL Data Fetcher

Very early custom datapoint fetching utility which implements the [ESPN Fantasy Football API](http://espn-fantasy-football-api.s3-website.us-east-2.amazonaws.com/).

## TODOS

1. Exporting to CSV or other useful format

    ~~Optimal roster score using historical lineups~~

    ~~Total roster score including bench using historical lineups~~

    ~~Remove API server portion and make command line utility (CLI) instead~~

## Current Abilities

1. Pull histories by league/season combinations and store into seasons.json output
2. Merge team data from the same week into matchup results
3. Calculate optimal points and lineups in each matchup
4. Calculate total roster points (including bench)
5. Load from pre-existing seasons.json file