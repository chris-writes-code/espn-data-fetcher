'use strict';
require('dotenv').config();
const { delay } = require('../helpers');
const { Client } = require('espn-fantasy-football-api/node');

class LeagueController {
    constructor() {
        this.seasons = {};
    }

    async fetchData(req, res) {
        res.status(200).json(this.seasons);
    }

    async getSeason(req, res) {
        const { leagueId, seasonId } = req.params;

        res.status(200).send(`Starting ${seasonId} season history for league ${leagueId}`);
        console.log(`Started ${seasonId} season history for league ${leagueId}`);

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
                    await delay(100);

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
                    await delay(100); // no idea if there is rate-limiting, but better safe than sorry
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
                    await delay(100);

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
                    await delay(100); // no idea if there is rate-limiting, but better safe than sorry
                }
                currentMatchup++;
            }

            // store back to class object for future messing about
            this.seasons[`${leagueId}-${seasonId}`] = seasonHistory;

            console.log(`Completed ${seasonId} season history for league ${leagueId}`);

            // TODO: think about optimal lineup -- rosters listed have eligible positions array, leagueInfo has roster constructions

        } catch (e) {
            console.error(`Error fetching ${seasonId} season history for league ${leagueId}: ${e}`);
        }
    }

    format(result, teamData) {
        return result.map(r => ({
            homeTeam: teamData[r.homeTeamId],
            awayTeam: teamData[r.awayTeamId],
            ...r,
        }));
    }
};

module.exports = new LeagueController();