import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Injector,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { forEach as _forEach, map as _map } from 'lodash-es';

import { AppComponentBase } from '@shared/app-component-base';
import {
  UserServiceProxy,
  CreateUserDto,
  RoleDto,
} from '@shared/service-proxies/service-proxies';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { IbsInputComponent } from '../../../../controls/ibs-input/ibs-input.component';
import { IbsCheckBoxComponent } from '../../../../controls/ibs-check-box/ibs-check-box.component';

import { IbsModalShellComponent } from '../../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTabComponent } from '../../../../controls/ibs-modal/ibs-modal-tab/ibs-modal-tab.component';
import { IbsModalTabsComponent } from '../../../../controls/ibs-modal/ibs-modal-tab/ibs-modal-tabs.component';

@Component({
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
  standalone: true,
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
export class CreateUserDialogComponent extends AppComponentBase implements OnInit {

  @Output() onSave = new EventEmitter<void>();

  saving = false;

  user = new CreateUserDto();
  confirmPassword = '';

  roles: RoleDto[] = [];
  checkedRolesMap: { [key: string]: boolean } = {};
  defaultRoleCheckedStatus = false;

  constructor(
    injector: Injector,
    public _userService: UserServiceProxy,
    public bsModalRef: BsModalRef,
    private cd: ChangeDetectorRef
  ) {
    super(injector);
  }

  ngOnInit(): void {

    this.user.isActive = true;

    this._userService.getRoles().subscribe({
      next: (result) => {

        this.roles = result.items;

        this.setInitialRolesStatus();

        this.cd.detectChanges();
      },
    });

  }

  // ---------------------------
  // Validación del botón Save
  // ---------------------------

  get canSubmit(): boolean {

    return (
      this.isNotEmpty(this.user.name) &&
      this.isNotEmpty(this.user.surname) &&
      this.isNotEmpty(this.user.userName) &&
      this.isNotEmpty(this.user.password) &&
      this.isNotEmpty(this.confirmPassword) &&
      this.isNotEmpty(this.user.emailAddress) &&
      this.passwordsMatch
    );

  }

  get passwordsMatch(): boolean {

    return (this.user.password ?? '') === (this.confirmPassword ?? '');

  }

  // ---------------------------
  // Roles
  // ---------------------------

  setInitialRolesStatus(): void {

    _map(this.roles, item => {

      this.checkedRolesMap[item.normalizedName] =
        this.isRoleChecked(item.normalizedName);

    });

  }

  isRoleChecked(normalizedName: string): boolean {

    return this.checkedRolesMap[normalizedName] ?? this.defaultRoleCheckedStatus;

  }

  onRoleChange(role: RoleDto, checked: boolean): void {

    this.checkedRolesMap[role.normalizedName] = checked;

  }

  getCheckedRoles(): string[] {

    const roles: string[] = [];

    _forEach(this.checkedRolesMap, (value, key) => {

      if (value) {
        roles.push(key);
      }

    });

    return roles;

  }

  // ---------------------------
  // Guardar Usuario
  // ---------------------------

  save(): void {

    console.log('SAVE CLICKED');

    if (this.saving) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    this.user.roleNames = this.getCheckedRoles();

    this._userService.create(this.user).subscribe({

      next: () => {

        this.notify.info(this.l('SavedSuccessfully'));

        this.bsModalRef.hide();

        this.onSave.emit();

      },

      error: (error) => {

        console.error('Create user error', error);

        this.saving = false;

      },

      complete: () => {

        this.saving = false;

        this.cd.detectChanges();

      },

    });

  }

  // ---------------------------
  // Validaciones
  // ---------------------------

  private validateForm(): boolean {

    if (!this.isNotEmpty(this.user.name)) {

      this.message.warn('Name is required');

      return false;

    }

    if (!this.isNotEmpty(this.user.surname)) {

      this.message.warn('Surname is required');

      return false;

    }

    if (!this.isNotEmpty(this.user.userName)) {

      this.message.warn('Username is required');

      return false;

    }

    if (!this.isNotEmpty(this.user.password)) {

      this.message.warn('Password is required');

      return false;

    }

    if (!this.passwordsMatch) {

      this.message.warn('Passwords do not match');

      return false;

    }

    if (!this.isNotEmpty(this.user.emailAddress)) {

      this.message.warn('Email is required');

      return false;

    }

    return true;

  }

  private isNotEmpty(value: string | null | undefined): boolean {

    return !!value && value.trim().length > 0;

  }

}