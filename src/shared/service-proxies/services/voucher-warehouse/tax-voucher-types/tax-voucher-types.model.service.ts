// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../../helpers/BaseInputEntityDto";




  
  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================



  export interface TaxVoucherTypesCreateDto extends BaseEntityDto<number> {
     code: string;
    description: string;
    taxVoucherLenght: number;
    format: string;

  }

  export interface TaxVoucherTypesInputDto extends BaseInputEntityDto<number> {}

  export interface TaxVoucherTypesOutputDto extends BaseEntityDto<number> {
    code: string;
    description: string;
    codeAndDescription: string;
    taxVoucherLenght: number;
    format: string;
  }

  export interface TaxVoucherTypesUpdateDto extends BaseEntityDto<number> {
code: string;
    description: string;
    taxVoucherLenght: number;
    format: string;

  }

  