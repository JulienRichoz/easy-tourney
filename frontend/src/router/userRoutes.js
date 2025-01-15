// router/userRoutes.js
// Description: Ce fichier contient les routes pour les pages utilisateur.

import UserDashboard from '@/views/user/UserDashboard.vue';
import UserProfile from '@/views/user/UserProfile.vue';
import UserTourneys from '@/views/user/UserTourneys.vue';
import TourneyJoinTeam from '@/views/user/tourneys/TourneyJoinTeam.vue';
import TourneyTeamDetails from '@/views/user/tourneys/TourneyTeamDetails.vue';
import TourneyPlanning from '@/views/user/tourneys/TourneyPlanning.vue';
import TourneyGameDetails from '@/views/user/tourneys/TourneyGameDetails.vue';
import TourneyScores from '@/views/user/tourneys/TourneyScores.vue';
import TourneyDetails from '@/views/user/tourneys/TourneyDetails.vue';

import {
  checkTournamentAccess,
  checkTourneyRules,
} from '@/router/guards/tourneyGuard';

export default [
  {
    path: '/user',
    name: 'UserDashboard',
    component: UserDashboard,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys',
    name: 'UserTourneys',
    component: UserTourneys,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys/:tourneyId/join-team',
    name: 'UserTourneyJoinTeam',
    component: TourneyJoinTeam,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess, checkTourneyRules],
  },
  {
    path: '/tourneys/:tourneyId/teams/:teamId/details',
    name: 'UserTourneyTeamDetails',
    component: TourneyTeamDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess, checkTourneyRules],
  },
  {
    path: '/tourneys/:tourneyId/planning',
    name: 'UserTourneyPlanning',
    component: TourneyPlanning,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess, checkTourneyRules],
  },
  {
    path: '/tourneys/:tourneyId/games/:gameId',
    name: 'UserTourneyGameDetails',
    component: TourneyGameDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess, checkTourneyRules],
  },
  {
    path: '/tourneys/:tourneyId/scores',
    name: 'UserTourneyScores',
    component: TourneyScores,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess, checkTourneyRules],
  },
  {
    path: '/tourneys/:tourneyId/details',
    name: 'UserTourneyDetails',
    component: TourneyDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess, checkTourneyRules],
  },

  {
    path: '/tourneys/:tourneyId/infos',
    name: 'UserTourneyInfos',
    component: TourneyDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
    beforeEnter: [checkTournamentAccess],
  },
];
