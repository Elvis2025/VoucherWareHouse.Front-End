import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,Injector, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { After } from "v8";
import { IbsModalHeaderComponent } from "../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component";
import { IbsModalTopBarComponent } from "../../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component";
import { IbsModalBodyComponent } from "../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component";
import { IbsModalFooterComponent } from "../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component";
import { IbsModalShellComponent } from "../../../../controls/ibs-modal/ibs-modal-shell.component";
import { EcfApiAuthenticationCreateDto, EcfApiAuthenticationUpdateDto } from "@shared/service-proxies/services/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.model.service";
import { EcfApiAuthenticationService } from "@shared/service-proxies/services/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { AppComponentBase } from "@shared/app-component-base";
import { IbsCheckBoxComponent } from "@app/controls/ibs-check-box/ibs-check-box.component";
import { IbsInputComponent } from "@app/controls/ibs-input/ibs-input.component";
import { SharedModule } from "../../../../../shared/shared.module";

@Component({
  selector: 'app-ecf-api-authentication-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IbsModalHeaderComponent,
    IbsModalBodyComponent,
    IbsModalFooterComponent,
    IbsModalShellComponent,
    IbsInputComponent,
    IbsCheckBoxComponent,
    SharedModule
],
  templateUrl: './ecf-api-authentication-update-dialog.component.html',
  styleUrls: ['./ecf-api-authentication-update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcfApiAuthenticationUpdateDialogComponent extends AppComponentBase implements OnInit,AfterViewInit{
 @Output() onSave = new EventEmitter<void>();
    @Input({required: true}) id!: number;
     saving = false;
     ecfApiAuth: EcfApiAuthenticationUpdateDto = this.createEmptyDto();
      isActive = true;

  constructor(
    injector: Injector,
    private ecfApiAuthenticationService: EcfApiAuthenticationService,
    public bsModalRef: BsModalRef,
    private cd: ChangeDetectorRef
  ) {
    super(injector);
  }

    ngAfterViewInit(): void {
        this.resetForm();//throw new Error("Method not implemented.");
    }
    ngOnInit(): void {
        //throw new Error("Method not implemented.");
    }
  
  private resetForm(): void {

    this.saving = true;
    this.ecfApiAuthenticationService.getFirstOrDefault().subscribe((ecfUser) => {
      if(!ecfUser) return;
      console.log('que es lo que pasa' +this.ecfApiAuth)
      this.ecfApiAuth.id = ecfUser.id;
      this.ecfApiAuth.authUrl = ecfUser.authUrl;
      this.ecfApiAuth.baseUrl = ecfUser.baseUrl;
      this.ecfApiAuth.password = ecfUser.password;
      this.ecfApiAuth.tenancyName = ecfUser.tenancyName;
      this.ecfApiAuth.usernameOrEmailAddress = ecfUser.usernameOrEmailAddress;
      this.ecfApiAuth.isActive = ecfUser.isActive;
      this.saving = false;

      this.cd.markForCheck();
    });
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

  public save(): void {
     if (this.saving) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.cd.markForCheck();

    this.ecfApiAuthenticationService.update(this.ecfApiAuth).subscribe({
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