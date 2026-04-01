import { IbsTextareaComponent } from './../../../../controls/ibs-textarea/ibs-textarea.component';
import { IbsSelectComponent } from './../../../../controls/ibs-select/ibs-select.component';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
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
import { TaxVoucherCreateDto, TaxVoucherInputDto } from "../../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.model.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { TaxVoucherService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.service";
import { TaxVoucherTypesService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service";
import { finalize, map, Observable, tap } from "rxjs";
import { IbsGridQuery } from "@app/controls/ibs-grid/ibs-grid.component";
import { TaxVoucherTypesInputDto } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service";
import { BsDatepickerConfig, BsDatepickerDirective, BsDatepickerModule } from 'ngx-bootstrap/datepicker';





@Component({
  selector: 'app-tax-voucher-create-dialog',
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
    IbsSelectComponent,
    IbsTextareaComponent,
    BsDatepickerModule
  ],
  templateUrl: './tax-voucher-create.component.html',
  styleUrls: ['./tax-voucher-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxVoucherCreateComponent extends AppComponentBase implements OnInit,AfterViewInit{

    @Output() onSave = new EventEmitter<void>();

    saving = false;
    taxVoucherCreate: TaxVoucherCreateDto;
    keyword = '';
    isActive = true;
datePickerConfig: Partial<BsDatepickerConfig> = {
  isAnimated: false,
  adaptivePosition: true,
  dateInputFormat: 'DD-MM-YYYY',
  showWeekNumbers: false
};

openDatepicker(dp: BsDatepickerDirective, event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();

  setTimeout(() => {
    dp.show();
  }, 0);
}
    constructor(
        injector: Injector,
        private taxVoucherService: TaxVoucherService,
        private taxVoucherTypesService: TaxVoucherTypesService,
        public bsModalRef: BsModalRef,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
        this.taxVoucherCreate = this.createEmptyDto();
    }

    readonly loadTaxVouchersTypes =
    (
        q: IbsGridQuery
    ): Observable<{ items: { codeAndDescription: string; id: number }[] }> => {

        const input = {} as unknown as TaxVoucherTypesInputDto;

        input.skipCount = q.skipCount ?? 0;
        input.maxResultCount = q.maxResultCount ?? 0;
        input.sorting = q.sorting ?? '';
        // input.filterText = this.keyword ?? '';

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

    taxVoucherTypeOptions: { id: number; codeAndDescription: string }[] = [];
    taxVoucherTypeId: number;
    loadTypes(): void {
        this.loadTaxVouchersTypes({
            skipCount: null,
            maxResultCount: null,
            sorting: ''
        } as IbsGridQuery).subscribe({
            next: res => {
            this.taxVoucherTypeOptions = res.items;
            this.cd.detectChanges();
            }
        });
    }

    ngAfterViewInit(): void {
      this.cd.detectChanges();
    }
    ngOnInit(): void {
       this.resetForm();
       this.loadTypes();
    }

    private resetForm(): void {
        this.createEmptyDto();
    }
    private createEmptyDto(): TaxVoucherCreateDto {
        return {
          comment: '',
          prefix: '',
          initialSequence: 0,
          currentSequence: null,
          finalSequence: 0,
          registeredQuantity: null,
          remainingQuantity: 0,
          minimumToAlert: null,
          expeditionDate: null,
          expirationDate: null,
          taxVoucherTypeId: null,
          isActive: true
        } as TaxVoucherCreateDto;
      }
    
    save(): void{
        if (this.saving) {
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        this.saving = true;
        this.cd.markForCheck();
        console.log(this.taxVoucherCreate)
        this.taxVoucherService.create(this.taxVoucherCreate).subscribe({
            next: () => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.onSave.emit();
                this.resetForm();
                this.bsModalRef.hide();
            },
            error: (error) => {
                const message =
                error?.error?.error?.message ||
                error?.error?.message ||
                'Error inesperado';

                abp.message.error(message);
                this.saving = false;
                this.cd.markForCheck();
            },
            complete: () => {
                this.saving = false;
                this.cd.markForCheck();
            }
        });
    }

    private validateForm(): boolean {
    

    return true;
  }
}