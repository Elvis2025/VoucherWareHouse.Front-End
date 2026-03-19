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
import { finalize } from 'rxjs/operators';

import { AppComponentBase } from '@shared/app-component-base';
import {
  RoleDto,
  UserDto,
  UserServiceProxy,
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
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss'],
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
export class EditUserDialogComponent extends AppComponentBase implements OnInit {
  @Output() onSave = new EventEmitter<void>();

  id!: number;

  saving = false;
  user = new UserDto();

  roles: RoleDto[] = [];
  checkedRolesMap: Record<string, boolean> = {};

  constructor(
    injector: Injector,
    public userService: UserServiceProxy,
    public bsModalRef: BsModalRef,
    private cd: ChangeDetectorRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadUserAndRoles();
  }

  get canSubmit(): boolean {
    return (
      this.isNotEmpty(this.user.name) &&
      this.isNotEmpty(this.user.surname) &&
      this.isNotEmpty(this.user.userName) &&
      this.isNotEmpty(this.user.emailAddress)
    );
  }

  close(): void {
    this.bsModalRef.hide();
  }

  save(): void {
    if (this.saving || !this.canSubmit) {
      return;
    }

    this.user.roleNames = this.getCheckedRoles();
    this.saving = true;

    this.userService
      .update(this.user)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cd.detectChanges();
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

  private loadUserAndRoles(): void {
    this.userService.get(this.id).subscribe({
      next: (userResult) => {
        this.user = userResult;

        this.userService.getRoles().subscribe({
          next: (rolesResult) => {
            this.roles = rolesResult.items;
            this.initializeCheckedRoles();
            this.cd.detectChanges();
          },
        });
      },
    });
  }

  private initializeCheckedRoles(): void {
    this.checkedRolesMap = {};

    const assignedRoles = new Set(
      (this.user.roleNames ?? []).map(x => (x ?? '').trim().toUpperCase())
    );

    for (const role of this.roles) {
      this.checkedRolesMap[role.normalizedName] =
        assignedRoles.has((role.normalizedName ?? '').trim().toUpperCase()) ||
        assignedRoles.has((role.name ?? '').trim().toUpperCase());
    }
  }

  private getCheckedRoles(): string[] {
    return this.roles
      .filter(role => this.checkedRolesMap[role.normalizedName])
      .map(role => role.normalizedName);
  }

 
}