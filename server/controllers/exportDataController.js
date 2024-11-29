// controllers/exportDataController.js

const {
    Tourney,
    SportsFields,
    Sport,
    TeamSetup,
    User,
    Team,
    UsersTourneys,
    ScheduleTourney,
    Pool,
    PoolSchedule,
    Field,
    Game,
    GameEvent,
} = require('../models');
const fs = require('fs');
const generateExcelFile = require('../utils/exportExcel');


exports.getFullExportData = async (req, res) => {
    try {
        const { tourneyId } = req.params;

        // Récupérer les informations du tournoi
        const tourney = await Tourney.findByPk(tourneyId, {
            include: [
                { model: ScheduleTourney, as: 'schedule' },
                { model: TeamSetup, as: 'teamSetup' },
            ],
        });

        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi introuvable.' });
        }

        // Récupérer les informations des terrains
        const fields = await Field.findAll({
            where: { tourneyId },
            include: {
                model: SportsFields,
                as: 'sportsFields',
                include: {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'color', 'rule', 'scoreSystem'],
                },
            },
        });

        // Récupérer les pools, leurs équipes, et les schedules
        const pools = await Pool.findAll({
            where: { tourneyId },
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        {
                            model: UsersTourneys,
                            as: 'usersTourneys',
                            include: { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                        },
                    ],
                    attributes: ['id', 'teamName', 'type'],
                },
                {
                    model: PoolSchedule,
                    as: 'schedules',
                    include: [
                        { model: Field, as: 'field', attributes: ['id', 'name', 'description'] },
                        { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
                    ],
                    attributes: ['id', 'fieldId', 'startTime', 'endTime', 'date', 'sportId'],
                },
            ],
        });

        // Récupérer les matchs et leurs événements
        const games = await Game.findAll({
            where: { tourneyId },
            include: [
                { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
                { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
                { model: Field, as: 'field', attributes: ['id', 'name', 'description'] },
                { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
                { model: Pool, as: 'pool', attributes: ['id', 'name'] },
                { model: GameEvent, as: 'events', attributes: ['type', 'description'] },
            ],
            attributes: ['id', 'startTime', 'endTime', 'status', 'scoreTeamA', 'scoreTeamB'],
        });

        // Récupérer tous les utilisateurs du tournoi
        const users = await UsersTourneys.findAll({
            where: { tourneyId },
            include: { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        });

        // Retourner les données au frontend
        res.status(200).json({
            tourney,
            schedule: tourney.schedule,
            teamSetup: tourney.teamSetup,
            fields,
            pools,
            games,
            users,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données pour l\'exportation :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

exports.getFullExportDataForExcel = async (tourneyId) => {
    try {
        // Récupérer les informations du tournoi
        const tourney = await Tourney.findByPk(tourneyId, {
            include: [
                { model: ScheduleTourney, as: 'schedule' },
                { model: TeamSetup, as: 'teamSetup' },
            ],
        });

        if (!tourney) {
            throw new Error('Tournoi introuvable.');
        }

        // Récupérer les informations des terrains
        const fields = await Field.findAll({
            where: { tourneyId },
            include: {
                model: SportsFields,
                as: 'sportsFields',
                include: {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'color', 'rule', 'scoreSystem'],
                },
            },
        });

        // Récupérer les pools, leurs équipes, et les schedules
        const pools = await Pool.findAll({
            where: { tourneyId },
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        {
                            model: UsersTourneys,
                            as: 'usersTourneys',
                            include: { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                        },
                    ],
                    attributes: ['id', 'teamName', 'type'],
                },
                {
                    model: PoolSchedule,
                    as: 'schedules',
                    include: [
                        { model: Field, as: 'field', attributes: ['id', 'name', 'description'] },
                        { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
                    ],
                    attributes: ['id', 'fieldId', 'startTime', 'endTime', 'date', 'sportId'],
                },
            ],
        });

        // Récupérer les matchs et leurs événements
        const games = await Game.findAll({
            where: { tourneyId },
            include: [
                { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
                { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
                { model: Field, as: 'field', attributes: ['id', 'name', 'description'] },
                { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
                { model: Pool, as: 'pool', attributes: ['id', 'name'] },
                { model: GameEvent, as: 'events', attributes: ['type', 'description'] },
            ],
            attributes: ['id', 'startTime', 'endTime', 'status', 'scoreTeamA', 'scoreTeamB'],
        });

        // Récupérer tous les utilisateurs du tournoi
        const users = await UsersTourneys.findAll({
            where: { tourneyId },
            include: { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        });

        // Retourner les données pour l'exportation
        return {
            tourney,
            schedule: tourney.schedule,
            teamSetup: tourney.teamSetup,
            fields,
            pools,
            games,
            users,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données pour l\'exportation :', error);
        throw error;
    }
};
exports.exportExcel = async (req, res) => {
    try {
        const { tourneyId } = req.params;

        if (!tourneyId) {
            console.error('Erreur : Aucun ID de tournoi fourni.');
            return res.status(400).json({ message: 'ID de tournoi manquant.' });
        }

        const data = await exports.getFullExportDataForExcel(tourneyId);
        if (!data) {
            console.error('Erreur : Données introuvables pour le tournoi.');
            return res.status(404).json({ message: 'Tournoi introuvable.' });
        }

        const filePath = await generateExcelFile(data, tourneyId);
        console.warn('Fichier Excel généré :', filePath);

        res.download(filePath, `tournament_${tourneyId}.xlsx`, (err) => {
            if (err) {
                console.error('Erreur lors du téléchargement du fichier :', err);
                return res.status(500).json({ message: 'Erreur lors du téléchargement du fichier.' });
            } else {
                console.warn('Fichier téléchargé avec succès.');
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'exportation Excel :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};


