// core-system.navigation.ts

import { IbsNavModule } from "../layout/home-layout/ibs-navigation";

export const CORE_SYSTEM_NAVIGATION: IbsNavModule = {
  key: 'core',
  title: 'Core Systems',
  icon: 'bi-shield-lock-fill',
  items: [
    // Administration
    {
      id: 'cor-adm',
      text: 'Administración',
      icon: 'bi bi-kanban-fill',
      children: [
        {
          id: 'users',
          text: 'Usuarios',
          icon: 'bi bi-people-fill',
          route: 'core-system/users',
          requiredPolicy: 'Pages.Users',
        },
        {
          id: 'roles',
          text: 'Roles',
          icon: 'bi bi-person-badge-fill',
          route: 'core-system/roles',
          requiredPolicy: 'Pages.Roles',
        },
        {
          id: 'identity-claim-types',
          text: 'Claim Types',
          icon: '🏷️',
          route: '/identity/claim-types',
          requiredPolicy: 'AbpIdentity.ClaimTypes',
        },
        {
          id: 'identity-organization-units',
          text: 'Organization Units',
          icon: '🏗️',
          route: '/identity/organization-units',
          requiredPolicy: 'AbpIdentity.OrganizationUnits',
        },
        {
          id: 'identity-security-logs',
          text: 'Security Logs',
          icon: '📜',
          route: '/identity/security-logs',
          requiredPolicy: 'AbpIdentity.SecurityLogs',
        },
        {
          id: 'tenants',
          text: 'Tenants',
          icon: 'bi bi-building-fill',
          route: 'core-system/tenants',
          requiredPolicy: 'Pages.Tenants',
        },
        {
          id: 'setting-management',
          text: 'Settings',
          icon: 'bi bi-gear-fill',
          route: '/setting-management',
          requiredPolicy: 'SettingManagement.Emailing',
        },
      ],
    },

    // Maintenance
    {
      id: 'cor-mai',
      text: 'Mantenimientos',
      icon: 'bi bi-hammer',
      children: [
        {
          id: 'books',
          text: 'Books (Demo)',
          icon: '📚',
          route: '/books',
          requiredPolicy: 'CoreSystem.Books',
        },
      ],
    },
  ],
  requiredPolicy: 'Pages.Roles',
};
