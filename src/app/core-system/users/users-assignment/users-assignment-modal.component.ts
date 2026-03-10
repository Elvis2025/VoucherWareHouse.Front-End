import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
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

import { DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';


import { RoleDto, RoleServiceProxy, UserServiceProxy } from '../../../../shared/service-proxies/service-proxies';
import { IbsModalBodyComponent } from '../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalShellComponent } from '../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalFooterComponent } from '../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';
import { IbsModalTopBarComponent } from '../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component';



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

type AbpPagedResult<T> = { items: T[]; totalCount: number };
type UserRolesResult = { items: { name: string }[] } | { roleNames: string[] } | string[];

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
export class UsersAssignmentModalComponent implements OnInit, OnChanges {
  private readonly roleService = inject(RoleServiceProxy);
  private readonly userService = inject(UserServiceProxy);

  private readonly dialogRef = inject(DialogRef, { optional: true });

  @Input({ required: true }) userId!: string;
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

  ngOnInit(): void {
    void this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] || changes['userName']) {
      void this.load();
    }
  }

  onCancel(): void {
    this.dialogRef?.close();
    this.cancelled.emit();
  }

  async load(): Promise<void> {
    const userId = (this.userId ?? '').trim();
    if (!userId) {
      this.error.set('No se recibió un userId válido.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.left.set([]);
    this.right.set([]);
    this.initialAssignedRoleNames.set(new Set<string>());

    try {
      const assignedRoleNames = await this.getUserRoleNames(userId);
      const assignedLower = new Set(assignedRoleNames.map((x) => x.toLowerCase()));

      const roles = await this.fetchAllRoles();

      const assigned: IdentityRole[] = [];
      const notAssigned: IdentityRole[] = [];

      for (const r of roles) {
        const name = (r.name ?? '').trim();
        if (!name) continue;

        if (assignedLower.has(name.toLowerCase())) {
          assigned.push(r);
        } else {
          notAssigned.push(r);
        }
      }

      const assignedNamesSet = new Set(
        assigned.map((x) => (x.name ?? '').toLowerCase())
      );

      const leftFinal = notAssigned.filter(
        (x) => !assignedNamesSet.has((x.name ?? '').toLowerCase())
      );

      this.right.set(this.sortRoles(assigned));
      this.left.set(this.sortRoles(leftFinal));

      this.initialAssignedRoleNames.set(
        new Set<string>(assigned.map((x) => x.name).filter(Boolean) as string[])
      );
    } catch (e: any) {
      const msg =
        e?.error?.error?.message ||
        e?.error?.message ||
        e?.message ||
        'Error cargando roles/usuario.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  private async getUserRoleNames(userId: string): Promise<string[]> {
    const numericUserId = this.parseUserId(userId);

    const user = await firstValueFrom(this.userService.get(numericUserId));

    const roleNames = user?.roleNames ?? [];
    return roleNames
      .map((x) => (x ?? '').toString().trim())
      .filter(Boolean);
  }

  private async fetchAllRoles(): Promise<IdentityRole[]> {
    const pageSize = 200;
    let skip = 0;

    const out: IdentityRole[] = [];

    while (true) {
      const res = await firstValueFrom(
        this.roleService.getAll('', 'name asc', skip, pageSize)
      );

      const items = (res?.items ?? []).map((r: RoleDto) => this.mapRoleDtoToIdentityRole(r));
      out.push(...items);

      const total = res?.totalCount ?? out.length;
      skip += pageSize;

      if (out.length >= total) break;
      if (items.length === 0) break;
    }

    return this.sortRoles(out);
  }

  private async updateUserRoles(userId: string, roleNames: string[]): Promise<void> {
    const numericUserId = this.parseUserId(userId);

    const user = await firstValueFrom(this.userService.get(numericUserId));
    if (!user) {
      throw new Error('No se pudo cargar el usuario para actualizar sus roles.');
    }

    user.roleNames = [...roleNames];

    await firstValueFrom(this.userService.update(user));
  }

  moveToRight(role: IdentityRole): void {
    if (!this.left().some((x) => x.id === role.id)) return;

    this.left.set(this.left().filter((x) => x.id !== role.id));
    this.right.set(this.sortRoles(this.uniqueByName([...this.right(), role])));
  }

  moveToLeft(role: IdentityRole): void {
    if (!this.right().some((x) => x.id === role.id)) return;

    this.right.set(this.right().filter((x) => x.id !== role.id));
    this.left.set(this.sortRoles(this.uniqueByName([...this.left(), role])));
  }

  onDrop(event: CdkDragDrop<IdentityRole[]>, side: 'left' | 'right'): void {
    if (event.previousContainer === event.container) {
      const arr = side === 'left' ? [...this.left()] : [...this.right()];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      side === 'left' ? this.left.set(arr) : this.right.set(arr);
      return;
    }

    const from = [...event.previousContainer.data];
    const to = [...event.container.data];

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
    const userId = (this.userId ?? '').trim();
    if (!userId) {
      this.error.set('No se recibió un userId válido para guardar.');
      return;
    }

    const currentAssigned = new Set(
      this.right()
        .map((x) => (x.name ?? '').trim())
        .filter(Boolean)
    );

    const initial = this.initialAssignedRoleNames();

    const addRoleNames: string[] = [];
    const removeRoleNames: string[] = [];

    Array.from(currentAssigned).forEach((n) => {
        if (!initial.has(n)) addRoleNames.push(n);
    });

    Array.from(initial).forEach((n) => {
      if (!currentAssigned.has(n)) removeRoleNames.push(n);
    });

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.updateUserRoles(userId, Array.from(currentAssigned));

      const payload: UsersAssignmentSavePayload = {
        userId: this.userId,
        userName: this.userName,
        assignedRoleNames: Array.from(currentAssigned),
        addRoleNames,
        removeRoleNames,
      };

      this.save.emit(payload);

      this.dialogRef?.close(payload);
      this.cancelled.emit();
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
    return [...roles].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '')
    );
  }

  private uniqueByName(list: IdentityRole[]): IdentityRole[] {
    const map = new Map<string, IdentityRole>();

    for (const r of list) {
      const k = (r.name ?? '').toLowerCase();
      if (!k) continue;
      map.set(k, r);
    }

    return Array.from(map.values());
  }

  private mapRoleDtoToIdentityRole(role: RoleDto): IdentityRole {
    return {
      id: (role.id ?? '').toString(),
      name: role.name ?? '',
      isDefault: false,
      isPublic: true,
    };
  }

  private parseUserId(userId: string): number {
    const numericUserId = Number(userId);

    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new Error('El userId recibido no es válido para ASP.NET Zero.');
    }

    return numericUserId;
  }
}