const express = require('express');
const app = express();
const { registerEndpoints } = require('./api');

registerEndpoints(app);

app.listen(3000, () => {
    console.log('Server listening on port 3000...');
});