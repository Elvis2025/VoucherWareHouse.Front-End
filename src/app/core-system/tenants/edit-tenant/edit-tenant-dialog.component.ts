import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  OnDestroy,
  OnInit,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AbpSessionService } from 'abp-ng2-module';
import { finalize } from 'rxjs';

import { AppComponentBase } from '@shared/app-component-base';
import { UploadTenantLogoInputDto } from '../../../../shared/TenantBranding/app-tenant-branding.model.service';

import {
  FileParameter,
  TenantBrandingDto,
  TenantDto,
  TenantServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { IbsInputComponent } from '../../../controls/ibs-input/ibs-input.component';
import { IbsCheckBoxComponent } from '../../../controls/ibs-check-box/ibs-check-box.component';
import { IbsModalShellComponent } from '../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTabComponent } from '@app/controls/ibs-modal/ibs-modal-tab/ibs-modal-tab.component';
import { IbsModalTabsComponent } from '@app/controls/ibs-modal/ibs-modal-tab/ibs-modal-tabs.component';
import { AppTenantBrandingService } from '@shared/TenantBranding/app-tenant-branding.service';

interface EditTenantFormState {
  id?: number;
  tenancyName: string;
  name: string;
  isActive: boolean;
}

@Component({
  templateUrl: './edit-tenant-dialog.component.html',
  styleUrls: ['./edit-tenant-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LocalizePipe,
    IbsInputComponent,
    IbsCheckBoxComponent,
    IbsModalShellComponent,
    IbsModalHeaderComponent,
    IbsModalBodyComponent,
    IbsModalFooterComponent,
    IbsModalTabComponent,
    IbsModalTabsComponent,
  ],
})
export class EditTenantDialogComponent
  extends AppComponentBase
  implements OnInit, OnDestroy
{
  @Output() onSave = new EventEmitter<void>();

  id!: number;

  readonly saving = signal(false);
  readonly isDraggingLogo = signal(false);
  readonly selectedLogoFile = signal<File | null>(null);
  readonly selectedLogoFileName = signal<string>('');
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly currentLogoUrl = signal<string | null>(null);
  readonly removeCurrentLogoFlag = signal(false);

  readonly currentBranding = signal<TenantBrandingDto | null>(null);

  readonly brandingCompanyName = signal<string>('');
  readonly brandingCompanyDescription = signal<string>('');
  readonly brandingCompanyType = signal<string>('Software');

  readonly formState = signal<EditTenantFormState>({
    id: undefined,
    tenancyName: '',
    name: '',
    isActive: true,
  });

  readonly canSubmit = computed(() => {
    const form = this.formState();

    return (
      form.tenancyName.trim().length >= 2 &&
      form.name.trim().length > 0 &&
      this.brandingCompanyName().trim().length > 0 &&
      this.brandingCompanyDescription().trim().length > 0 &&
      this.brandingCompanyType().trim().length > 0
    );
  });

  constructor(
    injector: Injector,
    private readonly tenantService: TenantServiceProxy,
    private readonly tenantBrandingService: AppTenantBrandingService,
    private readonly sessionService: AbpSessionService,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadTenant();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  close(): void {
    this.bsModalRef.hide();
  }

  updateTenancyName(value: string): void {
    this.formState.update((state) => ({
      ...state,
      tenancyName: value ?? '',
    }));
  }

  updateName(value: string): void {
    this.formState.update((state) => ({
      ...state,
      name: value ?? '',
    }));
  }

  updateIsActive(value: boolean): void {
    this.formState.update((state) => ({
      ...state,
      isActive: !!value,
    }));
  }

  updateBrandingCompanyName(value: string): void {
    this.brandingCompanyName.set(value ?? '');
  }

  updateBrandingCompanyDescription(value: string): void {
    this.brandingCompanyDescription.set(value ?? '');
  }

  updateBrandingCompanyType(value: string): void {
    this.brandingCompanyType.set(value ?? '');
  }

  submit(): void {
    if (this.saving() || !this.canSubmit()) {
      return;
    }

    this.saving.set(true);

    const payload = this.buildPayload();
    const tenantId = payload.id;
    const selectedLogo = this.selectedLogoFile();
    const mustRemoveCurrentLogo = this.removeCurrentLogoFlag();

    this.tenantService.update(payload).subscribe({
      next: () => {
        if (selectedLogo && tenantId) {
          this.uploadLogoForTenant(tenantId, selectedLogo);
          return;
        }

        if (mustRemoveCurrentLogo) {
          if (this.isEditingCurrentSessionTenant()) {
            this.removeCurrentTenantLogoFromApi();
            return;
          }

          this.saving.set(false);
          this.notify.warn(
            'Los datos del tenant fueron actualizados, pero tu API actual solo permite eliminar el logo del tenant actual de la sesión.'
          );
          this.close();
          this.onSave.emit();
          return;
        }

        this.saving.set(false);
        this.notify.info(this.l('SavedSuccessfully'));
        this.close();
        this.onSave.emit();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private loadTenant(): void {
    this.tenantService.get(this.id).subscribe({
      next: (result: TenantDto) => {
        this.formState.set({
          id: result.id,
          tenancyName: result.tenancyName ?? '',
          name: result.name ?? '',
          isActive: !!result.isActive,
        });

        this.loadTenantBrandingLogoByTenantId(result.id);
      },
    });
  }

  private loadTenantBrandingLogoByTenantId(tenantId: number): void {
    this.tenantBrandingService.loadTenantBrandingLogoByTenantId(tenantId).subscribe({
      next: (result) => {
        this.currentBranding.set(result);
        this.currentLogoUrl.set(result?.fullLogoUrl ?? null);
        this.brandingCompanyName.set(
          (result?.companyName ?? '').trim() || this.formState().name.trim()
        );
        this.brandingCompanyDescription.set(
          (result?.companyDescription ?? '').trim()
        );
        this.brandingCompanyType.set(
          (result?.companyType ?? '').trim() || 'Software'
        );
      },
      error: () => {
        this.currentBranding.set(null);
        this.currentLogoUrl.set(null);
        this.brandingCompanyName.set(this.formState().name.trim());
        this.brandingCompanyDescription.set('');
        this.brandingCompanyType.set('Software');
      },
    });
  }

  private buildPayload(): TenantDto {
    const form = this.formState();
    const dto = new TenantDto();

    dto.id = form.id;
    dto.tenancyName = form.tenancyName.trim();
    dto.name = form.name.trim();
    dto.isActive = form.isActive;

    return dto;
  }

  private uploadLogoForTenant(tenantId: number, file: File): void {
    const fileParameter: FileParameter = {
      data: file,
      fileName: file.name,
    };

    const input = new UploadTenantLogoInputDto();
    input.tenantId = tenantId;
    input.companyName =
      this.brandingCompanyName().trim() || this.formState().name.trim();
    input.companyDescription = this.brandingCompanyDescription().trim();
    input.companyType = this.brandingCompanyType().trim() || 'Software';
    input.file = fileParameter;

    this.tenantBrandingService
      .uploadLogo(input)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: (result: TenantBrandingDto) => {
          this.currentBranding.set(result);
          this.currentLogoUrl.set(result?.fullLogoUrl ?? null);
          this.brandingCompanyName.set(
            (result?.companyName ?? '').trim() || this.formState().name.trim()
          );
          this.brandingCompanyDescription.set(
            (result?.companyDescription ?? '').trim()
          );
          this.brandingCompanyType.set(
            (result?.companyType ?? '').trim() || 'Software'
          );
          this.removeCurrentLogoFlag.set(false);

          this.notify.info(this.l('SavedSuccessfully'));
          this.close();
          this.onSave.emit();
        },
        error: () => {
          this.notify.warn(
            'Los datos del tenant fueron actualizados, pero ocurrió un error al subir el logo.'
          );
          this.close();
          this.onSave.emit();
        },
      });
  }

  private removeCurrentTenantLogoFromApi(): void {
    this.tenantBrandingService
      .removeCurrentTenantLogo()
      .pipe(
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.currentBranding.set(null);
          this.currentLogoUrl.set(null);
          this.brandingCompanyName.set(this.formState().name.trim());
          this.brandingCompanyDescription.set('');
          this.brandingCompanyType.set('Software');

          this.notify.info(this.l('SavedSuccessfully'));
          this.close();
          this.onSave.emit();
        },
        error: () => {
          this.notify.warn(
            'Los datos del tenant fueron actualizados, pero ocurrió un error al eliminar el logo.'
          );
          this.close();
          this.onSave.emit();
        },
      });
  }

  private isEditingCurrentSessionTenant(): boolean {
    const currentTenantId = this.sessionService.tenantId;
    return !!currentTenantId && currentTenantId === this.id;
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.saving()) {
      return;
    }

    this.isDraggingLogo.set(true);
  }

  onLogoDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo.set(false);
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDraggingLogo.set(false);

    if (this.saving()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    this.processLogoFile(files[0]);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.processLogoFile(input.files[0]);
  }

  private processLogoFile(file: File): void {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.message.warn('Solo se permiten imágenes PNG, JPG, JPEG, WEBP o SVG.');
      return;
    }

    if (file.size > maxSize) {
      this.message.warn('El logo no puede exceder 2 MB.');
      return;
    }

    this.revokePreviewUrl();

    this.removeCurrentLogoFlag.set(false);
    this.selectedLogoFile.set(file);
    this.selectedLogoFileName.set(file.name);
    this.logoPreviewUrl.set(URL.createObjectURL(file));
  }

  clearSelectedLogo(): void {
    this.revokePreviewUrl();
    this.isDraggingLogo.set(false);
    this.selectedLogoFile.set(null);
    this.selectedLogoFileName.set('');
    this.logoPreviewUrl.set(null);
  }

  removeCurrentLogo(): void {
    this.clearSelectedLogo();
    this.currentLogoUrl.set(null);
    this.currentBranding.set(null);
    this.removeCurrentLogoFlag.set(true);
  }

  private revokePreviewUrl(): void {
    const previousPreview = this.logoPreviewUrl();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }
  }
}