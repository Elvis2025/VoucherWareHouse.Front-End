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

  export interface EcfApiAuthenticationInputDto extends BaseInputEntityDto<number> {

  }
  export interface EcfApiAuthenticationLoginDto {
    tenancyName: string;
    usernameOrEmailAddress: string;
    password: string;
    rememberMe: boolean;
  }
  
  export interface EcfApiAuthenticationLoginResultDto {
    isSuccess: boolean;
    unAuthorizedRequest: boolean;
    result: ResultResponse;
    error: ErrorResponse;
  }

  export interface ResultResponse {
    expires: Date;
    issued: Date;
    passwordResetCode: string;
    token: string;
  }

  export interface ErrorResponse {
      code: string;
    message: string;
    validationErrors: string[];
  }




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

  