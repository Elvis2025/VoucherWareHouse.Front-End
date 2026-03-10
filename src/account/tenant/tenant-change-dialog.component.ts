import { ChangeDetectorRef, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponentBase } from '@shared/app-component-base';
import {
  AccountServiceProxy,
  IsTenantAvailableInput,
  IsTenantAvailableOutput
} from '@shared/service-proxies/service-proxies';
import { AppTenantAvailabilityState } from '@shared/AppEnums';
import { AppTenantBrandingService } from '@shared/TenantBranding/app-tenant-branding.service';

@Component({
  selector: 'app-tenant-change-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-change-dialog.component.html',
  styleUrls: ['./tenant-change-dialog.component.scss'],
})
export class TenantChangeDialogComponent extends AppComponentBase {
  @Input() tenancyName = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = false;
  logoUrl$ = this._appTenantBrandingService.logoUrl$;
  constructor(
    injector: Injector,
    private _accountService: AccountServiceProxy,
    private _cdr: ChangeDetectorRef,
    private _appTenantBrandingService: AppTenantBrandingService
  ) {
    super(injector);
  }

  private normalizeTenantName(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  private releaseUi(): void {
    this.saving = false;
    this._cdr.detectChanges();

    setTimeout(() => {
      this.saving = false;
      this._cdr.detectChanges();
    }, 0);
  }

  close(): void {
    if (this.saving) {
      return;
    }

    this.cancelled.emit();
  }

  save(): void {
    const normalizedTenancyName = this.normalizeTenantName(this.tenancyName);

    if (!normalizedTenancyName) {
      abp.multiTenancy.setTenantIdCookie(undefined);
      localStorage.removeItem('ibs_tenancy_name');
      this.saved.emit();
      location.reload();
      return;
    }

    const input = new IsTenantAvailableInput();
    input.tenancyName = normalizedTenancyName;

    if (this.saving) {
      return;
    }

    this.saving = true;
    this._cdr.detectChanges();

    this._accountService.isTenantAvailable(input).subscribe(
      (result: IsTenantAvailableOutput) => {
        switch (result.state) {
          case AppTenantAvailabilityState.Available:
            abp.multiTenancy.setTenantIdCookie(result.tenantId);
            localStorage.setItem('ibs_tenancy_name', normalizedTenancyName);
            this.saved.emit();
            location.reload();
            return;

          case AppTenantAvailabilityState.InActive:
            this.releaseUi();
            this.message.warn(this.l('TenantIsNotActive', normalizedTenancyName));
            return;

          case AppTenantAvailabilityState.NotFound:
            this.releaseUi();
            this.message.warn(this.l('ThereIsNoTenantDefinedWithName{0}', normalizedTenancyName));
            return;

          default:
            this.releaseUi();
            return;
        }
      },
      () => {
        this.releaseUi();
      }
    );
  }

  onBackdropMouseDown(): void {
    this.close();
  }
}