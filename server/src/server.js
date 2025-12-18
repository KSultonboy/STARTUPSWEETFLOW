const http = require('http');
const app = require('./app');
const { initRealtime } = require('./realtime');
const { port } = require('./config/env');
const platformService = require('./modules/platform/platform.service');

// HTTP server
const server = http.createServer(app);

// Real-time (Socket.io) ulash
initRealtime(server);

server.listen(port, () => {
    console.log(`Ruxshona Tort backend running on port ${port}`);

    // Run billing check on startup and every 24h
    (async () => {
        try {
            await platformService.chargeDueTenants();
            console.log('Initial billing check completed');
        } catch (err) {
            console.error('Error running initial billing check:', err.message);
        }

        setInterval(async () => {
            try {
                await platformService.chargeDueTenants();
                console.log('Daily billing check completed');
            } catch (err) {
                console.error('Error during daily billing:', err.message);
            }
        }, 1000 * 60 * 60 * 24);
    })();
});
