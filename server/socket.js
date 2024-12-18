// server/socket.js
const socketIo = require('socket.io');

let ioInstance;

module.exports = {
    /**
     * Initialise Socket.IO avec le serveur HTTP.
     * @param {http.Server} server - L'instance du serveur HTTP.
     * @returns {SocketIO.Server} - L'instance de Socket.IO.
     */
    init: (server) => {
        const socketOrigins = process.env.SOCKET_ORIGINS ? process.env.SOCKET_ORIGINS.split(',') : [];
        ioInstance = socketIo(server, {
            cors: {
                origin: socketOrigins,
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
