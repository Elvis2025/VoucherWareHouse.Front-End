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
import { FlatPermissionDto, GetRoleForEditOutput, RoleDto, RoleServiceProxy } from '../../../../../shared/service-proxies/service-proxies';

interface EditRoleFormState {
  id?: number;
  name: string;
  displayName: string;
  description: string;
  isStatic: boolean;
}

@Component({
  templateUrl: './edit-role-dialog.component.html',
  styleUrls: ['./edit-role-dialog.component.scss'],
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
export class EditRoleDialogComponent extends AppComponentBase implements OnInit {
  @Output() onSave = new EventEmitter<void>();

  id!: number;

  readonly saving = signal(false);

  readonly formState = signal<EditRoleFormState>({
    id: undefined,
    name: '',
    displayName: '',
    description: '',
    isStatic: false,
  });

  readonly permissions = signal<FlatPermissionDto[]>([]);
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
    this.loadRole();
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
      .update(payload)
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

  private loadRole(): void {
    this.roleService.getRoleForEdit(this.id).subscribe({
      next: (result: GetRoleForEditOutput) => {
        this.initializeForm(result);
      },
    });
  }

  private initializeForm(result: GetRoleForEditOutput): void {
    const role = result.role;

    this.formState.set({
      id: role.id,
      name: role.name ?? '',
      displayName: role.displayName ?? '',
      description: role.description ?? '',
      isStatic: !!role.isStatic,
    });

    this.permissions.set(result.permissions ?? []);

    const granted = new Set(
      (result.grantedPermissionNames ?? []).map((x) => (x ?? '').trim())
    );

    const map: Record<string, boolean> = {};

    for (const permission of result.permissions ?? []) {
      map[permission.name] = granted.has(permission.name);
    }

    this.checkedPermissionsMap.set(map);
  }

  private buildPayload(): RoleDto {
    const form = this.formState();
    const role = new RoleDto();

    role.id = form.id;
    role.name = form.name.trim();
    role.displayName = form.displayName.trim();
    role.description = form.description?.trim() ?? '';
    role.grantedPermissions = this.getCheckedPermissions();

    return role;
  }

  private getCheckedPermissions(): string[] {
    const map = this.checkedPermissionsMap();

    return Object.keys(map).filter((key) => map[key]);
  }
}