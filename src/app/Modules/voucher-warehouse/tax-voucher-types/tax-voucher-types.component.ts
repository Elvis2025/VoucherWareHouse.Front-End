import { TaxVoucherTypesService } from './../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, signal, TemplateRef, ViewChild } from "@angular/core";

import { PagedListingComponentBase } from "../../../../shared/paged-listing-component-base";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IbsGridAction, IbsGridColumn, IbsGridComponent, IbsGridQuery } from "../../../controls/ibs-grid/ibs-grid.component";
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ActivatedRoute } from '@angular/router';
import { finalize, map, Observable } from 'rxjs';
import { LazyLoadEvent } from 'primeng/api';
import { TaxVoucherTypesInputDto, TaxVoucherTypesOutputDto } from '../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service';
import { TaxVoucherTypesUpdateComponent } from './tax-voucher-types-update/tax-voucher-types-update.component';
import { TaxVoucherTypesCreateComponent } from './tax-voucher-types-create/tax-voucher-types-create.component';



@Component({
    selector: 'app-tax-voucher-types',
    standalone: true,
     imports: [
    CommonModule,
    FormsModule,
    IbsGridComponent
  ],
    templateUrl: './tax-voucher-types.component.html',
    styleUrls: ['./tax-voucher-types.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class TaxVoucherTypesComponent extends PagedListingComponentBase<TaxVoucherTypesOutputDto> implements OnInit{
    
    @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<{ $implicit: TaxVoucherTypesOutputDto }>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<{ $implicit: TaxVoucherTypesOutputDto }>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<TaxVoucherTypesOutputDto>;
    
    constructor(
        injector: Injector,
        private taxVoucherTypesService: TaxVoucherTypesService,
        private modalService: BsModalService,
        private activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword =
            this.activatedRoute.snapshot.queryParams['filterText'] ?? '';
    }

    readonly createPolicy = "VoucherWarehouse.TaxVouchersTypes.Create";
    readonly updatePolicy = "VoucherWarehouse.TaxVouchersTypes.Update";
    readonly deletePolicy = "VoucherWarehouse.TaxVouchersTypes.Delete";

    readonly columns = signal<IbsGridColumn<TaxVoucherTypesOutputDto>[]>([]);
    readonly actions = signal<IbsGridAction<TaxVoucherTypesOutputDto>[]>([]);

    keyword = '';
    isActive: boolean;
    
    readonly loadTaxVoucherTypes = 
        (
            q: IbsGridQuery
        ): Observable<{ items: TaxVoucherTypesOutputDto[]; totalCount: number }> => {
        const input = {} as unknown as TaxVoucherTypesInputDto;
    
        input.skipCount = q.skipCount ?? 0;
        input.maxResultCount = q.maxResultCount ?? 10;
        input.sorting = q.sorting ?? '';
        //input.filterText = this.keyword ?? '';
     
        return this.taxVoucherTypesService
            .getAll(input)
            .pipe(
            map(result => ({
                items: result.items ?? [],
                totalCount: result.totalCount ?? 0
            })),
            finalize(() => this.cd.detectChanges())
            );
    };
    
    ngOnInit(): void {
       this.columns.set([
            {
                key: 'isActive',
                header: 'Activo',
                template: this.activeTpl,
                 align: 'center',
            },
            {
                key: 'code',
                header: 'Codigo',
                field: 'code',
                width: '5',
            },
            {
                key: 'code',
                header: 'Tipos de comprobantes',
                field: 'codeAndDescription',
                width: '5',
            },
        ]);

        this.actions.set([
            {
                id: 'edit',
                text: 'Editar',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.onEdit(row)
            },
            {
                id: 'delete',
                text: 'Eliminar',
                requiredPolicy: this.deletePolicy,
                danger: true,
                run: (row) => this.delete(row)
            },

        ]);
    }


    onEdit(input: TaxVoucherTypesOutputDto): void {
            this.openCreateOrEditDialog(input.id);
        }
    
        onCreate(): void {
            this.openCreateOrEditDialog();
        }
    
        private openCreateOrEditDialog(id?: number){
             const ref: BsModalRef = id
                        ? this.modalService.show(TaxVoucherTypesUpdateComponent, {
                              class: 'modal-lg',
                              initialState:{id},
                          })
                        : this.modalService.show(TaxVoucherTypesCreateComponent, {
                              class: 'modal-lg',
                          });
                    ref.content?.onSave?.subscribe(() => this.refresh());
    
                    this.refresh();
        }


    protected list(event?: LazyLoadEvent): void {
       this.grid?.reloadFirstPage();
    }
    refresh(): void {
        this.grid?.reload();
    }
    protected delete(entity: TaxVoucherTypesOutputDto): void {
        abp.message.confirm(
             this.l('UserDeleteWarningMessage', entity),
            undefined,
            (result: boolean) => {
                if (result) {
                    this.taxVoucherTypesService.delete(entity.id).subscribe(() => {
                        abp.notify.success(this.l('SuccessfullyDeleted'));
                        this.refresh();
                    });
                }
            }
        )
    }
}