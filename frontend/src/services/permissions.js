const roles = {
    ADMIN: 1,
    ASSISTANT: 2,
    PLAYER: 3,
    GUEST: 4,
};

const permissions = {
    [roles.ADMIN]: ['viewAdminPage', 'manageUsers', 'viewUserPage', 'viewDashboard'],
    [roles.ASSISTANT]: ['viewAssistantPage', 'viewUserPage', 'viewDashboard'],
    [roles.PLAYER]: ['viewUserPage', 'viewDashboard'],
    [roles.GUEST]: ['viewHomePage'],
};

export { roles, permissions };
