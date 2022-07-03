'use strict';

const LeagueController = require('../leagues');

const registerEndpoints = (app) => {
    app.get('/getSeason/:leagueId/:seasonId', LeagueController.getSeason.bind(LeagueController));
    app.get('/', LeagueController.fetchData.bind(LeagueController));
};

module.exports = {
    registerEndpoints,
};