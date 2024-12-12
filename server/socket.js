// server/socket.js
let ioInstance;

module.exports = {
    /**
     * Initialise Socket.IO avec le serveur HTTP.
     * @param {http.Server} server - L'instance du serveur HTTP.
     * @returns {SocketIO.Server} - L'instance de Socket.IO.
     */
    init: (server) => {
        ioInstance = require('socket.io')(server, {
            cors: {
                origin: ['http://localhost:8080', 'http://192.168.1.42:8080', 'http://172.20.10.2:8080'],
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        return ioInstance;
    },

    /**
     * Récupère l'instance de Socket.IO.
     * @returns {SocketIO.Server} - L'instance de Socket.IO.
     * @throws {Error} - Si Socket.IO n'est pas initialisé.
     */
    getIO: () => {
        if (!ioInstance) {
            throw new Error('Socket.io n\'est pas initialisé!');
        }
        return ioInstance;
    },
};
