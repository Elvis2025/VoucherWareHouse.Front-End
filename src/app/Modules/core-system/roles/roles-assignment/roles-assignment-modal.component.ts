import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { firstValueFrom } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { IbsModalBodyComponent } from '../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalShellComponent } from '../../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalFooterComponent } from '../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTopBarComponent } from '../../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component';
import { RoleDto, RoleServiceProxy, UserDto, UserServiceProxy } from '../../../../../shared/service-proxies/service-proxies';


declare const abp: any;

export type IdentityUser = {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  fullName?: string;
  emailAddress?: string;
  isActive?: boolean;
  roleNames?: string[];
};

export type RoleUsersAssignmentSavePayload = {
  roleId?: string;
  roleName?: string;
  assignedUserIds: string[];
  addUserIds: string[];
  removeUserIds: string[];
};

@Component({
  standalone: true,
  selector: 'app-role-users-assignment-modal',
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    IbsModalBodyComponent,
    IbsModalShellComponent,
    IbsModalHeaderComponent,
    IbsModalFooterComponent,
    IbsModalTopBarComponent,
  ],
  templateUrl: './roles-assignment-modal.component.html',
  styleUrl: './roles-assignment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAssignmentModalComponent {
  private readonly roleService = inject(RoleServiceProxy);
  private readonly userService = inject(UserServiceProxy);
  private readonly bsModalRef = inject(BsModalRef, { optional: true });

  @Input({ required: true }) roleId: string | number | null | undefined = null;
  @Input() roleName = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() save = new EventEmitter<RoleUsersAssignmentSavePayload>();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly leftQ = signal('');
  readonly rightQ = signal('');

  readonly left = signal<IdentityUser[]>([]);
  readonly right = signal<IdentityUser[]>([]);

  private readonly initialAssignedUserIds = signal<Set<string>>(new Set<string>());
  private invalidWarningShown = false;
  private currentLoadToken = 0;

  readonly modalAccent = computed(() => (this.roleName ?? '').trim());

  readonly leftFiltered = computed(() => {
    const q = (this.leftQ() ?? '').trim().toLowerCase();
    if (!q) {
      return this.left();
    }

    return this.left().filter((u) => this.userSearchText(u).includes(q));
  });

  readonly rightFiltered = computed(() => {
    const q = (this.rightQ() ?? '').trim().toLowerCase();
    if (!q) {
      return this.right();
    }

    return this.right().filter((u) => this.userSearchText(u).includes(q));
  });

  readonly leftCount = computed(() => this.leftFiltered().length);
  readonly rightCount = computed(() => this.rightFiltered().length);

  initialize(roleId: string | number | null | undefined, roleName?: string): void {
    this.roleId = roleId;
    this.roleName = roleName ?? '';
    void this.load();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.bsModalRef?.hide();
  }

  async load(): Promise<void> {
    const normalizedRoleId = this.normalizeRoleId(this.roleId);

    if (!normalizedRoleId) {
      this.warnAndCloseInvalidRoleId();
      return;
    }

    const loadToken = ++this.currentLoadToken;

    this.loading.set(true);
    this.error.set(null);
    this.left.set([]);
    this.right.set([]);
    this.initialAssignedUserIds.set(new Set<string>());

    try {
      const role = await this.getRole(normalizedRoleId);

      if (loadToken !== this.currentLoadToken) {
        return;
      }

      const resolvedRoleName = (role?.name ?? this.roleName ?? '').trim();

      if (!resolvedRoleName) {
        throw new Error('No se pudo determinar el nombre del rol.');
      }

      this.roleName = resolvedRoleName;

      const users = await this.fetchAllUsers();

      if (loadToken !== this.currentLoadToken) {
        return;
      }

      const assigned: IdentityUser[] = [];
      const notAssigned: IdentityUser[] = [];

      users.forEach((u) => {
        const userRoleNames = (u.roleNames ?? [])
          .map((x) => (x ?? '').toString().trim().toLowerCase())
          .filter((x) => !!x);

        if (userRoleNames.includes(resolvedRoleName.toLowerCase())) {
          assigned.push(u);
        } else {
          notAssigned.push(u);
        }
      });

      const assignedUnique = this.sortUsers(this.uniqueById(assigned));
      const notAssignedUnique = this.sortUsers(this.uniqueById(notAssigned));

      this.right.set(assignedUnique);
      this.left.set(notAssignedUnique);
      this.initialAssignedUserIds.set(
        new Set(
          assignedUnique
            .map((u) => (u.id ?? '').trim())
            .filter((x) => !!x)
        )
      );
    } catch (e: any) {
      if (loadToken !== this.currentLoadToken) {
        return;
      }

      const msg =
        e?.error?.error?.message ||
        e?.error?.message ||
        e?.message ||
        'Error cargando rol/usuarios.';

      this.error.set(msg);
    } finally {
      if (loadToken === this.currentLoadToken) {
        this.loading.set(false);
      }
    }
  }

  moveToRight(user: IdentityUser): void {
    if (!this.left().some((x) => x.id === user.id)) {
      return;
    }

    this.left.set(this.left().filter((x) => x.id !== user.id));
    this.right.set(this.sortUsers(this.uniqueById(this.right().concat(user))));
  }

  moveToLeft(user: IdentityUser): void {
    if (!this.right().some((x) => x.id === user.id)) {
      return;
    }

    this.right.set(this.right().filter((x) => x.id !== user.id));
    this.left.set(this.sortUsers(this.uniqueById(this.left().concat(user))));
  }

  onDrop(event: CdkDragDrop<IdentityUser[]>, side: 'left' | 'right'): void {
    if (event.previousContainer === event.container) {
      const arr = side === 'left' ? this.left().slice() : this.right().slice();
      moveItemInArray(arr, event.previousIndex, event.currentIndex);

      if (side === 'left') {
        this.left.set(arr);
      } else {
        this.right.set(arr);
      }

      return;
    }

    const from = event.previousContainer.data.slice();
    const to = event.container.data.slice();

    transferArrayItem(from, to, event.previousIndex, event.currentIndex);

    if (side === 'left') {
      this.left.set(this.sortUsers(this.uniqueById(to)));
      this.right.set(this.sortUsers(this.uniqueById(from)));
    } else {
      this.left.set(this.sortUsers(this.uniqueById(from)));
      this.right.set(this.sortUsers(this.uniqueById(to)));
    }
  }

  async onSaved(): Promise<void> {
    const normalizedRoleId = this.normalizeRoleId(this.roleId);

    if (!normalizedRoleId) {
      this.warnAndCloseInvalidRoleId();
      return;
    }

    const normalizedRoleName = (this.roleName ?? '').trim();

    if (!normalizedRoleName) {
      this.error.set('No se pudo determinar el nombre del rol.');
      return;
    }

    const currentAssigned = new Set(
      this.right()
        .map((u) => (u.id ?? '').trim())
        .filter((x) => !!x)
    );

    const initial = this.initialAssignedUserIds();

    const addUserIds: string[] = [];
    const removeUserIds: string[] = [];

    Array.from(currentAssigned).forEach((id) => {
      if (!initial.has(id)) {
        addUserIds.push(id);
      }
    });

    Array.from(initial).forEach((id) => {
      if (!currentAssigned.has(id)) {
        removeUserIds.push(id);
      }
    });

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.applyUsersToRole(normalizedRoleName, addUserIds, removeUserIds);

      const payload: RoleUsersAssignmentSavePayload = {
        roleId: normalizedRoleId,
        roleName: normalizedRoleName,
        assignedUserIds: Array.from(currentAssigned),
        addUserIds,
        removeUserIds,
      };

      this.save.emit(payload);
      this.bsModalRef?.hide();
    } catch (e: any) {
      const msg =
        e?.error?.error?.message ||
        e?.error?.message ||
        e?.message ||
        'Error guardando usuarios del rol.';

      this.error.set(msg);
    } finally {
      this.saving.set(false);
    }
  }

  trackById = (_: number, user: IdentityUser) => user.id;

  getUserDisplayName(user: IdentityUser): string {
    const fullName = (user.fullName ?? '').trim();
    if (fullName) {
      return fullName;
    }

    const combined = `${user.name ?? ''} ${user.surname ?? ''}`.trim();
    if (combined) {
      return combined;
    }

    const userName = (user.userName ?? '').trim();
    if (userName) {
      return userName;
    }

    return `Usuario #${user.id}`;
  }

  private async getRole(roleId: string): Promise<RoleDto> {
    const numericRoleId = this.parseRoleId(roleId);
    return await firstValueFrom(this.roleService.get(numericRoleId));
  }

  private async fetchAllUsers(): Promise<IdentityUser[]> {
    const pageSize = 200;
    let skip = 0;
    const out: IdentityUser[] = [];

    while (true) {
      const res = await firstValueFrom(
        this.userService.getAll('', undefined as any, 'UserName asc', skip, pageSize)
      );

      const items = (res?.items ?? []).map((u: UserDto) => this.mapUserDtoToIdentityUser(u));

      out.push(...items);

      const total = res?.totalCount ?? out.length;
      skip += pageSize;

      if (out.length >= total) {
        break;
      }

      if (items.length === 0) {
        break;
      }
    }

    return this.sortUsers(this.uniqueById(out));
  }

  private async applyUsersToRole(roleName: string, addUserIds: string[], removeUserIds: string[]): Promise<void> {
    for (const userId of addUserIds) {
      await this.addRoleToUser(userId, roleName);
    }

    for (const userId of removeUserIds) {
      await this.removeRoleFromUser(userId, roleName);
    }
  }

  private async addRoleToUser(userId: string, roleName: string): Promise<void> {
    const numericUserId = this.parseUserId(userId);
    const user = await firstValueFrom(this.userService.get(numericUserId));

    if (!user) {
      throw new Error(`No se pudo cargar el usuario ${userId}.`);
    }

    const roleNames = new Set(
      (user.roleNames ?? [])
        .map((x) => (x ?? '').toString().trim())
        .filter((x) => !!x)
    );

    roleNames.add(roleName);

    user.roleNames = Array.from(roleNames).sort((a, b) => a.localeCompare(b));
    await firstValueFrom(this.userService.update(user));
  }

  private async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    const numericUserId = this.parseUserId(userId);
    const user = await firstValueFrom(this.userService.get(numericUserId));

    if (!user) {
      throw new Error(`No se pudo cargar el usuario ${userId}.`);
    }

    user.roleNames = (user.roleNames ?? [])
      .map((x) => (x ?? '').toString().trim())
      .filter((x) => !!x && x.toLowerCase() !== roleName.toLowerCase());

    await firstValueFrom(this.userService.update(user));
  }

  private userSearchText(user: IdentityUser): string {
    return [
      user.id,
      user.userName ?? '',
      user.name ?? '',
      user.surname ?? '',
      user.fullName ?? '',
      user.emailAddress ?? '',
    ]
      .join(' ')
      .toLowerCase();
  }

  private sortUsers(users: IdentityUser[]): IdentityUser[] {
    return users
      .slice()
      .sort((a, b) => this.getUserDisplayName(a).localeCompare(this.getUserDisplayName(b)));
  }

  private uniqueById(list: IdentityUser[]): IdentityUser[] {
    const map = new Map<string, IdentityUser>();

    list.forEach((u) => {
      const key = (u.id ?? '').trim();
      if (!key) {
        return;
      }

      if (!map.has(key)) {
        map.set(key, u);
      }
    });

    return Array.from(map.values());
  }

  private mapUserDtoToIdentityUser(user: UserDto): IdentityUser {
    return {
      id: String(user.id ?? ''),
      userName: (user.userName ?? '').trim(),
      name: (user.name ?? '').trim(),
      surname: (user.surname ?? '').trim(),
      fullName: `${user.name ?? ''} ${user.surname ?? ''}`.trim(),
      emailAddress: (user.emailAddress ?? '').trim(),
      isActive: user.isActive,
      roleNames: (user.roleNames ?? []).map((x) => (x ?? '').toString().trim()).filter((x) => !!x),
    };
  }

  private normalizeRoleId(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();

    if (!normalized) {
      return null;
    }

    const numericValue = Number(normalized);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return null;
    }

    return normalized;
  }

  private parseRoleId(roleId: string): number {
    const numericRoleId = Number(roleId);

    if (!Number.isFinite(numericRoleId) || numericRoleId <= 0) {
      throw new Error('El roleId recibido no es válido para ASP.NET Zero.');
    }

    return numericRoleId;
  }

  private parseUserId(userId: string): number {
    const numericUserId = Number(userId);

    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new Error('El userId recibido no es válido para ASP.NET Zero.');
    }

    return numericUserId;
  }

  private warnAndCloseInvalidRoleId(): void {
    if (this.invalidWarningShown) {
      return;
    }

    this.invalidWarningShown = true;

    try {
      abp?.message?.warn?.(
        'No se pudo abrir la asignación de usuarios porque el rol no tiene un identificador válido.',
        'Advertencia'
      );
    } catch {
      // sin acción
    }

    setTimeout(() => {
      this.cancelled.emit();
      this.bsModalRef?.hide();
    }, 0);
  }
}