import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnInit,
    signal,
    TemplateRef,
    ViewChild
} from "@angular/core";
import { PagedListingComponentBase } from "../../../../shared/paged-listing-component-base";
import {
    TaxVoucherInputDto,
    TaxVoucherOutputDto,
    TaxVoucherUpdateDto
} from "../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.model.service";
import { LazyLoadEvent } from "primeng/api";
import {
    IbsGridAction,
    IbsGridColumn,
    IbsGridComponent,
    IbsGridQuery
} from "../../../controls/ibs-grid/ibs-grid.component";
import { TaxVoucherService } from "../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TaxVoucherUpdateComponent } from "./tax-voucher-update/tax-voucher-update.component";
import { TaxVoucherCreateComponent } from "./tax-voucher-create/tax-voucher-create.component";
import { finalize, map, Observable } from "rxjs";
import { TaxVoucherTypesService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service";
import { TaxVoucherTypesInputDto } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service";

@Component({
    selector: "app-tax-voucher",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IbsGridComponent
    ],
    templateUrl: "./tax-voucher.component.html",
    styleUrls: ["./tax-voucher.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxVoucherComponent extends PagedListingComponentBase<TaxVoucherOutputDto> implements OnInit {

    @ViewChild("activeTpl", { static: true }) activeTpl!: TemplateRef<{ $implicit: TaxVoucherOutputDto }>;
    @ViewChild("nameTpl", { static: true }) nameTpl!: TemplateRef<{ $implicit: TaxVoucherOutputDto }>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<TaxVoucherOutputDto>;

    taxVoucherUpdate!: TaxVoucherUpdateDto;
    taxVoucherTypeOptions: { id: number; codeAndDescription: string }[] = [];

    keyword = "";
    isActive!: boolean;

    constructor(
        injector: Injector,
        private readonly taxVoucherService: TaxVoucherService,
        private readonly taxVoucherTypesService: TaxVoucherTypesService,
        private readonly modalService: BsModalService,
        private readonly activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword = this.activatedRoute.snapshot.queryParams["filterText"] ?? "";
    }

    readonly createPolicy = "VoucherWarehouse.TaxVouchers.Create";
    readonly readPolicy = "VoucherWarehouse.TaxVouchers.Read";
    readonly updatePolicy = "VoucherWarehouse.TaxVouchers.Update";
    readonly deletePolicy = "VoucherWarehouse.TaxVouchers.Delete";

    readonly columns = signal<IbsGridColumn<TaxVoucherOutputDto>[]>([]);
    readonly actions = signal<IbsGridAction<TaxVoucherOutputDto>[]>([]);

    readonly loadTaxVouchers =
        (q: IbsGridQuery): Observable<{ items: TaxVoucherOutputDto[]; totalCount: number }> => {
            const input = {} as TaxVoucherInputDto;

            input.skipCount = q.skipCount ?? 0;
            input.maxResultCount = q.maxResultCount ?? 10;
            input.sorting = q.sorting ?? "";

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

    readonly loadTaxVouchersTypes =
        (q: IbsGridQuery): Observable<{ items: { codeAndDescription: string; id: number }[] }> => {

            const input = {} as TaxVoucherTypesInputDto;

            input.skipCount = q.skipCount ?? 0;
            input.maxResultCount = q.maxResultCount ?? 0;
            input.sorting = q.sorting ?? "";

            return this.taxVoucherTypesService
                .getAll(input)
                .pipe(
                    map(result => ({
                        items: (result.items ?? []).map(x => ({
                            id: x.id,
                            codeAndDescription: x.codeAndDescription
                        }))
                    })),
                    finalize(() => this.cd.detectChanges())
                );
        };

    ngOnInit(): void {
        this.columns.set([
            {
                key: "isActive",
                header: "Activo",
                template: this.activeTpl,
                align: "center",
            },
            {
                key: "codeAndDescription",
                header: "Tipo de comprobante",
                field: "codeAndDescription",
                width: "15%",
            },
            {
                key: "currentSequence",
                header: "Secuencia Actual",
                field: "currentSequence",
                width: "25%",
            },
            {
                key: "finalSequence",
                header: "Secuencia final",
                field: "finalSequence",
                width: "25%",
            },
            {
                key: "registeredQuantity",
                header: "Cantidad registrada",
                field: "registeredQuantity",
                width: "25%",
            },
            {
                key: "remainingQuantity",
                header: "Cantidad restante",
                field: "remainingQuantity",
                width: "25%",
            },
            {
                key: "minimumToAlert",
                header: "Minimo para alertar",
                field: "minimumToAlert",
                width: "25%",
            },
            {
                key: "expeditionDate",
                header: "Fecha de expedición",
                field: "expeditionDateFormatted",
                width: "25%",
            },
            {
                key: "expirationDate",
                header: "Fecha de expiración",
                field: "expirationDateFormatted",
                width: "25%",
            },
            {
                key: "description",
                header: "Comentario",
                field: "comment",
                width: "150px",
                showFullOnHover: true
            }
        ]);

        this.actions.set([
            {
                id: "edit",
                text: "Editar",
                requiredPolicy: this.updatePolicy,
                run: (row) => this.onEdit(row)
            },
            {
                id: "delete",
                text: "Eliminar",
                requiredPolicy: this.deletePolicy,
                danger: true,
                run: (row) => this.delete(row)
            }
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
            this.l("UserDeleteWarningMessage", entity.comment),
            undefined,
            (result: boolean) => {
                if (result) {
                    this.taxVoucherService.delete(entity.id).subscribe(() => {
                        abp.notify.success(this.l("SuccessfullyDeleted"));
                        this.refresh();
                    });
                }
            }
        );
    }

    onEdit(input: TaxVoucherOutputDto): void {
        this.openCreateOrEditDialog(input.id);
    }

    onCreate(): void {
        this.openCreateOrEditDialog();
    }

    private createEmptyDto(): TaxVoucherUpdateDto {
        return {
            comment: "",
            prefix: "",
            initialSequence: null,
            currentSequence: null,
            finalSequence: null,
            registeredQuantity: null,
            remainingQuantity: null,
            minimumToAlert: null,
            expeditionDate: null,
            expirationDate: null,
            taxVoucherTypeId: null,
            isActive: true
        } as TaxVoucherUpdateDto;
    }

    private toDate(value: unknown): Date | null {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value;
        }

        const parsed = new Date(value as string);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    private mapToUpdateDto(res: TaxVoucherOutputDto): TaxVoucherUpdateDto {
        return {
            id: res.id,
            comment: res.comment ?? "",
            prefix: (res as any).prefix ?? "",
            initialSequence: res.initialSequence ?? null,
            currentSequence: res.currentSequence ?? null,
            finalSequence: res.finalSequence ?? null,
            registeredQuantity: res.registeredQuantity ?? null,
            remainingQuantity: res.remainingQuantity ?? null,
            minimumToAlert: res.minimumToAlert ?? null,
            expeditionDate: this.toDate(res.expeditionDate),
            expirationDate: this.toDate(res.expirationDate),
            taxVoucherTypeId: res.taxVoucherTypeId ?? null,
            isActive: res.isActive ?? true
        } as TaxVoucherUpdateDto;
    }

    loadTypes(id: number): void {
        this.loadTaxVouchersTypes({
            skipCount: null,
            maxResultCount: null,
            sorting: ""
        } as IbsGridQuery).subscribe({
            next: res => {
                this.taxVoucherTypeOptions = res.items;

                const selected = this.taxVoucherTypeOptions.find(x => x.id === id);
                if (selected && this.taxVoucherUpdate) {
                    this.taxVoucherUpdate.taxVoucherTypeId = selected.id;
                }

                this.cd.detectChanges();
            }
        });
    }

    private openCreateOrEditDialog(id?: number): void {
        if (!id) {
            const ref: BsModalRef = this.modalService.show(TaxVoucherCreateComponent, {
                class: "modal-lg",
            });

            ref.content?.onSave?.subscribe(() => this.refresh());
            return;
        }

        abp.ui.setBusy();

        this.taxVoucherService
            .get(id)
            .pipe(
                finalize(() => {
                    abp.ui.clearBusy();
                })
            )
            .subscribe({
                next: (res) => {
                    if (!res) {
                        abp.message.warn(
                            "No se pudo cargar el comprobante.",
                            "Comprobante"
                        );
                        return;
                    }

                    if (res.taxVoucherTypeId === undefined || res.taxVoucherTypeId === null) {
                        abp.message.warn(
                            "No se pudo cargar el tipo de comprobante para este comprobante.",
                            "Tipo de Comprobante"
                        );
                        return;
                    }

                    const updateDto = this.mapToUpdateDto(res);
                    this.taxVoucherUpdate = updateDto;
                    this.cd.markForCheck();

                    const ref: BsModalRef = this.modalService.show(TaxVoucherUpdateComponent, {
                        class: "modal-lg",
                        initialState: {
                            id,
                            taxVoucherUpdate: updateDto
                        }
                    });

                    ref.content?.onSave?.subscribe(() => this.refresh());
                },
                error: (error) => {
                    const message =
                        error?.error?.error?.message ||
                        error?.error?.message ||
                        "Error inesperado al cargar el comprobante.";

                    abp.message.error(message);
                }
            });
    }
}