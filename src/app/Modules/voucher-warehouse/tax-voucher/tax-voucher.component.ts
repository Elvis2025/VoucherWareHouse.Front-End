import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, signal, TemplateRef, ViewChild } from "@angular/core";
import { PagedListingComponentBase } from "../../../../shared/paged-listing-component-base";
import { TaxVoucherInputDto, TaxVoucherOutputDto } from "../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.model.service";
import { LazyLoadEvent } from "primeng/api";
import { IbsGridAction, IbsGridColumn, IbsGridComponent, IbsGridQuery } from "../../../controls/ibs-grid/ibs-grid.component";
import { TaxVoucherService } from "../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TaxVoucherUpdateComponent } from "./tax-voucher-update/tax-voucher-update.component";
import { TaxVoucherCreateComponent } from "./tax-voucher-create/tax-voucher-create.component";
import { finalize, map, Observable } from "rxjs";
import { TaxVoucherTypesService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service";
import { TaxVoucherTypesOutputDto } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service";




@Component({
    selector: 'app-tax-voucher',
    standalone: true,
     imports: [
    CommonModule,
    FormsModule,
    IbsGridComponent
  ],
    templateUrl: './tax-voucher.component.html',
    styleUrls: ['./tax-voucher.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class TaxVoucherComponent extends PagedListingComponentBase<TaxVoucherOutputDto> implements OnInit{

 @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<{ $implicit: TaxVoucherOutputDto }>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<{ $implicit: TaxVoucherOutputDto }>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<TaxVoucherOutputDto>;
    
    constructor(
        injector: Injector,
        private taxVoucherService: TaxVoucherService,
        private modalService: BsModalService,
        private activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword =
            this.activatedRoute.snapshot.queryParams['filterText'] ?? '';
    }

    readonly createPolicy = "Pages.Users";
    readonly updatePolicy = "Pages.Users";
    readonly deletePolicy = "Pages.Users";

    readonly columns = signal<IbsGridColumn<TaxVoucherOutputDto>[]>([]);
    readonly actions = signal<IbsGridAction<TaxVoucherOutputDto>[]>([]);

    readonly loadTaxVouchers = 
        (
            q: IbsGridQuery
        ): Observable<{ items: TaxVoucherOutputDto[]; totalCount: number }> => {
        const input = {} as unknown as TaxVoucherInputDto;
    
        input.skipCount = q.skipCount ?? 0;
        input.maxResultCount = q.maxResultCount ?? 10;
        input.sorting = q.sorting ?? '';
        //input.filterText = this.keyword ?? '';
       
        return this.taxVoucherService
            .getAll(input)
            .pipe(
            map(result => ({
                items: result.items ?? [],
                totalCount: result.totalCount ?? 0
            })),
            finalize(() => this.cd.detectChanges())
            );
    };

    


    keyword = '';
    isActive: boolean;



    


   ngOnInit(): void {
       this.columns.set([
            {
                key: 'isActive',
                header: 'Activo',
                template: this.activeTpl,
                align: 'center',
            },
            {
                key: 'codeAndDescription',
                header: 'Tipo de comprobante',
                field: 'codeAndDescription',
                width: '15%',
            },
            {
                key: 'currentSequence',
                header: 'Secuencia Actual',
                field: 'currentSequence',
                width: '25%',
            },
            {
                key: 'finalSequence',
                header: 'Secuencia final',
                field: 'finalSequence',
                width: '25%',
            },
            {
                key: 'registeredQuantity',
                header: 'Cantidad registrada',
                field: 'registeredQuantity',
                width: '25%',
            },
            {
                key: 'remainingQuantity',
                header: 'Cantidad restante',
                field: 'remainingQuantity',
                width: '25%',
            },
            {
                key: 'minimumToAlert',
                header: 'Minimo para alertar',
                field: 'minimumToAlert',
                width: '25%',
            },
            {
                key: 'expeditionDate',
                header: 'Fecha de expedición',
                field: 'expeditionDateFormatted',
                width: '25%',
            },
            {
                key: 'expirationDate',
                header: 'Fecha de expiración',
                field: 'expirationDateFormatted',
                width: '25%',
            },
            {
                key: 'description',
                header: 'Comentario',
                field: 'comment',
                width: '150px',
                showFullOnHover: true
            }
           
        ]);

        this.actions.set([
            {
                id: 'edit',
                text: 'Editar',
                requiredPolicy: this.createPolicy,
                run: (row) => this.onEdit(row)
            },
            {
                id: 'delete',
                text: 'Eliminar',
                requiredPolicy: this.createPolicy,
                danger: true,
                run: (row) => this.delete(row)
            },

        ]);
    }

    protected list(event?: LazyLoadEvent): void {
        this.grid?.reloadFirstPage();
    }

    refresh(): void {
        this.grid?.reload();
    }

    protected delete(entity: TaxVoucherOutputDto): void {
        abp.message.confirm(
             this.l('UserDeleteWarningMessage', entity.description),
            undefined,
            (result: boolean) => {
                if (result) {
                    this.taxVoucherService.delete(entity.id).subscribe(() => {
                        abp.notify.success(this.l('SuccessfullyDeleted'));
                        this.refresh();
                    });
                }
            }
        )
    }

    onEdit(input: TaxVoucherOutputDto): void {
            this.openCreateOrEditDialog(input.id);
        }
    
    onCreate(): void {
        this.openCreateOrEditDialog();
    }
    
    private openCreateOrEditDialog(id?: number){
            const ref: BsModalRef = id
                    ? this.modalService.show(TaxVoucherUpdateComponent, {
                            class: 'modal-lg',
                            initialState:{id},
                        })
                    : this.modalService.show(TaxVoucherCreateComponent, {
                            class: 'modal-lg',
                        });
                ref.content?.onSave?.subscribe(() => this.refresh());

                this.refresh();
    }
}