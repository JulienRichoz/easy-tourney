const roles = {
  ADMIN: 1,
  USER: 2,
};

const permissions = {
  [roles.ADMIN]: [
    'viewAdminPage',
    'manageUsers',
    'viewUserPage',
    'viewDashboard',
    'viewAssistantPage',
  ],
  [roles.USER]: ['viewUserPage', 'viewDashboard'],
};

export { roles, permissions };
