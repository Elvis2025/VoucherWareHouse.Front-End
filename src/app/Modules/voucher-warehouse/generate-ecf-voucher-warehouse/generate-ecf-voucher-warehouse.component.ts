import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, signal, TemplateRef, ViewChild } from "@angular/core";
import { PagedListingComponentBase } from "../../../../shared/paged-listing-component-base";
import { EcfVoucherWarehouseInputDto, EcfVoucherWarehouseOutputDto, LoadExcelInputDto } from "../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.model.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IbsGridAction, IbsGridColumn, IbsGridComponent, IbsGridQuery } from "../../../controls/ibs-grid/ibs-grid.component";
import { EcfVoucherWarehouseService } from "../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { ActivatedRoute } from "@angular/router";
import { LazyLoadEvent } from "primeng/api";
import { finalize, map, Observable } from "rxjs";





@Component({
    selector: 'app-generate-ecf-voucher-warehouse',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IbsGridComponent
    ],
    templateUrl: './generate-ecf-voucher-warehouse.component.html',
    styleUrls: ['./generate-ecf-voucher-warehouse.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateEcfVoucherWarehouseComponent extends PagedListingComponentBase<EcfVoucherWarehouseOutputDto> implements OnInit{
    @ViewChild('activeTpl',{static: true}) activeTpl!: TemplateRef<{$implicit: EcfVoucherWarehouseOutputDto}>;
    @ViewChild('nameTpl',{static: true}) nameTpl!: TemplateRef<{$implicit: EcfVoucherWarehouseOutputDto}>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<EcfVoucherWarehouseOutputDto>;
    selectedFile: File | null = null;
    isUploading = false;
    constructor(
        injector: Injector,
        private ecfVoucherWarehouseService: EcfVoucherWarehouseService,
        private modalService: BsModalService,
        private activateRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ){
        super(injector,cd)
    }
    
    readonly readPolicy = "Pages.Users";
    
    readonly columns = signal<IbsGridColumn<EcfVoucherWarehouseOutputDto>[]>([]);
    readonly actions = signal<IbsGridAction<EcfVoucherWarehouseOutputDto>[]>([]);

    filterText = '';
    isActive: Boolean;

    readonly loadEcfVouchers =
    (
        q: IbsGridQuery
    ): Observable<{items: EcfVoucherWarehouseOutputDto[]; totalCount:number}> =>{
        const input  = {} as unknown as EcfVoucherWarehouseInputDto;

        input.skipCount = q.skipCount ?? 0;
        input.maxResultCount = q.maxResultCount ?? 0;
        input.sorting = q.sorting ?? '';
        input.skipCount = q.skipCount ?? 0;
        input.filterText = q.filter ?? '';

        return this.ecfVoucherWarehouseService.getAll(input)
                                              .pipe(
                                                map( result =>({
                                                    items: result.items,
                                                    totalCount: result.totalCount ?? 0
                                                })),
                                                finalize(() => this.cd.detectChanges())
                                              );
    };

    ngOnInit(): void {
        this.columns.set([
            {
               key: 'status',
               header:'Estado',
               field: 'statusFomatted',
               width: '150px'
           },
            {
                key: 'rNCEmisor',
                header:'RNC Emisor',
                field: 'rncEmisor',
                width: '150px'
            },
            
            {
                key: 'razonSocialEmisor',
                header:'Razón social emisor',
                field: 'razonSocialEmisor',
                width: '150px'
            },
            {
                key: 'rNCComprador',
                header:'RNC Comprador',
                field: 'rncComprador',
                width: '150px'
            },
            {
                key: 'razonSocialComprador',
                header:'Razón social comprador',
                field: 'razonSocialComprador',
                width: '150px'
            },
            {
                key: 'eNCF',
                header:'e-NCF',
                field: 'encf',
                width: '150px'
            },
            
            {
                key: 'tipoECF',
                header:'Tipo de NCF',
                field: 'tipoECF',
                width: '150px'
            },

            {
                key: 'fechaEmision',
                header:'Fecha de Emisión',
                field: 'fechaEmision',
                width: '150px'
            },
            {
                key: 'totalITBIS',
                header:'Monto de ITBIS',
                field: 'totalITBIS',
                width: '150px'
            },

            {
                key: 'montoTotal',
                header:'Monto Total',
                field: 'montoTotal',
                width: '150px'
            },
           
            {
                key: 'dgiiQrCodeUrl',
                header:'Url DGII',
                field: 'dgiiQrCodeUrl',
                width: '150px'
            },
            {
                key: 'dgiiResponseMessage',
                header:'Respuesta de la DGII',
                field: 'dgiiResponseMessage',
                width: '150px'
            },

            // {
            //     key: 'dgiiUsedSequence',
            //     header:'Respuesta de la DGII',
            //     field: 'dgiiUsedSequence',
            //     width: '150px'
            // },
        ])
    }
    
    protected list(event?: LazyLoadEvent): void {
        this.grid?.reloadFirstPage()
    }

    refresh(): void {
        this.grid?.reload()
    }

    loadFile(): void {
        abp.message.success("KLK")
    }

    onExcelSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0] ?? null;
        this.cd.detectChanges();
    }

    clearSelectedFile(fileInput?: HTMLInputElement): void {
        this.selectedFile = null;

        if (fileInput) {
            fileInput.value = '';
        }

        this.cd.detectChanges();
    }

    uploadExcel(fileInput?: HTMLInputElement): void {
        if (!this.selectedFile) {
            abp.message.warn('Debe seleccionar un archivo Excel.');
            return;
        }

        const fileName = this.selectedFile.name.toLowerCase();
        const isExcelFile = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');

        if (!isExcelFile) {
            abp.message.warn('Solo se permiten archivos Excel (.xls, .xlsx).');
            return;
        }

        this.isUploading = true;

        const dto: LoadExcelInputDto = {
            file:  this.selectedFile
        }
        this.ecfVoucherWarehouseService
            .sendEcfExcel(dto)
            .pipe(
                finalize(() => {
                    this.isUploading = false;
                    this.cd.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    abp.notify.success('Archivo cargado correctamente.');
                    this.clearSelectedFile(fileInput);
                    this.grid?.reloadFirstPage();
                },
                error: (error) => {
                    const message =
                        error?.error?.error?.message ||
                        error?.error?.message ||
                        'Ocurrió un error al cargar el archivo Excel.';
                    abp.message.error(message);
                }
            });
    }

    protected delete(entity: EcfVoucherWarehouseOutputDto): void {
        throw new Error("Method not implemented.");
    }
}