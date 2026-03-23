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
import { TaxVoucherTypesCreateDto, TaxVoucherTypesUpdateDto } from "../../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.model.service";
import { TaxVoucherTypesService } from "../../../../../shared/service-proxies/services/voucher-warehouse/tax-voucher-types/tax-voucher-types.service";
import { BsModalRef } from "ngx-bootstrap/modal";




@Component({
  selector: 'app-tax-voucher-types-update-dialog',
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
  templateUrl: './tax-voucher-types-update.component.html',
  styleUrls: ['./tax-voucher-types-update.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxVoucherTypesUpdateComponent extends AppComponentBase implements OnInit,AfterViewInit{
    @Output() onSave = new EventEmitter<void>();
@Input({required: true}) id!: number;
  saving = false;
  taxVoucherUpdate: TaxVoucherTypesUpdateDto;
  keyword = '';
  isActive = true;

  constructor(
    injector: Injector,
    private taxVoucherTypesService: TaxVoucherTypesService,
    public bsModalRef: BsModalRef,
    private cd: ChangeDetectorRef
  ) {
    super(injector);
    this.taxVoucherUpdate = this.createEmptyDto();
  }

  ngOnInit(): void {
    this.resetForm();
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  private createEmptyDto(): TaxVoucherTypesUpdateDto {
    return {
      code: '',
      description: '',
      taxVoucherLenght: 0,
      format: '',
      isActive: true
    } as TaxVoucherTypesUpdateDto;
  }

  private resetForm(): void {
   this.saving = true;
    this.taxVoucherTypesService.get(this.id).subscribe((taxVoucherType) => {
        console.log(taxVoucherType)
      if(!taxVoucherType) return;
      this.taxVoucherUpdate.id = taxVoucherType.id;
      this.taxVoucherUpdate.code = taxVoucherType.code;
      this.taxVoucherUpdate.description = taxVoucherType.description;
      this.taxVoucherUpdate.format = taxVoucherType.format;
      this.taxVoucherUpdate.taxVoucherLenght = taxVoucherType.taxVoucherLenght;
      this.taxVoucherUpdate.isActive = taxVoucherType.isActive;
      this.saving = false;

      this.cd.markForCheck();
    });
  }

  save(): void {
    if (this.saving) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.cd.markForCheck();

    this.taxVoucherTypesService.update(this.taxVoucherUpdate).subscribe({
      next: () => {
        this.notify.info(this.l('SavedSuccessfully'));
        this.onSave.emit();
        this.resetForm();
        this.bsModalRef.hide();
      },
      error: (error) => {
        console.log('create ecfAuth error', error);

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
    if (!this.isNotEmpty(this.taxVoucherUpdate.code)) {
      this.message.warn('El codigo del comprobante es requerido');
      return false;
    }

    if (!this.isNotEmpty(this.taxVoucherUpdate.description)) {
      this.message.warn('La descripcion del comprobante es requerido');
      return false;
    }

    if (!this.isNotEmpty(this.taxVoucherUpdate.format)) {
      this.message.warn('El formato del comprobante es requerido');
      return false;
    }

    if (this.taxVoucherUpdate.taxVoucherLenght <= 0) {
      this.message.warn('Debes digitar una longitud mayor a 0, para el tipo de comprobante');
      return false;
    }

    return true;
  }

}