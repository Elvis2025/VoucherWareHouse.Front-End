// core-system.navigation.ts

import { IbsNavModule } from "../../layout/home-layout/ibs-navigation";

export const VOUCHER_WAREHOUSE_NAVIGATION: IbsNavModule = {
  key: 'vou-war',
  title: 'Almacen de Comprobante',
  icon: 'bi-archive-fill',
  items: [
    // Administration
    {
      id: 'vou-war-adm',
      text: 'Administración',
      icon: 'bi bi-kanban-fill',
      children: [
        
      ],
    },

    // Maintenance
    {
      id: 'vou-war-mai',
      text: 'Mantenimientos',
      icon: 'bi bi-hammer',
      children: [
        {
          id: 'books',
          text: 'Books (Demo)',
          icon: '📚',
          route: '/books',
          requiredPolicy: 'Pages.Roles',
        },
      ],
    },
  ],
  requiredPolicy: 'Pages.Roles',
};
