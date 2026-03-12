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
import { UploadTenantLogoInputDto } from '../../../../../shared/TenantBranding/app-tenant-branding.model.service';

import {
  AddFeaturesToOneTenantInputDto,
  FeatureDto,
  FeatureValueInputDto,
  FeaturesServiceProxy,
  FileParameter,
  TenantBrandingDto,
  TenantDto,
  TenantServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { IbsInputComponent } from '../../../../controls/ibs-input/ibs-input.component';
import { IbsCheckBoxComponent } from '../../../../controls/ibs-check-box/ibs-check-box.component';
import { IbsModalShellComponent } from '../../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTabComponent } from '@app/controls/ibs-modal/ibs-modal-tab/ibs-modal-tab.component';
import { IbsModalTabsComponent } from '@app/controls/ibs-modal/ibs-modal-tab/ibs-modal-tabs.component';
import { AppTenantBrandingService } from '@shared/TenantBranding/app-tenant-branding.service';

interface EditTenantFormState {
  id?: number;
  tenancyName: string;
  name: string;
  isActive: boolean;
}

interface LocalTenantFeature {
  name: string;
  displayName: string;
  description?: string;
  defaultValue?: string;
  currentValue: string;
  enabled: boolean;
}

interface FeatureNode {
  key: string;
  title: string;
  feature: LocalTenantFeature;
  children: LocalTenantFeature[];
  match: boolean;
  open: boolean;
}

interface FeatureModuleVm {
  key: string;
  title: string;
  count: number;
  features: LocalTenantFeature[];
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

  readonly featuresLoading = signal(false);
  readonly featuresError = signal<string | null>(null);
  readonly featureSearch = signal('');
  readonly featureModules = signal<FeatureModuleVm[]>([]);
  readonly selectedFeatureModuleKey = signal<string>('');
  readonly openFeatureKeys = signal<Set<string>>(new Set<string>());
  readonly featureSelectionTick = signal(0);
  readonly allTenantFeatures = signal<LocalTenantFeature[]>([]);

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

  readonly allFeaturesExpanded = computed(() => {
    const tree = this.selectedFeatureTree();
    const expandableKeys = tree
      .filter((n) => (n.children?.length ?? 0) > 0)
      .map((n) => n.key);

    if (expandableKeys.length === 0) {
      return false;
    }

    const open = this.openFeatureKeys();
    return expandableKeys.every((k) => open.has(k));
  });

  readonly allFeaturesSelected = computed(() => {
    this.featureSelectionTick();
    const features = this.collectVisibleFeatures();

    if (features.length === 0) {
      return false;
    }

    return features.every((f) => f.enabled === true);
  });

  constructor(
    injector: Injector,
    private readonly tenantService: TenantServiceProxy,
    private readonly tenantBrandingService: AppTenantBrandingService,
    private readonly featuresService: FeaturesServiceProxy,
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

  onFeatureSearch(value: string): void {
    this.featureSearch.set(value ?? '');
    this.rebuildFeatureModules();
  }

  selectFeatureModule(key: string): void {
    this.selectedFeatureModuleKey.set(key);
    this.openFeatureKeys.set(new Set<string>());
    this.bumpFeatureSelection();
  }

  selectedFeatureModule(): FeatureModuleVm | null {
    return this.featureModules().find((m) => m.key === this.selectedFeatureModuleKey()) ?? null;
  }

  selectedFeatureTree(): FeatureNode[] {
    const module = this.selectedFeatureModule();
    if (!module) {
      return [];
    }

    const term = (this.featureSearch() ?? '').trim().toLowerCase();
    return this.buildFeatureTree(module.features ?? [], term);
  }

  toggleFeatureNodeOpen(node: FeatureNode): void {
    const set = new Set(this.openFeatureKeys());

    if (set.has(node.key)) {
      set.delete(node.key);
    } else {
      set.add(node.key);
    }

    this.openFeatureKeys.set(set);
  }

  toggleExpandAllFeatures(): void {
    const tree = this.selectedFeatureTree();
    const expandableKeys = tree
      .filter((n) => (n.children?.length ?? 0) > 0)
      .map((n) => n.key);

    const next = new Set(this.openFeatureKeys());

    if (!this.allFeaturesExpanded()) {
      for (const k of expandableKeys) {
        next.add(k);
      }
    } else {
      for (const k of expandableKeys) {
        next.delete(k);
      }
    }

    this.openFeatureKeys.set(next);
  }

  toggleSelectAllFeatures(): void {
    const features = this.collectVisibleFeatures();
    const nextValue = !this.allFeaturesSelected();

    for (const feature of features) {
      feature.enabled = nextValue;
      feature.currentValue = nextValue ? 'true' : 'false';
    }

    this.bumpFeatureSelection();
  }

  toggleFeature(feature: LocalTenantFeature, value: boolean): void {
    feature.enabled = value;
    feature.currentValue = value ? 'true' : 'false';
    this.bumpFeatureSelection();
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
        if (!tenantId) {
          this.saving.set(false);
          this.notify.warn('No se pudo identificar el tenant para guardar los features.');
          return;
        }

        this.saveTenantFeatures(
          tenantId,
          () => {
            if (selectedLogo) {
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
          () => {
            this.saving.set(false);
            this.notify.warn(
              'Los datos básicos del tenant fueron actualizados, pero ocurrió un error guardando los features.'
            );
          }
        );
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
        this.loadTenantFeatures(result.id);
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
        this.brandingCompanyDescription.set((result?.companyDescription ?? '').trim());
        this.brandingCompanyType.set(
          (result?.companyType ?? '').trim() || 'SRL'
        );
        this.tenantBrandingService.clearBrandingState();
      },
      error: () => {
        this.currentBranding.set(null);
        this.currentLogoUrl.set(null);
        this.brandingCompanyName.set(this.formState().name.trim());
        this.brandingCompanyDescription.set('');
        this.brandingCompanyType.set('SRL');
      },
    });
  }

  private loadTenantFeatures(tenantId: number): void {
    this.featuresLoading.set(true);
    this.featuresError.set(null);

    this.featuresService.getAllFeatures().subscribe({
      next: (allResult) => {
        const allFeatures = allResult.items ?? [];

        this.featuresService
          .getTenantFeatures(tenantId)
          .pipe(finalize(() => this.featuresLoading.set(false)))
          .subscribe({
            next: (tenantResult) => {
              const tenantFeatures = tenantResult.items ?? [];
              const merged = this.mergeTenantFeatures(allFeatures, tenantFeatures);

              this.allTenantFeatures.set(merged);
              this.rebuildFeatureModules();

              const current = this.selectedFeatureModuleKey();
              const exists = this.featureModules().some((m) => m.key === current);

              if (!exists) {
                this.selectedFeatureModuleKey.set(this.featureModules()[0]?.key ?? '');
              }

              this.bumpFeatureSelection();
            },
            error: (error) => {
              this.featuresError.set(error?.message ?? 'Error cargando features del tenant.');
            },
          });
      },
      error: (error) => {
        this.featuresLoading.set(false);
        this.featuresError.set(error?.message ?? 'Error cargando features disponibles.');
      },
    });
  }

  private mergeTenantFeatures(
    allFeatures: FeatureDto[],
    tenantFeatures: FeatureDto[]
  ): LocalTenantFeature[] {
    const tenantMap = new Map<string, FeatureDto>();

    for (const feature of tenantFeatures ?? []) {
      const key = (feature?.name ?? '').trim();
      if (!key) {
        continue;
      }
      tenantMap.set(key, feature);
    }

    return (allFeatures ?? [])
      .filter((feature) => !!feature?.name)
      .map((feature) => {
        const key = (feature.name ?? '').trim();
        const tenantFeature = tenantMap.get(key);

        const currentValue = (
          tenantFeature?.currentValue ??
          feature.currentValue ??
          feature.defaultValue ??
          'false'
        ).toString();

        const enabled = currentValue.toLowerCase() === 'true';

        return {
          name: key,
          displayName: (feature.displayName ?? feature.name ?? 'Feature').toString(),
          description: feature.description ?? undefined,
          defaultValue: feature.defaultValue ?? undefined,
          currentValue,
          enabled,
        } as LocalTenantFeature;
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  private rebuildFeatureModules(): void {
    const term = (this.featureSearch() ?? '').trim().toLowerCase();
    const source = this.allTenantFeatures() ?? [];
    const grouped = new Map<string, LocalTenantFeature[]>();

    for (const feature of source) {
      if (!feature?.name) {
        continue;
      }

      const root = this.extractFeatureRoot(feature.name);

      if (!grouped.has(root)) {
        grouped.set(root, []);
      }

      grouped.get(root)!.push(feature);
    }

    const modules: FeatureModuleVm[] = [];

    Array.from(grouped.entries()).forEach(([rootKey, features]) => {
      const filtered = !term
        ? features
        : features.filter((feature) => {
            const n = (feature.name ?? '').toLowerCase();
            const d = (feature.displayName ?? '').toLowerCase();
            return n.includes(term) || d.includes(term);
          });

      if (term && filtered.length === 0) {
        return;
      }

      const rootFeature = features.find((x) => x.name === rootKey);
      const title = rootFeature?.displayName?.trim() || rootKey;

      modules.push({
        key: rootKey,
        title,
        count: filtered.length,
        features: filtered,
      });
    });

    modules.sort((a, b) => a.title.localeCompare(b.title));
    this.featureModules.set(modules);

    const current = this.selectedFeatureModuleKey();
    const exists = modules.some((m) => m.key === current);

    if (!exists) {
      this.selectedFeatureModuleKey.set(modules[0]?.key ?? '');
    }
  }

  private extractFeatureRoot(name: string): string {
    const value = (name ?? '').trim();
    if (!value) {
      return 'General';
    }

    const idx = value.indexOf('.');
    return idx > 0 ? value.substring(0, idx) : value;
  }

  private buildFeatureTree(features: LocalTenantFeature[], termLower: string): FeatureNode[] {
    const list = features ?? [];
    const nameSet = new Set<string>(list.map((f) => f.name).filter(Boolean));
    const nodes = new Map<string, FeatureNode>();

    const getParentName = (full: string): string | null => {
      const idx = full.lastIndexOf('.');
      if (idx <= 0) {
        return null;
      }

      const parent = full.substring(0, idx);
      return nameSet.has(parent) ? parent : null;
    };

    for (const feature of list) {
      const key = feature.name;
      if (!key) {
        continue;
      }

      const parent = getParentName(key);
      if (!parent && !nodes.has(key)) {
        nodes.set(key, {
          key,
          title: feature.displayName || feature.name,
          feature,
          children: [],
          match: false,
          open: false,
        });
      }
    }

    const findRoot = (full: string): string => {
      let current = full;

      while (true) {
        const parent = getParentName(current);
        if (!parent) {
          return current;
        }
        current = parent;
      }
    };

    for (const feature of list) {
      const key = feature.name;
      if (!key) {
        continue;
      }

      const parent = getParentName(key);
      if (!parent) {
        continue;
      }

      const root = findRoot(parent);

      if (!nodes.has(root)) {
        const rootFeature = list.find((x) => x.name === root);
        if (!rootFeature) {
          continue;
        }

        nodes.set(root, {
          key: root,
          title: rootFeature.displayName || rootFeature.name,
          feature: rootFeature,
          children: [],
          match: false,
          open: false,
        });
      }

      if (key !== root) {
        nodes.get(root)!.children.push(feature);
      }
    }

    const result = Array.from(nodes.values()).sort((a, b) => a.title.localeCompare(b.title));

    for (const node of result) {
      node.children.sort((a, b) =>
        (a.displayName || a.name).localeCompare(b.displayName || b.name)
      );
    }

    const openSet = this.openFeatureKeys();

    if (!termLower) {
      for (const node of result) {
        node.open = openSet.has(node.key);
      }
      return result;
    }

    for (const node of result) {
      const principalMatch =
        node.key.toLowerCase().includes(termLower) ||
        (node.title ?? '').toLowerCase().includes(termLower);

      let childMatch = false;

      for (const child of node.children) {
        const ck = (child.name ?? '').toLowerCase();
        const ct = (child.displayName ?? '').toLowerCase();

        if (ck.includes(termLower) || ct.includes(termLower)) {
          childMatch = true;
          break;
        }
      }

      node.match = principalMatch || childMatch;
      node.open = node.match ? true : openSet.has(node.key);
    }

    return result.filter((node) => node.match);
  }

  private collectVisibleFeatures(): LocalTenantFeature[] {
    const tree = this.selectedFeatureTree();
    const out: LocalTenantFeature[] = [];

    for (const node of tree) {
      if (node.feature) {
        out.push(node.feature);
      }

      for (const child of node.children ?? []) {
        out.push(child);
      }
    }

    const map = new Map<string, LocalTenantFeature>();

    for (const feature of out) {
      const key = (feature?.name ?? '').toString();
      if (!key) {
        continue;
      }
      map.set(key, feature);
    }

    return Array.from(map.values());
  }

  private bumpFeatureSelection(): void {
    this.featureSelectionTick.update((v) => v + 1);
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

  private saveTenantFeatures(
    tenantId: number,
    onSuccess: () => void,
    onError: () => void
  ): void {
    const input = new AddFeaturesToOneTenantInputDto();
    input.tenantId = tenantId;
    input.features = (this.allTenantFeatures() ?? []).map((feature) => {
      const item = new FeatureValueInputDto();
      item.featureName = feature.name;
      item.value = feature.enabled ? 'true' : 'false';
      return item;
    });

    this.featuresService.addFeaturesToTenant(input).subscribe({
      next: () => onSuccess(),
      error: () => onError(),
    });
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