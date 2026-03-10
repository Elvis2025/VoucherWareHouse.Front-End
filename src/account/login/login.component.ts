import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AbpSessionService } from 'abp-ng2-module';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { AppComponentBase } from '@shared/app-component-base';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppAuthService } from '@shared/auth/app-auth.service';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { AbpValidationSummaryComponent } from '../../shared/components/validation/abp-validation.summary.component';
import { TenantChangeDialogComponent } from 'account/tenant/tenant-change-dialog.component';
import { AppTenantBrandingService } from '@shared/TenantBranding/app-tenant-branding.service';

@Component({
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    animations: [accountModuleAnimation()],
    standalone: true,
    imports: [
        FormsModule,
        TenantChangeDialogComponent,
        AbpValidationSummaryComponent,
        RouterLink,
        LocalizePipe,
        CommonModule
    ],
})
export class LoginComponent extends AppComponentBase implements OnInit {
    submitting = false;
    bsModalRef?: BsModalRef;

    showPassword = false;
    year = new Date().getFullYear();

    logoUrl$ = this._appTenantBrandingService.logoUrl$;
    companyDescription$ = this._appTenantBrandingService.companyDescription$;
    companyName$ = this._appTenantBrandingService.companyName$;
    companyType$ = this._appTenantBrandingService.companyType$;
    currentTenantText = 'HOST (SIN TENANT)';

    readonly tenantOpen = signal(false);
    readonly tenantName = signal<string>('');

    constructor(
        injector: Injector,
        public authService: AppAuthService,
        private _modalService: BsModalService,
        private _sessionService: AbpSessionService,
        private _appTenantBrandingService: AppTenantBrandingService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.loadCurrentTenantLabel();
        this.loadCurrentTenantLogo();
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    private normalizeTenantName(value: string | null | undefined): string {
        return (value ?? '')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();
    }

    private loadCurrentTenantLabel(): void {
        const savedTenantName = localStorage.getItem('ibs_tenancy_name');
        const normalized = this.normalizeTenantName(savedTenantName);

        if (normalized) {
            this.currentTenantText = normalized;
            this.tenantName.set(normalized);
        } else {
            this.currentTenantText = 'HOST (SIN TENANT)';
            this.tenantName.set('');
        }
    }

    private loadCurrentTenantLogo(): void {
        const savedTenantName = localStorage.getItem('ibs_tenancy_name');
        const normalized = this.normalizeTenantName(savedTenantName);

        if (!normalized) {
            this._appTenantBrandingService.clear();
            return;
        }

        this._appTenantBrandingService.loadCurrentTenantLogo().subscribe({
            next: () => {
                // Estado global actualizado
            },
            error: () => {
                this._appTenantBrandingService.clear();
            }
        });
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

        this.authService.authenticate(() => {
            this.submitting = false;
        });
    }

    openTenantSelector(): void {
        this.bsModalRef = this._modalService.show(TenantChangeDialogComponent, {
            class: 'modal-dialog-centered modal-md',
            backdrop: true,
            ignoreBackdropClick: true,
            keyboard: true,
            animated: true,
        });
    }

    openTenantModal(): void {
        this.tenantOpen.set(true);
    }

    onTenantCancel(): void {
        this.tenantOpen.set(false);
    }

    onTenantSaved(): void {
        this.loadCurrentTenantLabel();
        this.loadCurrentTenantLogo();
        this.tenantOpen.set(false);
    }
}