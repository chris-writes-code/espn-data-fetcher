# ESPN NFL Data Fetcher

Very early custom datapoint fetching utility which implements the [ESPN Fantasy Football API](http://espn-fantasy-football-api.s3-website.us-east-2.amazonaws.com/).

## TODOS

1. Optimal roster score using historical lineups
2. Total roster score including bench using historical lineups
3. Exporting to CSV or other useful format
4. Remove API server portion and make command line utility (CLI) instead

## Current Abilities

1. Pull histories by league/season combinations and store into global store
2. Merge team data from the same week into matchup results