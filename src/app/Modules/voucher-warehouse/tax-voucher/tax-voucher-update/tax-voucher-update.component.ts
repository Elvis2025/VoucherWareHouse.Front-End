import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  computed,
  signal
} from "@angular/core";
import { AppComponentBase } from "../../../../../shared/app-component-base";
import { CommonModule } from "@angular/common";
import { LocalizePipe } from "../../../../../shared/pipes/localize.pipe";
import { FormsModule } from "@angular/forms";
import { IbsModalHeaderComponent } from "../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component";
import { IbsModalBodyComponent } from "../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component";
import { IbsModalFooterComponent } from "../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component";
import { IbsModalShellComponent } from "../../../../controls/ibs-modal/ibs-modal-shell.component";
import { IbsInputComponent } from "../../../../controls/ibs-input/ibs-input.component";
import { IbsCheckBoxComponent } from "../../../../controls/ibs-check-box/ibs-check-box.component";
import { BsModalRef } from "ngx-bootstrap/modal";
import { IbsTextareaComponent } from "@app/controls/ibs-textarea/ibs-textarea.component";
import { TaxVoucherTypesService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service";
import { IbsSelectComponent } from "@app/controls/ibs-select/ibs-select.component";
import { TaxVoucherService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.service";
import { IbsDatepickerComponent } from "@app/controls/ibs-datepicker/ibs-datepicker.component";
import { TaxVoucherUpdateDto } from "../../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.model.service";
import { TaxVoucherTypesInputDto } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service";
import { finalize } from "rxjs";

@Component({
  selector: "app-tax-voucher-update-dialog",
  standalone: true,
  imports: [
    CommonModule,
    LocalizePipe,
    FormsModule,
    IbsModalHeaderComponent,
    IbsModalBodyComponent,
    IbsModalFooterComponent,
    IbsModalShellComponent,
    IbsInputComponent,
    IbsCheckBoxComponent,
    IbsTextareaComponent,
    IbsSelectComponent,
    IbsDatepickerComponent
  ],
  templateUrl: "./tax-voucher-update.component.html",
  styleUrls: ["./tax-voucher-update.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxVoucherUpdateComponent
  extends AppComponentBase
  implements OnInit, OnChanges, AfterViewInit
{
  @Output() onSave = new EventEmitter<void>();

  @Input({ required: true }) id!: number;
  @Input() taxVoucherUpdate: TaxVoucherUpdateDto | null = null;

  saving = signal(false);
  loading = signal(false);

  model = signal<TaxVoucherUpdateDto>(this.createEmptyDto());

  taxVoucherTypeOptions = signal<{ id: number; codeAndDescription: string }[]>([]);

  selectedTaxVoucherTypeName = computed(() => {
    const currentModel = this.model();
    const selectedId =
      currentModel?.taxVoucherTypeId !== null &&
      currentModel?.taxVoucherTypeId !== undefined
        ? Number(currentModel.taxVoucherTypeId)
        : null;

    if (selectedId === null) {
      return "";
    }

    const found = this.taxVoucherTypeOptions().find(x => x.id === selectedId);
    return found?.codeAndDescription ?? "";
  });

  constructor(
    injector: Injector,
    private readonly taxVoucherTypesService: TaxVoucherTypesService,
    private readonly taxVoucherService: TaxVoucherService,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.syncModelFromInput();
    this.loadTaxVoucherTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["taxVoucherUpdate"] || changes["id"]) {
      this.syncModelFromInput();
    }
  }

  ngAfterViewInit(): void {}

  private syncModelFromInput(): void {
    const source = this.taxVoucherUpdate;

    if (!source) {
      this.model.set(this.createEmptyDto());
      return;
    }

    this.model.set({
      ...source,
      id: source.id ?? this.id,
      taxVoucherTypeId:
        source.taxVoucherTypeId !== null &&
        source.taxVoucherTypeId !== undefined
          ? Number(source.taxVoucherTypeId)
          : null,
      expeditionDate: this.toDate(source.expeditionDate),
      expirationDate: this.toDate(source.expirationDate)
    } as TaxVoucherUpdateDto);
  }

  private createEmptyDto(): TaxVoucherUpdateDto {
    return {
      id: this.id,
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

  private loadTaxVoucherTypes(): void {
    const input = {} as TaxVoucherTypesInputDto;
    input.skipCount = 0;
    input.maxResultCount = 1000;
    input.sorting = "";

    this.loading.set(true);

    this.taxVoucherTypesService
      .getAll(input)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (result: any) => {
          const items = result?.items ?? result ?? [];

          this.taxVoucherTypeOptions.set(
            items.map((item: any) => ({
              id: Number(item.id),
              codeAndDescription:
                item.codeAndDescription ??
                item.description ??
                item.name ??
                `${item.code ?? ""} ${item.description ?? ""}`.trim()
            }))
          );
        },
        error: (error) => {
          this.taxVoucherTypeOptions.set([]);

          const message =
            error?.error?.error?.message ||
            error?.error?.message ||
            "No se pudieron cargar los tipos de comprobantes.";

          abp.message.error(message);
        }
      });
  }

  updateField<K extends keyof TaxVoucherUpdateDto>(field: K, value: TaxVoucherUpdateDto[K]): void {
    const current = this.model();

    this.model.set({
      ...current,
      [field]: value
    } as TaxVoucherUpdateDto);
  }

  updateNumberField(field: keyof TaxVoucherUpdateDto, value: number | string | null): void {
    const parsedValue =
      value === null || value === undefined || value === ""
        ? null
        : Number(value);

    this.updateField(field, parsedValue as never);
  }

  updateTextField(field: keyof TaxVoucherUpdateDto, value: string | null): void {
    this.updateField(field, ((value ?? "").trim()) as never);
  }

  updateDateField(field: keyof TaxVoucherUpdateDto, value: Date | string | null): void {
    const parsedDate =
      value instanceof Date
        ? value
        : value
          ? this.toDate(value)
          : null;

    this.updateField(field, parsedDate as never);
  }

  onTaxVoucherTypeChange(value: number | string | null): void {
    this.updateNumberField("taxVoucherTypeId", value);
  }

  save(): void {
    if (this.saving()) {
      return;
    }

    const current = this.model();

    if (!current) {
      abp.message.error("No hay datos para actualizar.");
      return;
    }

    if (!this.validateForm(current)) {
      return;
    }

    this.saving.set(true);

    const payload: TaxVoucherUpdateDto = {
      ...current,
      id: this.id,
      taxVoucherTypeId:
        current.taxVoucherTypeId !== null &&
        current.taxVoucherTypeId !== undefined
          ? Number(current.taxVoucherTypeId)
          : null
    } as TaxVoucherUpdateDto;

    console.log("TaxVoucher update payload:", payload);

    this.taxVoucherService
      .update(payload)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.notify.info(this.l("SavedSuccessfully"));
          this.onSave.emit();
          this.bsModalRef.hide();
        },
        error: (error) => {
          const message =
            error?.error?.error?.message ||
            error?.error?.message ||
            "Error inesperado";

          abp.message.error(message);
        }
      });
  }

  private validateForm(model: TaxVoucherUpdateDto): boolean {

    if (
      model.taxVoucherTypeId === null ||
      model.taxVoucherTypeId === undefined
    ) {
      abp.message.warn("Debe seleccionar un tipo de comprobante.");
      return false;
    }

    return true;
  }
}