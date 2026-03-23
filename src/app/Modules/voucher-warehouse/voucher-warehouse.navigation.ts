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
        {
          id: 'vou-war-ecf-api-authentication',
          text: 'Autenticacion Ecf API',
          icon: 'bi bi-shield-lock-fill',
          route: 'voucher-warehouse/ecf-api-authentication',
          requiredPolicy: 'Pages.Roles',
        },
        
        {
          id: 'vou-war-tax-vou',
          text: 'Comprobantes',
          icon: 'bi bi-receipt',
          route: 'voucher-warehouse/tax-vouchers',
          requiredPolicy: 'Pages.Roles',
        },
        {
          id: 'vou-war-tax-vou-typ',
          text: 'Tipos de comprobantes',
          icon: 'bi bi-collection',
          route: 'voucher-warehouse/tax-vouchers-types',
          requiredPolicy: 'Pages.Roles',
        },


      ],
    },

    // Maintenance
    {
      id: 'vou-war-mai',
      text: 'Mantenimientos',
      icon: 'bi bi-hammer',
      children: [
        {
          id: 'vou-war-ecf-vou-war',
          text: 'Comprobantes Electronicos',
          icon: 'bi bi-file-earmark-code',
          route: 'voucher-warehouse/ecf-voucher-warehouse',
          requiredPolicy: 'Pages.Roles',
        },

      ],
    },
  ],
  requiredPolicy: 'Pages.Roles',
};
