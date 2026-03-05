import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponentBase } from '@shared/app-component-base';
import { AccountServiceProxy, IsTenantAvailableInput, IsTenantAvailableOutput } from '@shared/service-proxies/service-proxies';
import { AppTenantAvailabilityState } from '@shared/AppEnums';

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

  constructor(injector: Injector, private _accountService: AccountServiceProxy) {
    super(injector);
  }

  close(): void {
    this.cancelled.emit();
  }

  // ✅ MISMA lógica tuya (solo cambié el "cerrar modal" a emits)
  save(): void {
     
    if (!this.tenancyName) {
      abp.multiTenancy.setTenantIdCookie(undefined);
      this.saved.emit();
      location.reload();
      return;
    }

    const input = new IsTenantAvailableInput();
    input.tenancyName = this.tenancyName;

   if (this.saving) return;
     this.saving = true;

    this._accountService.isTenantAvailable(input).subscribe(
      (result: IsTenantAvailableOutput) => {
        switch (result.state) {
          case AppTenantAvailabilityState.Available:
            abp.multiTenancy.setTenantIdCookie(result.tenantId);
            this.saved.emit();
            location.reload();
            return;

          case AppTenantAvailabilityState.InActive:
            this.saving = false;
            this.message.warn(this.l('TenantIsNotActive', this.tenancyName));
            break;

          case AppTenantAvailabilityState.NotFound:
            this.saving = false;
            this.message.warn(this.l('ThereIsNoTenantDefinedWithName{0}', this.tenancyName));
            break;
        }

        this.saving = false;
      },
      () => (this.saving = false)
    );
  }

  // ✅ click fuera cierra
  onBackdropMouseDown(): void {
    this.close();
  }
}