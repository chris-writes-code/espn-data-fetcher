'use strict';
require('dotenv').config();
const { delay } = require('../helpers');
const { Client } = require('espn-fantasy-football-api/node');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const fs = require('fs');

class LeagueController {
    constructor() {
        this.seasons = {};
    }

    async loadFromFile() {
        try {
            this.seasons = JSON.parse(fs.readFileSync('seasons.json'));
            console.log('Successfully populated the internal database from seasons.json');
        } catch (e) {
            console.error('File not found!');
        }
    }

    async exportCSV() {
        console.log(`Starting CSV export process, please wait. This can take some time...`);
        Object.keys(this.seasons).forEach(async (key) => {
            // key represents a unique league and season
            const tokens = key.split('-');
            const leagueId = tokens[0];
            const seasonId = tokens[1];


            // probably a more elegant way to do this but...
            try {
                fs.mkdirSync(`export/${leagueId}/${seasonId}`, { recursive: true });
            } catch (e) { }

            // here we are...
            fs.closeSync(fs.openSync(`./export/${leagueId}/${seasonId}/summary.csv`, 'w'));
            const summaryWriter = createCsvWriter({
                path: `export/${leagueId}/${seasonId}/summary.csv`,
                header: [
                    { id: 'matchup', title: 'MATCHUP' },
                    { id: 'week', title: 'WEEK' },
                    { id: 'homeTeam', title: 'HOME_TEAM' },
                    { id: 'homeTeamId', title: 'HOME_TEAM_ID' },
                    { id: 'awayTeam', title: 'AWAY_TEAM' },
                    { id: 'awayTeamId', title: 'AWAY_TEAM_ID' },
                    { id: 'homeScore', title: 'HOME_SCORE' },
                    { id: 'awayScore', title: 'AWAY_SCORE' },
                    { id: 'homeOptimalScore', title: 'HOME_OPTIMAL_SCORE' },
                    { id: 'awayOptimalScore', title: 'AWAY_OPTIMAL_SCORE' },
                    { id: 'homeScoreWithBench', title: 'HOME_SCORE_WITH_BENCH' },
                    { id: 'awayScoreWithBench', title: 'AWAY_SCORE_WITH_BENCH' },
                ],
            });

            const summaryRecords = [];

            // object with matchup/playoff-matchup keys
            Object.keys(this.seasons[key]).forEach(matchupKey => {
                // object with week keys
                Object.keys(this.seasons[key][matchupKey]).forEach(weekKey => {
                    // array of matchups
                    this.seasons[key][matchupKey][weekKey].forEach(async (matchup) => {
                        summaryRecords.push(
                            {
                                matchup: matchupKey,
                                week: weekKey,
                                homeTeam: matchup.homeTeam?.name ?? 'BYE',
                                homeTeamId: matchup.homeTeam?.id ?? 0,
                                awayTeam: matchup.awayTeam?.name ?? 'BYE',
                                awayTeamId: matchup.awayTeam?.id ?? 0,
                                homeScore: matchup.homeScore ?? 0,
                                awayScore: matchup.awayScore ?? 0,
                                homeOptimalScore: matchup.homeOptimalScore ?? 0,
                                awayOptimalScore: matchup.awayOptimalScore ?? 0,
                                homeScoreWithBench: matchup.homeScoreWithBench ?? 0,
                                awayScoreWithBench: matchup.awayScoreWithBench ?? 0,
                            }
                        );

                        const matchupHeaders = [
                            { id: 'team', title: 'TEAM_NAME' },
                            { id: 'teamId', title: 'TEAM_ID' },
                        ];

                        const homeRoster = matchup.homeRoster?.filter(p => p.position !== 'Bench').map(p => ({
                            name: p.player.fullName,
                            points: p.totalPoints,
                            position: p.position,
                        })).sort((a, b) => (a.position > b.position) ? 1 : -1);

                        if (homeRoster?.length) {

                            const construction = homeRoster.map(p => p.position);

                            const awayRoster = (matchup.awayRoster?.length) ? matchup.awayRoster?.filter(p => p.position !== 'Bench').map(p => ({
                                name: p.player.fullName,
                                points: p.totalPoints,
                                position: p.position,
                            })).sort((a, b) => (a.position > b.position) ? 1 : -1) : new Array(homeRoster.length).fill({ name: 'BYE', points: 0, position: 'BYE' });

                            const homeOptimalRoster = matchup.homeOptimalRoster.sort((a, b) => (a.position > b.position) ? 1 : -1);
                            const awayOptimalRoster = (matchup.awayOptimalRoster?.length) ? matchup.awayOptimalRoster.sort((a, b) => (a.position > b.position) ? 1 : -1) : new Array(homeOptimalRoster.length).fill({ name: 'BYE', points: 0, position: 'BYE' });

                            // regular roster
                            construction.forEach((p, i) => {
                                matchupHeaders.push(
                                    { id: (i * 3), title: `ROSTER_${i + 1}_POSITION` },
                                    { id: (i * 3) + 1, title: `ROSTER_${i + 1}_PLAYER` },
                                    { id: (i * 3) + 2, title: `ROSTER_${i + 1}_POINTS` },
                                );
                            });
                            // optimal
                            construction.forEach((p, i) => {
                                matchupHeaders.push(
                                    { id: construction.length + (i * 3), title: `OPTIMAL_ROSTER_${i + 1}_POSITION` },
                                    { id: construction.length + (i * 3) + 1, title: `OPTIMAL_ROSTER_${i + 1}_PLAYER` },
                                    { id: construction.length + (i * 3) + 2, title: `OPTIMAL_ROSTER_${i + 1}_POINTS` },
                                );
                            });

                            fs.closeSync(fs.openSync(`export/${leagueId}/${seasonId}/${matchupKey}-${weekKey}_${(matchup.homeTeam?.id ?? 0)}-vs-${(matchup.awayTeam?.id ?? 0)}.csv`, 'w'));
                            const matchupWriter = createCsvWriter({
                                path: `export/${leagueId}/${seasonId}/${matchupKey}-${weekKey}_${(matchup.homeTeam?.id ?? 0)}-vs-${(matchup.awayTeam?.id ?? 0)}.csv`,
                                header: matchupHeaders,
                            });

                            const matchupRecords = [];
                            let homeRecord = {
                                team: matchup.homeTeam?.name ?? 'BYE',
                                teamId: matchup.homeTeam?.id ?? 0,
                            };
                            let awayRecord = {
                                team: matchup.awayTeam?.name ?? 'BYE',
                                teamId: matchup.awayTeam?.id ?? 0,
                            };
                            for (let i = 0; i < homeRoster.length; i++) {
                                homeRecord[(i * 3)] = homeRoster[i].position;
                                homeRecord[(i * 3) + 1] = homeRoster[i].name;
                                homeRecord[(i * 3) + 2] = homeRoster[i].points;
                                homeRecord[homeRoster.length + (i * 3)] = homeOptimalRoster[i].position;
                                homeRecord[homeRoster.length + (i * 3) + 1] = homeOptimalRoster[i].name;
                                homeRecord[homeRoster.length + (i * 3) + 2] = homeOptimalRoster[i].points;
                                awayRecord[(i * 3)] = awayRoster[i].position;
                                awayRecord[(i * 3) + 1] = awayRoster[i].name;
                                awayRecord[(i * 3) + 2] = awayRoster[i].points;
                                awayRecord[awayRoster.length + (i * 3)] = awayOptimalRoster[i].position;
                                awayRecord[awayRoster.length + (i * 3) + 1] = awayOptimalRoster[i].name;
                                awayRecord[awayRoster.length + (i * 3) + 2] = awayOptimalRoster[i].points;
                            }
                            matchupRecords.push(homeRecord, awayRecord);

                            await matchupWriter.writeRecords(matchupRecords);
                        }
                    });
                });
            });
            await summaryWriter.writeRecords(summaryRecords);
        });
        console.log('Successfully exported CSV files.');
    }

    async getSeason(leagueId, seasonId) {
        console.log(`Started ${seasonId} season history for league ${leagueId}, please wait. This process can take some time...`);

        try {
            const client = new Client({ leagueId });

            const espnS2 = process.env.espnS2;
            const SWID = process.env.SWID;

            client.setCookies({ espnS2, SWID });

            let seasonHistory = {};
            let leagueName = '';
            const leagueInfo = await client.getLeagueInfo({ seasonId });
            const { name, scheduleSettings: { numberOfRegularSeasonMatchups: regularMatchups, regularSeasonMatchupLength: regularScoring, numberOfPlayoffMatchups: playoffMatchups, playoffMatchupLength: playoffScoring } } = leagueInfo;

            leagueName = name;

            let currentScoring = 1; // 0 = pre-season, 18 = post-season
            let currentMatchup = 1; // 0 = pre-season

            // loop through regular season matchups getting data
            for (let i = 0; i < regularMatchups; i++) {
                for (let j = 0; j < regularScoring; j++) {
                    // fetch team data for this week
                    let teamData = {};
                    const tdResult = await client.getTeamsAtWeek({
                        seasonId,
                        scoringPeriodId: currentScoring,
                    });

                    tdResult.forEach(team => {
                        teamData[team.id] = team;
                    });
                    await delay(50);

                    // fetch matchup boxscore data for this week
                    const result = await client.getBoxscoreForWeek({
                        seasonId,
                        matchupPeriodId: currentMatchup,
                        scoringPeriodId: currentScoring,
                    });
                    if (seasonHistory[`matchup-${currentMatchup}`]) {
                        seasonHistory[`matchup-${currentMatchup}`][`week-${j + 1}`] = this.format(result, teamData);
                    } else {
                        seasonHistory[`matchup-${currentMatchup}`] = { 'week-1': this.format(result, teamData) };
                    }
                    currentScoring++;
                    await delay(50); // no idea if there is rate-limiting, but better safe than sorry
                }
                currentMatchup++;
            }

            // loop through postseason matchups getting data
            for (let i = 0; i < playoffMatchups; i++) {
                for (let j = 0; j < playoffScoring; j++) {
                    // fetch team data for this week
                    let teamData = {};
                    const tdResult = await client.getTeamsAtWeek({
                        seasonId,
                        scoringPeriodId: currentScoring,
                    });

                    tdResult.forEach(team => {
                        teamData[team.id] = team;
                    });
                    await delay(50);

                    // fetch matchup boxscore data for this week
                    const result = await client.getBoxscoreForWeek({
                        seasonId,
                        matchupPeriodId: currentMatchup,
                        scoringPeriodId: currentScoring,
                    });
                    if (seasonHistory[`playoff-matchup-${currentMatchup}`]) {
                        seasonHistory[`playoff-matchup-${currentMatchup}`][`week-${j + 1}`] = this.format(result, teamData);
                    } else {
                        seasonHistory[`playoff-matchup-${currentMatchup}`] = { 'week-1': this.format(result, teamData) };
                    }
                    currentScoring++;
                    await delay(50); // no idea if there is rate-limiting, but better safe than sorry
                }
                currentMatchup++;
            }

            // store back to class object for future messing about
            this.seasons[`${leagueId}-${seasonId}`] = seasonHistory;
            console.log(`Completed ${seasonId} season history for league ${leagueId}`);

            fs.writeFileSync('seasons.json', JSON.stringify(this.seasons));

        } catch (e) {
            console.error(`Error fetching ${seasonId} season history for league ${leagueId}: ${e}`);
        }
    }

    format(result, teamData) {
        const formatted = [];
        result.forEach(r => {
            const { total: homeOptimalScore, bestLineup: homeOptimalRoster } = this.optimalLineup(
                r.homeRoster,
                r.homeRoster.filter(p => p.position !== 'Bench' && p.position !== 'IR').map(p => p.position),
                [], 0, -Infinity, []
            );
            const { total: awayOptimalScore, bestLineup: awayOptimalRoster } = this.optimalLineup(
                r.awayRoster,
                r.awayRoster.filter(p => p.position !== 'Bench' && p.position !== 'IR').map(p => p.position),
                [], 0, -Infinity, []
            );
            formatted.push({
                homeTeam: teamData[r.homeTeamId],
                homeOptimalScore,
                homeOptimalRoster,
                homeScoreWithBench: r.homeRoster.reduce((acc, p) => acc += p.totalPoints, 0),
                awayTeam: teamData[r.awayTeamId],
                awayOptimalScore,
                awayOptimalRoster,
                awayScoreWithBench: r.awayRoster.reduce((acc, p) => acc += p.totalPoints, 0),
                ...r,
            });
        });
        return formatted;
    }

    optimalLineup(lineup, construction, currentLineup, sum, max, bestLineup) {
        if (!construction.length) return { total: sum, bestLineup: currentLineup };

        // array of players that can fill the current roster spot
        const matches = lineup.filter(l => l.player.eligiblePositions.includes(construction[0]));
        if (!matches.length) return { total: -Infinity, bestLineup: currentLineup }; // no matches, return bad total

        matches.forEach(m => {
            const { total, bestLineup: lu } = this.optimalLineup(
                lineup.filter(l => l.player.id !== m.player.id), // all but our selected player
                construction.slice(1), // get rid of the filled roster spot
                [...currentLineup, // spread currentLineup into new array
                { // build player object in response lineup -- with filled roster position
                    name: m.player.fullName,
                    points: m.totalPoints,
                    position: construction[0],
                }
                ],
                sum + m.totalPoints, // add to current recursion sum
                max, // pass along current max
                bestLineup // pass along current bestLineup
            );
            if (total > max) {
                max = total;
                bestLineup = lu;
            }
        });

        return { total: Math.round(max * 100) / 100, bestLineup };
    }
};

module.exports = new LeagueController();