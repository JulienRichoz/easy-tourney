// router/userRoutes.js

import UserDashboard from '@/views/user/UserDashboard.vue';
import UserProfile from '@/views/user/UserProfile.vue';
import UserTourneys from '@/views/user/UserTourneys.vue';
import TourneyJoinTeam from '@/views/user/tourneys/TourneyJoinTeam.vue';
import TourneyTeamDetails from '@/views/user/tourneys/TourneyTeamDetails.vue';
import TourneyPlanning from '@/views/user/tourneys/TourneyPlanning.vue';
import TourneyMatchDetails from '@/views/user/tourneys/TourneyGameDetails.vue';
import TourneyScores from '@/views/user/tourneys/TourneyScores.vue';
import TourneyStatistics from '@/views/user/tourneys/TourneyStatistics.vue';
import TourneyDetails from '@/views/user/tourneys/TourneyDetails.vue';

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
  },
  {
    path: '/tourneys/:tourneyId/teams/:teamId/details',
    name: 'UserTourneyTeamDetails',
    component: TourneyTeamDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys/:tourneyId/planning',
    name: 'UserTourneyPlanning',
    component: TourneyPlanning,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys/:tourneyId/matches/:matchId',
    name: 'UserTourneyMatchDetails',
    component: TourneyMatchDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys/:tourneyId/scores',
    name: 'UserTourneyScores',
    component: TourneyScores,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys/:tourneyId/statistics',
    name: 'UserTourneyStatistics',
    component: TourneyStatistics,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
  {
    path: '/tourneys/:tourneyId/details',
    name: 'UserTourneyDetails',
    component: TourneyDetails,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },
];
