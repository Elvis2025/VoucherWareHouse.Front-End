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
import { TaxVoucherCreateDto, TaxVoucherUpdateDto } from "../../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher/tax-voucher.model.service";
import { BsModalRef } from "ngx-bootstrap/modal";





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
    IbsCheckBoxComponent
  ],
  templateUrl: './tax-voucher-update.component.html',
  styleUrls: ['./tax-voucher-update.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxVoucherUpdateComponent extends AppComponentBase implements OnInit,AfterViewInit{

    @Output() onSave = new EventEmitter<void>();
        @Input({required: true}) id!: number;
    saving = false;
    ecfApiAuth: TaxVoucherUpdateDto;
    keyword = '';
    isActive = true;

    constructor(
        injector: Injector,
       // private taxVoucherService: TaxVoucherCreateDto,
        public bsModalRef: BsModalRef,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
        this.ecfApiAuth = this.createEmptyDto();
    }


    ngAfterViewInit(): void {
        //throw new Error("Method not implemented.");
    }
    ngOnInit(): void {
       // throw new Error("Method not implemented.");
    }

        private createEmptyDto(): TaxVoucherUpdateDto {
        return {
          description: '',
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
}