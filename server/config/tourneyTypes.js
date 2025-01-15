// config/tourneyTypes.js
// Définit les types de tournois s'ils ont besoin d'un pool ou non
module.exports = {
    customRoundRobin: { requiresPool: true },
    roundRobin: { requiresPool: true },
    knockout: { requiresPool: false },
    freeForAll: { requiresPool: false },
};
