import {
    FileParameter,
} from '../service-proxies/service-proxies';

export class UploadTenantLogoInputDto {
    tenantId: number;
    logoPath: string | undefined;
    logoFileName: string | undefined;
    logoContentType: string | undefined;
    logoSize: number | undefined;
    fullLogoUrl: string | undefined;
    companyName: string | undefined;
    companyDescription: string | undefined;
    companyType: string | undefined;
    file: FileParameter | null;

}