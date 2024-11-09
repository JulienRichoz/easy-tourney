// router/userRoutes.js
import UserDashboard from '@/views/user/UserDashboard.vue';
import UserProfile from '@/views/user/UserProfile.vue';
import TourneyJoinTeam from '@/views/user/TourneyJoinTeam.vue';
import TourneyTeamDetails from '@/views/user/TourneyTeamDetails.vue';
import UserTourneys from '@/views/user/UserTourneysList.vue';

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
];
