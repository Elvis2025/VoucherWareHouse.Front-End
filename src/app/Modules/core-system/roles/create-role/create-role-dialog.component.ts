import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  OnInit,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';



import { IbsInputComponent } from '../../../../controls/ibs-input/ibs-input.component';
import { IbsCheckBoxComponent } from '../../../../controls/ibs-check-box/ibs-check-box.component';
import { IbsModalShellComponent } from '../../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTabComponent } from '../../../../controls/ibs-modal/ibs-modal-tab/ibs-modal-tab.component';
import { IbsModalTabsComponent } from '../../../../controls/ibs-modal/ibs-modal-tab/ibs-modal-tabs.component';
import { LocalizePipe } from '../../../../../shared/pipes/localize.pipe';
import { AppComponentBase } from '../../../../../shared/app-component-base';
import { CreateRoleDto, PermissionDto, PermissionDtoListResultDto, RoleServiceProxy } from '../../../../../shared/service-proxies/service-proxies';

interface CreateRoleFormState {
  name: string;
  displayName: string;
  description: string;
}

@Component({
  templateUrl: './create-role-dialog.component.html',
  styleUrls: ['./create-role-dialog.component.scss'],
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
    IbsModalTabsComponent,
    IbsModalTabComponent,
  ],
})
export class CreateRoleDialogComponent extends AppComponentBase implements OnInit {
  @Output() onSave = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly defaultPermissionCheckedStatus = true;

  readonly formState = signal<CreateRoleFormState>({
    name: '',
    displayName: '',
    description: '',
  });

  readonly permissions = signal<PermissionDto[]>([]);
  readonly checkedPermissionsMap = signal<Record<string, boolean>>({});

  readonly canSubmit = computed(() => {
    const form = this.formState();

    return (
      form.name.trim().length >= 2 &&
      form.displayName.trim().length >= 2
    );
  });

  constructor(
    injector: Injector,
    private readonly roleService: RoleServiceProxy,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  close(): void {
    this.bsModalRef.hide();
  }

  updateName(value: string): void {
    this.formState.update((state) => ({
      ...state,
      name: value ?? '',
    }));
  }

  updateDisplayName(value: string): void {
    this.formState.update((state) => ({
      ...state,
      displayName: value ?? '',
    }));
  }

  updateDescription(value: string): void {
    this.formState.update((state) => ({
      ...state,
      description: value ?? '',
    }));
  }

  updatePermission(permissionName: string, checked: boolean): void {
    this.checkedPermissionsMap.update((map) => ({
      ...map,
      [permissionName]: !!checked,
    }));
  }

  submit(): void {
    if (this.saving() || !this.canSubmit()) {
      return;
    }

    this.saving.set(true);

    const payload = this.buildPayload();

    this.roleService
      .create(payload)
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
      });
  }

  private loadPermissions(): void {
    this.roleService.getAllPermissions().subscribe({
      next: (result: PermissionDtoListResultDto) => {
        this.permissions.set(result.items ?? []);
        this.initializePermissions(result.items ?? []);
      },
    });
  }

  private initializePermissions(items: PermissionDto[]): void {
    const map: Record<string, boolean> = {};

    for (const permission of items) {
      map[permission.name] = this.defaultPermissionCheckedStatus;
    }

    this.checkedPermissionsMap.set(map);
  }

  private buildPayload(): CreateRoleDto {
    const form = this.formState();
    const dto = new CreateRoleDto();

    dto.name = form.name.trim();
    dto.displayName = form.displayName.trim();
    dto.description = form.description?.trim() ?? '';
    dto.grantedPermissions = this.getCheckedPermissions();

    return dto;
  }

  private getCheckedPermissions(): string[] {
    const map = this.checkedPermissionsMap();

    return Object.keys(map).filter((key) => map[key]);
  }
}