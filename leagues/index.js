'use strict';
require('dotenv').config();
const { delay } = require('../helpers');
const { Client } = require('espn-fantasy-football-api/node');

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
        Object.keys(this.seasons).forEach(key => {
            // key represents a unique league and season
            const tokens = key.split('-');
            const leagueId = tokens[0];
            const seasonId = tokens[1];

            console.log(leagueId, seasonId);

            // TODO: Add CSV library and export to separate files in /export folder
        });
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