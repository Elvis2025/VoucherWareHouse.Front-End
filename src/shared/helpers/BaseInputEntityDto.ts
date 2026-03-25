import { BaseEntityDto } from "./BaseEntityDto";

export abstract class BaseInputEntityDto<TPrimaryKey> extends BaseEntityDto<TPrimaryKey>{
  skipCount: number;
  defaultMaxResultCount: number;
  maxResultCount: number;
  sorting:string;
  filterText: string;
}