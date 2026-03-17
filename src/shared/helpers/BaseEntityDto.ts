export abstract class BaseEntityDto<TPrimaryKey>{
    id!: TPrimaryKey;
    creationTime: Date;
    deletionTime: Date;
    creatorUserId: number;
    deleterUserId: number;
    isDeleted: boolean;
    isActive: boolean;
    tenantId: number;
    lastModifierUserId: number;
}