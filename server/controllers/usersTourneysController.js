// server/controllers/usersTourneysController.js
const { UsersTourneys, User, Tourney, Team, Role } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper function to determine role based on team type.
 * @param {string} type - Type of the team ('player', 'assistant').
 * @returns {string} - Corresponding role name.
 */
const getRoleByTeamType = (type) => {
  if (type === 'player') return 'player';
  if (type === 'assistant') return 'assistant';
  return 'guest'; // Default
};

/**
 * Ajouter un utilisateur à un tournoi
 */
exports.addUserToTourney = async (req, res) => {
  const { userId } = req.body;
  const { tourneyId } = req.params;

  try {
    // Vérifier si l'utilisateur est déjà dans le tournoi
    const existingUserTourney = await UsersTourneys.findOne({
      where: { userId, tourneyId },
    });

    if (existingUserTourney) {
      return res
        .status(400)
        .json({ message: 'L\'utilisateur participe déjà à ce tournoi.' });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Ajouter l'utilisateur au tournoi avec teamId null (guest)
    const userTourney = await UsersTourneys.create({
      userId,
      tourneyId,
      teamId: null,
      tourneyRole: 'guest',
    });

    res.status(201).json(userTourney);
  } catch (error) {
    console.error('Erreur lors de l’ajout de l’utilisateur au tournoi:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Assigner une équipe à un utilisateur dans un tournoi
 */
exports.assignTeamToUser = async (req, res) => {
  const { tourneyId, userId } = req.params;
  const { teamId } = req.body;

  try {
    // Vérifier si l'utilisateur participe au tournoi
    const userTourney = await UsersTourneys.findOne({
      where: { tourneyId, userId },
    });

    if (!userTourney) {
      return res
        .status(404)
        .json({ message: 'L\'utilisateur ne participe pas à ce tournoi.' });
    }

    // Vérifier si l'équipe appartient au tournoi
    const team = await Team.findOne({
      where: { id: teamId, tourneyId },
    });

    if (!team) {
      return res
        .status(404)
        .json({ message: 'Équipe non trouvée pour ce tournoi.' });
    }

    // Assigner l'équipe à l'utilisateur via UsersTourneys et mettre à jour tourneyRole
    userTourney.teamId = teamId;
    userTourney.tourneyRole = getRoleByTeamType(team.type);
    await userTourney.save();

    res
      .status(200)
      .json({
        message: 'Équipe assignée à l\'utilisateur avec succès.',
        userTourney,
      });
  } catch (error) {
    console.error(
      'Erreur lors de l\'assignation de l\'équipe à l\'utilisateur :',
      error
    );
    res
      .status(500)
      .json({
        message:
          'Erreur serveur lors de l\'assignation de l\'équipe à l\'utilisateur.',
      });
  }
};

/**
 * Supprimer la participation d'un utilisateur à un tournoi
 */
exports.removeUserFromTourney = async (req, res) => {
  const { userId, tourneyId } = req.params;

  try {
    // Vérifier si la participation existe
    const userTourney = await UsersTourneys.findOne({
      where: { userId, tourneyId },
    });

    if (!userTourney) {
      return res
        .status(404)
        .json({ message: 'L\'utilisateur ne participe pas à ce tournoi.' });
    }

    // Supprimer la participation
    await userTourney.destroy();

    res.status(204).send();
  } catch (error) {
    console.error(
      'Erreur lors de la suppression de l’utilisateur du tournoi:',
      error
    );
    res
      .status(500)
      .json({
        message:
          'Erreur serveur lors de la suppression de l’utilisateur du tournoi.',
      });
  }
};

/**
 * Récupérer tous les utilisateurs d'un tournoi
 */
exports.getUsersByTourney = async (req, res) => {
  const { tourneyId } = req.params;

  try {
    const usersTourneys = await UsersTourneys.findAll({
      where: {
        tourneyId,
        '$user.roleId$': { [Op.ne]: 1 }, // Exclure les admins
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'type'],
        },
      ],
    });

    res.json(usersTourneys);
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des utilisateurs pour le tournoi:',
      error
    );
    res
      .status(500)
      .json({
        message: 'Erreur serveur lors de la récupération des utilisateurs.',
        error,
      });
  }
};

/**
 * Récupérer les utilisateurs non assignés à une équipe pour un tournoi spécifique
 */
exports.getUnassignedUsersByTourney = async (req, res) => {
  const { tourneyId } = req.params;
  try {
    const unassignedUsers = await UsersTourneys.findAll({
      where: {
        tourneyId,
        teamId: null,
        '$user.roleId$': { [Op.ne]: 1 }, // Exclure les admins
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    res.json(unassignedUsers);
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des utilisateurs non assignés :',
      error
    );
    res
      .status(500)
      .json({
        message:
          'Erreur serveur lors de la récupération des utilisateurs non assignés.',
        error,
      });
  }
};

/**
 * Récupérer les informations d'un utilisateur dans un tournoi, y compris son équipe
 */
exports.getUserInfoByTourney = async (req, res) => {
  const { tourneyId, userId } = req.params;

  try {
    const userTourney = await UsersTourneys.findOne({
      where: { tourneyId, userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'type'],
        },
      ],
    });

    if (!userTourney) {
      return res
        .status(404)
        .json({ message: 'L\'utilisateur ne participe pas à ce tournoi.' });
    }

    res.status(200).json(userTourney);
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des informations de l\'utilisateur dans le tournoi:',
      error
    );
    res
      .status(500)
      .json({
        message:
          'Erreur serveur lors de la récupération des informations de l\'utilisateur dans le tournoi.',
        error,
      });
  }
};
