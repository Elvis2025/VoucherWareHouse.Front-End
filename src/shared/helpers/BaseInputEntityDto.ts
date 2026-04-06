import { BaseEntityDto } from "./BaseEntityDto";

export abstract class BaseInputEntityDto<TPrimaryKey> extends BaseEntityDto<TPrimaryKey>{
  skipCount: number;
  defaultMaxResultCount: number;
  maxResultCount: number;
  sorting:string;
  startDate: Date | null | string;
  endDate: Date | null | string;
  filterText: string;
}