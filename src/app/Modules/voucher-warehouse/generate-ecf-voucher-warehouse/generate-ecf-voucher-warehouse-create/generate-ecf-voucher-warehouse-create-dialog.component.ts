import { EcfVoucherWarehouseCreateDto } from './../../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.model.service';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { IbsCheckBoxComponent } from "../../../../controls/ibs-check-box/ibs-check-box.component";
import { IbsInputComponent } from "../../../../controls/ibs-input/ibs-input.component";
import { IbsModalShellComponent } from "../../../../controls/ibs-modal/ibs-modal-shell.component";
import { IbsModalFooterComponent } from "../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component";
import { IbsModalBodyComponent } from "../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component";
import { IbsModalHeaderComponent } from "../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component";
import { FormsModule } from "@angular/forms";
import { LocalizePipe } from "../../../../../shared/pipes/localize.pipe";
import { CommonModule } from "@angular/common";
import { AppComponentBase } from "../../../../../shared/app-component-base";
import { EcfVoucherOutputDto, EcfVoucherWarehouseOutputDto } from "../../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.model.service";
import { EcfVoucherWarehouseService } from "../../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.service";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'app-generate-ecf-voucher-warehouse-create-dialog',
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
  templateUrl: './generate-ecf-voucher-warehouse-create-dialog.component.html',
  styleUrls: ['./generate-ecf-voucher-warehouse-create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateEcfVoucherWarehouseCreateDialog extends AppComponentBase implements OnInit, AfterViewInit{
   
   @Output() onSave = new EventEmitter<void>();

  saving = false;
  ecfVoucherWarehouse: EcfVoucherWarehouseCreateDto;
  keyword = '';
  isActive = true;
    
    



    constructor(
        injector: Injector,
        private ecfApiAuthenticationService: EcfVoucherWarehouseService,
        public bsModalRef: BsModalRef,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
        this.ecfVoucherWarehouse = this.createEmptyDto();
    }

    ngAfterViewInit(): void {
        //throw new Error("Method not implemented.");
    }
    ngOnInit(): void {
        ///throw new Error("Method not implemented.");
    }

      private createEmptyDto(): EcfVoucherWarehouseCreateDto {
        return {
        } as EcfVoucherWarehouseCreateDto;
      }

}