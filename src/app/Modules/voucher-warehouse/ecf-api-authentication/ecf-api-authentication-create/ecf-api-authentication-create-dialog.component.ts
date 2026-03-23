import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Injector,
  OnInit,
  Output
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IbsModalHeaderComponent } from "../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component";
import { IbsModalTopBarComponent } from "../../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component";
import { IbsModalBodyComponent } from "../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component";
import { IbsModalFooterComponent } from "../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component";
import { IbsModalShellComponent } from "../../../../controls/ibs-modal/ibs-modal-shell.component";
import { AppComponentBase } from "@shared/app-component-base";
import { BsModalRef } from "ngx-bootstrap/modal";
import { EcfApiAuthenticationCreateDto } from "@shared/service-proxies/services/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.model.service";
import { EcfApiAuthenticationService } from "@shared/service-proxies/services/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.service";
import { LocalizePipe } from "@shared/pipes/localize.pipe";
import { IbsInputComponent } from "@app/controls/ibs-input/ibs-input.component";
import { IbsCheckBoxComponent } from "@app/controls/ibs-check-box/ibs-check-box.component";

@Component({
  selector: 'app-ecf-api-authentication-create-dialog',
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
  templateUrl: './ecf-api-authentication-create-dialog.component.html',
  styleUrls: ['./ecf-api-authentication-create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcfApiAuthenticationCreateDialogComponent
  extends AppComponentBase
  implements OnInit, AfterViewInit {

  @Output() onSave = new EventEmitter<void>();

  saving = false;
  ecfApiAuth: EcfApiAuthenticationCreateDto;
  keyword = '';
  isActive = true;

  constructor(
    injector: Injector,
    private ecfApiAuthenticationService: EcfApiAuthenticationService,
    public bsModalRef: BsModalRef,
    private cd: ChangeDetectorRef
  ) {
    super(injector);
    this.ecfApiAuth = this.createEmptyDto();
  }

  ngOnInit(): void {
    this.resetForm();
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  private createEmptyDto(): EcfApiAuthenticationCreateDto {
    return {
      authUrl: '',
      baseUrl: '',
      tenancyName: '',
      usernameOrEmailAddress: '',
      password: '',
      isActive: true
    } as EcfApiAuthenticationCreateDto;
  }

  private resetForm(): void {
    this.ecfApiAuth = this.createEmptyDto();
    this.saving = false;
    this.cd.markForCheck();
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
    console.log()
    this.ecfApiAuthenticationService.create(this.ecfApiAuth).subscribe({
      
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
    if (!this.isNotEmpty(this.ecfApiAuth.authUrl)) {
      this.message.warn('authUrl is required');
      return false;
    }

    if (!this.isNotEmpty(this.ecfApiAuth.baseUrl)) {
      this.message.warn('baseUrl is required');
      return false;
    }

    if (!this.isNotEmpty(this.ecfApiAuth.tenancyName)) {
      this.message.warn('tenancyName is required');
      return false;
    }

    if (!this.isNotEmpty(this.ecfApiAuth.usernameOrEmailAddress)) {
      this.message.warn('usernameOrEmailAddress is required');
      return false;
    }

    return true;
  }
}