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
import { IbsModalBodyComponent } from '@app/controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalShellComponent } from '@app/controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '@app/controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalFooterComponent } from '@app/controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTopBarComponent } from '@app/controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component';
import {
  RoleDto,
  RoleDtoListResultDto,
  RoleServiceProxy,
  UserServiceProxy
} from '@shared/service-proxies/service-proxies';

declare const abp: any;

export type IdentityRole = {
  id: string;
  name: string;
  isDefault?: boolean;
  isPublic?: boolean;
};

export type UsersAssignmentSavePayload = {
  userId?: string;
  userName?: string;
  assignedRoleNames: string[];
  addRoleNames: string[];
  removeRoleNames: string[];
};

@Component({
  standalone: true,
  selector: 'app-users-assignment-modal',
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
  templateUrl: './users-assignment-modal.component.html',
  styleUrl: './users-assignment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersAssignmentModalComponent {
  private readonly roleService = inject(RoleServiceProxy);
  private readonly userService = inject(UserServiceProxy);
  private readonly bsModalRef = inject(BsModalRef, { optional: true });

  @Input({ required: true }) userId: string | number | null | undefined = null;
  @Input() userName = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() save = new EventEmitter<UsersAssignmentSavePayload>();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly leftQ = signal('');
  readonly rightQ = signal('');

  readonly left = signal<IdentityRole[]>([]);
  readonly right = signal<IdentityRole[]>([]);

  private readonly initialAssignedRoleNames = signal<Set<string>>(new Set<string>());

  readonly modalAccent = computed(() => (this.userName ?? '').trim());

  readonly leftFiltered = computed(() => {
    const q = (this.leftQ() ?? '').trim().toLowerCase();
    if (!q) return this.left();
    return this.left().filter((r) => this.roleSearchText(r).includes(q));
  });

  readonly rightFiltered = computed(() => {
    const q = (this.rightQ() ?? '').trim().toLowerCase();
    if (!q) return this.right();
    return this.right().filter((r) => this.roleSearchText(r).includes(q));
  });

  readonly leftCount = computed(() => this.leftFiltered().length);
  readonly rightCount = computed(() => this.rightFiltered().length);

  private invalidWarningShown = false;
  private currentLoadToken = 0;

  initialize(userId: string | number | null | undefined, userName?: string): void {
    this.userId = userId;
    this.userName = userName ?? '';
    void this.load();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.bsModalRef?.hide();
  }

  async load(): Promise<void> {
    const normalizedUserId = this.normalizeUserId(this.userId);

    if (!normalizedUserId) {
      this.warnAndCloseInvalidUserId();
      return;
    }

    const loadToken = ++this.currentLoadToken;

    this.loading.set(true);
    this.error.set(null);
    this.left.set([]);
    this.right.set([]);
    this.initialAssignedRoleNames.set(new Set<string>());

    try {
      const assignedRoleNames = await this.getUserRoleNames(normalizedUserId);
      const roles = await this.fetchAllRoles();

      if (loadToken !== this.currentLoadToken) {
        return;
      }

      const assignedLower = new Set(
        assignedRoleNames.map((x) => x.toLowerCase())
      );

      const assigned: IdentityRole[] = [];
      const notAssigned: IdentityRole[] = [];

      roles.forEach((r) => {
        const roleName = (r.name ?? '').trim();
        if (!roleName) {
          return;
        }

        if (assignedLower.has(roleName.toLowerCase())) {
          assigned.push(r);
        } else {
          notAssigned.push(r);
        }
      });

      this.right.set(this.sortRoles(this.uniqueByName(assigned)));
      this.left.set(this.sortRoles(this.uniqueByName(notAssigned)));
      this.initialAssignedRoleNames.set(
        new Set<string>(
          assigned
            .map((x) => (x.name ?? '').trim())
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
        'Error cargando roles/usuario.';

      this.error.set(msg);
    } finally {
      if (loadToken === this.currentLoadToken) {
        this.loading.set(false);
      }
    }
  }

  private async getUserRoleNames(userId: string): Promise<string[]> {
    const numericUserId = this.parseUserId(userId);
    const user = await firstValueFrom(this.userService.get(numericUserId));

    const directRoleNames = (user?.roleNames ?? [])
      .map((x) => (x ?? '').toString().trim())
      .filter((x) => !!x);

    if (directRoleNames.length > 0) {
      return directRoleNames;
    }

    const fallbackByList = await this.tryGetUserRoleNamesFromPagedUsers(numericUserId);
    return fallbackByList;
  }

  private async tryGetUserRoleNamesFromPagedUsers(userId: number): Promise<string[]> {
    let keyword = '';

    if ((this.userName ?? '').trim()) {
      keyword = this.userName.trim();
    }

    const paged = await firstValueFrom(
      this.userService.getAll(keyword, undefined as any, 'UserName asc', 0, 200)
    );

    const foundUser =
      (paged?.items ?? []).find((u) => Number(u?.id) === userId) ?? null;

    return (foundUser?.roleNames ?? [])
      .map((x) => (x ?? '').toString().trim())
      .filter((x) => !!x);
  }

  private async fetchAllRoles(): Promise<IdentityRole[]> {
    try {
      const res: RoleDtoListResultDto = await firstValueFrom(this.userService.getRoles());
      const userRoles = (res?.items ?? []).map((r) => this.mapRoleDtoToIdentityRole(r));

      if (userRoles.length > 0) {
        return this.sortRoles(this.uniqueByName(userRoles));
      }
    } catch {
      // fallback
    }

    const pageSize = 200;
    let skip = 0;
    const out: IdentityRole[] = [];

    while (true) {
      const res = await firstValueFrom(
        this.roleService.getAll('', 'Name asc', skip, pageSize)
      );

      const items = (res?.items ?? []).map((r: RoleDto) =>
        this.mapRoleDtoToIdentityRole(r)
      );

      out.push.apply(out, items);

      const total = res?.totalCount ?? out.length;
      skip += pageSize;

      if (out.length >= total) {
        break;
      }

      if (items.length === 0) {
        break;
      }
    }

    return this.sortRoles(this.uniqueByName(out));
  }

  private async updateUserRoles(userId: string, roleNames: string[]): Promise<void> {
    const numericUserId = this.parseUserId(userId);
    const user = await firstValueFrom(this.userService.get(numericUserId));

    if (!user) {
      throw new Error('No se pudo cargar el usuario para actualizar sus roles.');
    }

    user.roleNames = roleNames.slice();
    await firstValueFrom(this.userService.update(user));
  }

  moveToRight(role: IdentityRole): void {
    if (!this.left().some((x) => x.id === role.id)) {
      return;
    }

    this.left.set(this.left().filter((x) => x.id !== role.id));
    this.right.set(this.sortRoles(this.uniqueByName(this.right().concat(role))));
  }

  moveToLeft(role: IdentityRole): void {
    if (!this.right().some((x) => x.id === role.id)) {
      return;
    }

    this.right.set(this.right().filter((x) => x.id !== role.id));
    this.left.set(this.sortRoles(this.uniqueByName(this.left().concat(role))));
  }

  onDrop(event: CdkDragDrop<IdentityRole[]>, side: 'left' | 'right'): void {
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
      this.left.set(this.sortRoles(this.uniqueByName(to)));
      this.right.set(this.sortRoles(this.uniqueByName(from)));
    } else {
      this.left.set(this.sortRoles(this.uniqueByName(from)));
      this.right.set(this.sortRoles(this.uniqueByName(to)));
    }
  }

  async onSaved(): Promise<void> {
    const normalizedUserId = this.normalizeUserId(this.userId);

    if (!normalizedUserId) {
      this.warnAndCloseInvalidUserId();
      return;
    }

    const currentAssigned = new Set(
      this.right()
        .map((x) => (x.name ?? '').trim())
        .filter((x) => !!x)
    );

    const initial = this.initialAssignedRoleNames();

    const addRoleNames: string[] = [];
    const removeRoleNames: string[] = [];

    Array.from(currentAssigned).forEach((n) => {
      if (!initial.has(n)) {
        addRoleNames.push(n);
      }
    });

    Array.from(initial).forEach((n) => {
      if (!currentAssigned.has(n)) {
        removeRoleNames.push(n);
      }
    });

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.updateUserRoles(normalizedUserId, Array.from(currentAssigned));

      const payload: UsersAssignmentSavePayload = {
        userId: normalizedUserId,
        userName: this.userName,
        assignedRoleNames: Array.from(currentAssigned),
        addRoleNames,
        removeRoleNames,
      };

      this.save.emit(payload);
      this.bsModalRef?.hide();
    } catch (e: any) {
      const msg =
        e?.error?.error?.message ||
        e?.error?.message ||
        e?.message ||
        'Error guardando roles del usuario.';

      this.error.set(msg);
    } finally {
      this.saving.set(false);
    }
  }

  trackById = (_: number, r: IdentityRole) => r.id;

  private roleSearchText(r: IdentityRole): string {
    return `${r.id} ${r.name ?? ''}`.toLowerCase();
  }

  private sortRoles(roles: IdentityRole[]): IdentityRole[] {
    return roles
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }

  private uniqueByName(list: IdentityRole[]): IdentityRole[] {
    const map = new Map<string, IdentityRole>();

    list.forEach((r) => {
      const key = (r.name ?? '').trim().toLowerCase();
      if (!key) {
        return;
      }

      if (!map.has(key)) {
        map.set(key, r);
      }
    });

    return Array.from(map.values());
  }

  private mapRoleDtoToIdentityRole(role: RoleDto): IdentityRole {
    return {
      id: String(role.id ?? ''),
      name: (role.name ?? '').trim(),
      isDefault: false,
      isPublic: true,
    };
  }

  private normalizeUserId(value: string | number | null | undefined): string | null {
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

  private parseUserId(userId: string): number {
    const numericUserId = Number(userId);

    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new Error('El userId recibido no es válido para ASP.NET Zero.');
    }

    return numericUserId;
  }

  private warnAndCloseInvalidUserId(): void {
    if (this.invalidWarningShown) {
      return;
    }

    this.invalidWarningShown = true;

    try {
      abp?.message?.warn?.(
        'No se pudo abrir la asignación de roles porque el usuario no tiene un identificador válido.',
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