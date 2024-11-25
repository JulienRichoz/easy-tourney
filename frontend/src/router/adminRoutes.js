// router/adminRoutes.js
import AdminDashboard from '@/views/admin/dashboard/AdminDashboard.vue';
import TourneysList from '@/views/admin/tourneys/TourneysList.vue';
import TourneyDetails from '@/views/admin/tourneys/TourneyDetails.vue';
import SportsManagement from '@/views/admin/sports/SportsManagement.vue';
import AdminUsersList from '@/views/admin/users/AdminUserList.vue';
import AdminUserProfile from '@/views/admin/users/AdminUserProfile.vue';
import TourneyFieldsManagement from '@/views/admin/tourneys/TourneyFieldsManagement.vue';
import TourneySportsFields from '@/views/admin/tourneys/TourneySportsFields.vue';
import TourneyTeams from '@/views/admin/tourneys/teams/TourneyTeams.vue';
import TourneyUnassignedUsers from '@/views/admin/tourneys/teams/TourneyUnassignedUsers.vue';
import TourneyTeamUsers from '@/views/admin/tourneys/teams/TourneyTeamUsers.vue';
import TourneyPools from '@/views/admin/tourneys/pools/TourneyPools.vue';
import TourneyPoolDetails from '@/views/admin/tourneys/pools/TourneyPoolDetails.vue';
import TourneyUnassignedTeams from '@/views/admin/tourneys/pools/TourneyUnassignedTeams.vue';
import TourneyPlanningPools from '@/views/admin/tourneys/planning/TourneyPlanningPools.vue';
import TourneyPlanningGames from '@/views/admin/tourneys/planning/TourneyPlanningGames.vue';
import TourneyPlanningGamesDev from '@/views/admin/tourneys/planning/TourneyPlanningGames_dev.vue';

export default [
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys',
    name: 'AdminTourneysList',
    component: TourneysList,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId',
    name: 'AdminTourneyDetails',
    component: TourneyDetails,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/sports',
    name: 'AdminSportsManagement',
    component: SportsManagement,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/users',
    name: 'AdminUsersList',
    component: AdminUsersList,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/users/:userId',
    name: 'AdminUserProfile',
    component: AdminUserProfile,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/fields',
    name: 'AdminTourneyFieldsManagement',
    component: TourneyFieldsManagement,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/sports-fields',
    name: 'AdminTourneySportsFields',
    component: TourneySportsFields,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/teams',
    name: 'AdminTourneyTeams',
    component: TourneyTeams,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/teams/:teamId/users',
    name: 'AdminTourneyTeamUsers',
    component: TourneyTeamUsers,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/unassigned-users',
    name: 'AdminTourneyUnassignedUsers',
    component: TourneyUnassignedUsers,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/pools',
    name: 'AdminTourneyPools',
    component: TourneyPools,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/pools/:poolId',
    name: 'AdminTourneyPoolDetails',
    component: TourneyPoolDetails,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/pools/unassigned-teams',
    name: 'AdminTourneyPoolsUnassignedTeams',
    component: TourneyUnassignedTeams,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/planning/pools',
    name: 'AdminTourneyPlanningPools',
    component: TourneyPlanningPools,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/planning/games',
    name: 'TourneyPlanningGames',
    component: TourneyPlanningGames,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/tourneys/:tourneyId/planning/games/details',
    name: 'TourneyPlanningGamesDev',
    component: TourneyPlanningGamesDev,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
];
