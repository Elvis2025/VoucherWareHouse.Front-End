import { Component, Injector, signal } from '@angular/core';
import { AbpSessionService } from 'abp-ng2-module';
import { AppComponentBase } from '@shared/app-component-base';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppAuthService } from '@shared/auth/app-auth.service';
import { FormsModule } from '@angular/forms';
import { AbpValidationSummaryComponent } from '../../shared/components/validation/abp-validation.summary.component';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '@shared/pipes/localize.pipe';
import { CommonModule } from '@node_modules/@angular/common';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { TenantChangeDialogComponent } from 'account/tenant/tenant-change-dialog.component';

@Component({
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    animations: [accountModuleAnimation()],
    standalone: true,
    imports: [FormsModule,TenantChangeDialogComponent, AbpValidationSummaryComponent, RouterLink, LocalizePipe,CommonModule],
})
export class LoginComponent extends AppComponentBase {
    submitting = false;
      bsModalRef?: BsModalRef;

    showPassword = false;
year = new Date().getFullYear();
currentTenantText = 'Host (sin tenant)';




togglePassword(): void {
    this.showPassword = !this.showPassword;
}
    constructor(
        injector: Injector,
        public authService: AppAuthService,
         private _modalService: BsModalService,
        private _sessionService: AbpSessionService
    ) {
        super(injector);
    }



    

    get multiTenancySideIsTeanant(): boolean {
        return this._sessionService.tenantId > 0;
    }

    get isSelfRegistrationAllowed(): boolean {
        if (!this._sessionService.tenantId) {
            return false;
        }

        return true;
    }

    login(): void {
        this.submitting = true;
        this.authService.authenticate(() => (this.submitting = false));
    }

    openTenantSelector(): void {
    this.bsModalRef = this._modalService.show(TenantChangeDialogComponent, {
      class: 'modal-dialog-centered modal-md',
      backdrop: true,
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      // CLAVE: fuerza a que se monte en BODY
    });
  }


  readonly tenantOpen = signal(false);
readonly tenantName = signal<string>('');

openTenantModal(): void {
  this.tenantOpen.set(true);
}

onTenantCancel(): void {
  this.tenantOpen.set(false);
}

onTenantSaved(): void {
  this.tenantOpen.set(false);
}
}
