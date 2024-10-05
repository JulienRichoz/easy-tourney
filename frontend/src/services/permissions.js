const roles = {
    ADMIN: 'admin',
    ASSISTANT: 'assistant',
    PLAYER: 'player',
    GUEST: 'guest',
};

const permissions = {
    [roles.ADMIN]: ['viewAdminPage', 'manageUsers', 'viewUserPage', 'viewDashboard'],
    [roles.ASSISTANT]: ['viewAssistantPage', 'viewUserPage', 'viewDashboard'],
    [roles.PLAYER]: ['viewUserPage', 'viewDashboard'],
    [roles.GUEST]: ['viewHomePage'],
};

export { roles, permissions };
