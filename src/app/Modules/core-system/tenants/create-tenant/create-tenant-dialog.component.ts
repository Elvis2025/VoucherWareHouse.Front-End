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
import { finalize } from 'rxjs/operators';

import { AppComponentBase } from '@shared/app-component-base';
import {
  CreateTenantDto,
  FileParameter,
  TenantServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { LocalizePipe } from '@shared/pipes/localize.pipe';


import { IbsModalTabComponent } from '@app/controls/ibs-modal/ibs-modal-tab/ibs-modal-tab.component';
import { IbsModalTabsComponent } from '@app/controls/ibs-modal/ibs-modal-tab/ibs-modal-tabs.component';
import { AppTenantBrandingService } from '@shared/TenantBranding/app-tenant-branding.service';
import { UploadTenantLogoInputDto } from '@shared/TenantBranding/app-tenant-branding.model.service';
import { IbsInputComponent } from '@app/controls/ibs-input/ibs-input.component';
import { IbsCheckBoxComponent } from '@app/controls/ibs-check-box/ibs-check-box.component';
import { IbsModalShellComponent } from '@app/controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '@app/controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '@app/controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '@app/controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';

interface CreateTenantFormState {
  tenancyName: string;
  name: string;
  connectionString: string;
  adminEmailAddress: string;
  isActive: boolean;
}

@Component({
  templateUrl: './create-tenant-dialog.component.html',
  styleUrls: ['./create-tenant-dialog.component.scss'],
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
export class CreateTenantDialogComponent
  extends AppComponentBase
  implements OnInit, OnDestroy
{
  @Output() onSave = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly isDraggingLogo = signal(false);

  readonly formState = signal<CreateTenantFormState>({
    tenancyName: '',
    name: '',
    connectionString: '',
    adminEmailAddress: '',
    isActive: true,
  });

  readonly selectedLogoFile = signal<File | null>(null);
  readonly selectedLogoFileName = signal<string>('');
  readonly logoPreviewUrl = signal<string | null>(null);

  readonly brandingCompanyName = signal<string>('');
  readonly brandingCompanyDescription = signal<string>('');
  readonly brandingCompanyType = signal<string>('SRL');

  readonly canSubmit = computed(() => {
    const form = this.formState();

    return (
      form.tenancyName.trim().length >= 2 &&
      form.name.trim().length > 0 &&
      this.isValidEmail(form.adminEmailAddress) &&
      this.brandingCompanyName().trim().length > 0 &&
    this.brandingCompanyDescription().trim().length > 0 &&
    this.brandingCompanyType().trim().length > 0
    );
  });

  constructor(
    injector: Injector,
    private readonly tenantService: TenantServiceProxy,
    private readonly appTenantBrandingService: AppTenantBrandingService,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  close(): void {
    this.bsModalRef.hide();
  }

  clearSelectedLogo(): void {
    this.revokePreviewUrl();
    this.isDraggingLogo.set(false);
    this.selectedLogoFile.set(null);
    this.selectedLogoFileName.set('');
    this.logoPreviewUrl.set(null);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.processLogoFile(input.files[0]);
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

  updateConnectionString(value: string): void {
    this.formState.update((state) => ({
      ...state,
      connectionString: value ?? '',
    }));
  }

  updateAdminEmailAddress(value: string): void {
    this.formState.update((state) => ({
      ...state,
      adminEmailAddress: value ?? '',
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
    const selectedLogo = this.selectedLogoFile();

    this.tenantService.create(payload).subscribe({
      next: (result) => {
        if (!selectedLogo) {
          this.handleSuccessWithoutLogo();
          return;
        }

        const tenantId = this.extractCreatedTenantId(result);

        if (!tenantId) {
          this.saving.set(false);
          this.notify.warn(
            'El tenant fue creado, pero el método create no devolvió el tenantId. Debes hacer que el backend retorne el Id del tenant creado para poder subir el logo automáticamente.'
          );
          this.close();
          this.onSave.emit();
          return;
        }

        this.uploadLogoForTenant(tenantId, selectedLogo);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private handleSuccessWithoutLogo(): void {
    this.saving.set(false);
    this.notify.info(this.l('SavedSuccessfully'));
    this.close();
    this.onSave.emit();
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
    input.companyType = this.brandingCompanyType().trim() || 'SRL';
    input.file = fileParameter;

    this.appTenantBrandingService
      .uploadLogo(input)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.notify.info(this.l('SavedSuccessfully'));
          this.close();
          this.onSave.emit();
        },
        error: () => {
          this.notify.warn(
            'El tenant fue creado correctamente, pero ocurrió un problema al subir el logo.'
          );
          this.close();
          this.onSave.emit();
        },
      });
  }

  private initializeForm(): void {
    this.formState.set({
      tenancyName: '',
      name: '',
      connectionString: '',
      adminEmailAddress: '',
      isActive: true,
    });

    this.brandingCompanyName.set('');
    this.brandingCompanyDescription.set('');
    this.brandingCompanyType.set('SRL');
    this.clearSelectedLogo();
  }

  private buildPayload(): CreateTenantDto {
    const form = this.formState();
    const dto = new CreateTenantDto();

    dto.tenancyName = form.tenancyName.trim();
    dto.name = form.name.trim();
    dto.connectionString = form.connectionString?.trim() ?? '';
    dto.adminEmailAddress = form.adminEmailAddress.trim();
    dto.isActive = form.isActive;

    return dto;
  }

  private isValidEmail(value: string | null | undefined): boolean {
    const email = (value ?? '').trim();

    if (!email) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  private processLogoFile(file: File): void {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.message.warn(
        'Solo se permiten imágenes PNG, JPG, JPEG, WEBP o SVG.'
      );
      return;
    }

    if (file.size > maxSize) {
      this.message.warn('El logo no puede exceder 2 MB.');
      return;
    }

    this.revokePreviewUrl();

    this.selectedLogoFile.set(file);
    this.selectedLogoFileName.set(file.name);
    this.logoPreviewUrl.set(URL.createObjectURL(file));
  }

  private revokePreviewUrl(): void {
    const previousPreview = this.logoPreviewUrl();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }
  }

  private extractCreatedTenantId(result: unknown): number | null {
    if (typeof result === 'number' && result > 0) {
      return result;
    }

    if (result && typeof result === 'object') {
      const candidate = result as Record<string, unknown>;
      const possibleKeys = ['id', 'tenantId', 'result', 'value'];

      for (const key of possibleKeys) {
        const value = candidate[key];

        if (typeof value === 'number' && value > 0) {
          return value;
        }
      }
    }

    return null;
  }
}