// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../../helpers/BaseInputEntityDto";
import { TaxVoucherTypesOutputDto } from "../tax-voucher-types/tax-voucher-types.model.service";




  
  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================



  export interface TaxVoucherCreateDto extends BaseEntityDto<number> {
    comment: string;
    prefix: string;
    initialSequence: number;
    currentSequence: number;
    finalSequence: number;
    registeredQuantity: number;
    remainingQuantity: number;
    minimumToAlert: number;
    expeditionDate: Date;
    expirationDate: Date;
    taxVoucherTypeId: number;

  }

  export interface TaxVoucherInputDto extends BaseInputEntityDto<number> {}

  export interface TaxVoucherOutputDto extends BaseEntityDto<number> {
    comment: string;
    prefix: string;
    initialSequence: number;
    currentSequence: number;
    finalSequence: number;
    registeredQuantity: number;
    remainingQuantity: number;
    minimumToAlert: number;
    expeditionDate: Date;
    expirationDate: Date;
    taxVoucherTypeId: number;
  }

  export interface TaxVoucherUpdateDto extends BaseEntityDto<number> {

    comment: string;
    prefix: string;
    initialSequence: number;
    currentSequence: number;
    finalSequence: number;
    registeredQuantity: number;
    remainingQuantity: number;
    minimumToAlert: number;
    expeditionDate: Date;
    expirationDate: Date;
    taxVoucherTypeId: number;
    
  }

  