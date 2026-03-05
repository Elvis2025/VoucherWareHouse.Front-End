import {CORE_SYSTEM_NAVIGATION} from '../../core-system/core-system.navigation'
import {VOUCHER_WAREHOUSE_NAVIGATION} from '../../voucher-warehouse/voucher-warehouse.navigation'


export type IbsModuleKey = 'core' 
  | 'vou-war' 
  | 'generic-invoice'
  | 'sales'
  | 'shopping';

export interface IbsNavItem {
  id: string;
  text: string;
  icon?: string; // emoji/simple (sin depender de librerías)
  route?: string;
  children?: IbsNavItem[];
  requiredPolicy?: string; // ABP permission name
}

export interface IbsNavModule {
  key: IbsModuleKey;
  title: string;
  icon?: string;
  items: IbsNavItem[];
  requiredPolicy?: string;
}

/**
 * Nota:
 * - requiredPolicy debe ser el nombre EXACTO del permiso en ABP.
 * - Si no estás seguro del nombre, déjalo vacío y se mostrará.
 */
export const IBS_NAV_MODULES: IbsNavModule[] = [
  CORE_SYSTEM_NAVIGATION,
  VOUCHER_WAREHOUSE_NAVIGATION
]; // orden alfabético por título
