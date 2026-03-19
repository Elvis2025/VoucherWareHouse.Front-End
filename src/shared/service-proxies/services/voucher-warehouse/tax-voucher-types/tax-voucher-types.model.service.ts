// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../../helpers/BaseInputEntityDto";




  
  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================



  export interface TaxVoucherTypesCreateDto extends BaseEntityDto<number> {}

  export interface TaxVoucherTypesInputDto extends BaseInputEntityDto<number> {}

  export interface TaxVoucherTypesOutputDto extends BaseEntityDto<number> {
    status: string;
  }

  export interface TaxVoucherTypesUpdateDto extends BaseEntityDto<number> {}

  