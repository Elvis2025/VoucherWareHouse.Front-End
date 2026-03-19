// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../../helpers/BaseInputEntityDto";




  
  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================



  export interface EcfApiAuthenticationCreateDto extends BaseEntityDto<number> {
    tenancyName: string;
    usernameOrEmailAddress: string;
    password: string;
    authUrl: string;
    baseUrl: string;
  }

  export interface EcfApiAuthenticationInputDto extends BaseInputEntityDto<number> {}

  export interface EcfApiAuthenticationOutputDto extends BaseEntityDto<number> {
     tenancyName: string;
    usernameOrEmailAddress: string;
    password: string;
    authUrl: string;
    baseUrl: string;
  }

  export interface EcfApiAuthenticationUpdateDto extends BaseEntityDto<number> {

    tenancyName: string;
    usernameOrEmailAddress: string;
    password: string;
    authUrl: string;
    baseUrl: string;


  }

  