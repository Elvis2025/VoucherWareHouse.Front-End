import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from "@angular/core";
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
import { TaxVoucherCreateDto, TaxVoucherOutputDto, TaxVoucherUpdateDto } from "../../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.model.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { IbsTextareaComponent } from "@app/controls/ibs-textarea/ibs-textarea.component";
import { IbsGridQuery } from "@app/controls/ibs-grid/ibs-grid.component";
import { finalize, map, Observable } from "@node_modules/rxjs";
import { TaxVoucherTypesInputDto } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service";
import { TaxVoucherTypesService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service";
import { IbsSelectComponent } from "@app/controls/ibs-select/ibs-select.component";
import { TaxVoucherService } from "@shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.service";





@Component({
  selector: 'app-tax-voucher-update-dialog',
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
    IbsSelectComponent
  ],
  templateUrl: './tax-voucher-update.component.html',
  styleUrls: ['./tax-voucher-update.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxVoucherUpdateComponent extends AppComponentBase implements OnInit,AfterViewInit{

    @Output() onSave = new EventEmitter<void>();
        @Input({required: true}) id!: number;
        @Input() taxVoucherUpdate!: TaxVoucherUpdateDto;
    saving = false;
    keyword = '';
    isActive = true;
    
    constructor(
        injector: Injector,
       private taxVoucherTypesService: TaxVoucherTypesService,
       private taxVoucherService: TaxVoucherService,
        public bsModalRef: BsModalRef,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
       //  this.taxVoucherUpdate = this.createEmptyDto();
      
    }


    ngAfterViewInit(): void {
            
      this.cd.detectChanges();
    }

    ngOnInit(): void {

     //  this.resetForm();
       
    }
    public init(): void {

       this.resetForm();
       
    }

    

    
        
        private createEmptyDto(): TaxVoucherUpdateDto {
        return {
          comment: '',
          prefix: '',
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


      save(): void{
        if (this.saving) {
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        this.saving = true;
        this.cd.markForCheck();
        console.log(this.taxVoucherUpdate)
        this.taxVoucherService.create(this.taxVoucherUpdate).subscribe({
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
  taxVoucherTypeOptions: { id: number; codeAndDescription: string }[] = [];

      private resetForm(): void {
        
       // this.loadCurrentTaxVoucher();
       
    }
}