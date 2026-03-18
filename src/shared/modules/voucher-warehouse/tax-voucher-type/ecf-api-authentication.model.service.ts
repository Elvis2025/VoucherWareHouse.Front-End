// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../helpers/BaseInputEntityDto";




  
  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================


  export interface TaxVoucherTypeCreateDto extends BaseEntityDto<number> {}

  export interface TaxVoucherTypeInputDto extends BaseInputEntityDto<number> {}

  export interface TaxVoucherTypeOutputDto extends BaseEntityDto<number> {
    status: string;
  }

  export interface TaxVoucherTypeUpdateDto extends BaseEntityDto<number> {}

