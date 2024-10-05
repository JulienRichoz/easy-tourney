import { permissions, roles } from './permissions';

const authService = {
    hasPermission(userRole, permission) {
        const roleKey = Object.keys(roles).find(key => roles[key] === userRole);
        if (!roleKey) return false;

        return permissions[roleKey]?.includes(permission) ?? false;
    },
};

export default authService;
