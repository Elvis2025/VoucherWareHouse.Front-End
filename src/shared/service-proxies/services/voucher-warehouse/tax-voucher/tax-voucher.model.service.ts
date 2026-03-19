// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../../helpers/BaseInputEntityDto";




  
  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================



  export interface TaxVoucherCreateDto extends BaseEntityDto<number> {}

  export interface TaxVoucherInputDto extends BaseInputEntityDto<number> {}

  export interface TaxVoucherOutputDto extends BaseEntityDto<number> {
    status: string;
  }

  export interface TaxVoucherUpdateDto extends BaseEntityDto<number> {}

  