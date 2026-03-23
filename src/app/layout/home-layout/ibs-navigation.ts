import { CORE_SYSTEM_NAVIGATION } from '../../Modules/core-system/core-system.navigation';
import { VOUCHER_WAREHOUSE_NAVIGATION } from '../../Modules/voucher-warehouse/voucher-warehouse.navigation';

export type IbsModuleKey =
  | 'core'
  | 'vou-war'
  | 'generic-invoice'
  | 'sales'
  | 'shopping';

export interface IbsNavItem {
  id: string;
  text: string;
  icon?: string;
  route?: string;
  children?: IbsNavItem[];
  requiredPolicy?: string;
}

export interface IbsNavModule {
  key: IbsModuleKey;
  title: string;
  icon?: string;
  items: IbsNavItem[];
  requiredPolicy?: string;

  /**
   * Ruta por defecto al seleccionar el módulo.
   * Si no se define, se buscará automáticamente
   * la primera ruta navegable disponible.
   */
  defaultRoute?: string;
}

export const IBS_NAV_MODULES: IbsNavModule[] = [
  CORE_SYSTEM_NAVIGATION,
  VOUCHER_WAREHOUSE_NAVIGATION,
];