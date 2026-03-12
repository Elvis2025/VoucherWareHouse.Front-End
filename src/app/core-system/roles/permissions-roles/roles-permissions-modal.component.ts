import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { IbsModalShellComponent } from '../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalTopBarComponent } from '../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component';
import { IbsModalBodyComponent } from '../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';

import {
  FlatPermissionDto,
  GetRoleForEditOutput,
  PermissionTreeDto,
  RoleDto,
  RoleServiceProxy,
} from '../../../../shared/service-proxies/service-proxies';

type LocalPermission = {
  name: string;
  displayName: string;
  description?: string;
  isGranted: boolean;
};

type PermissionTreeVm = {
  key: string;
  title: string;
  perm: LocalPermission;
  children: PermissionTreeVm[];
  level: number;
  visibleChildrenCount: number;
  searchMatch: boolean;
  parentKey: string | null;
};

type PermissionRowVm = {
  key: string;
  level: number;
  node: PermissionTreeVm;
  hasChildren: boolean;
  isOpen: boolean;
};

type ModuleVM = {
  key: string;
  title: string;
  count: number;
  roots: PermissionTreeVm[];
};

type RowViewportState = {
  isVisible: boolean;
  hasTouchedTop: boolean;
};

@Component({
  selector: 'app-roles-permissions-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IbsModalShellComponent,
    IbsModalHeaderComponent,
    IbsModalTopBarComponent,
    IbsModalBodyComponent,
    IbsModalFooterComponent,
  ],
  templateUrl: './roles-permissions-modal.component.html',
  styleUrls: ['./roles-permissions-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPermissionsModalComponent implements OnInit, AfterViewInit {
  private readonly roleService = inject(RoleServiceProxy);
  private readonly rowIndentPx = 28;

  @ViewChild('treeContainer') treeContainerRef?: ElementRef<HTMLElement>;

  @Input({ required: true }) roleId!: number;
  @Input() roleName = '';
  @Input() roleDisplay = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly q = signal('');
  readonly error = signal<string | null>(null);

  readonly role = signal<RoleDto | null>(null);
  readonly allPermissions = signal<LocalPermission[]>([]);
  readonly modules = signal<ModuleVM[]>([]);
  readonly selectedModuleKey = signal<string>('');
  readonly openKeys = signal<Set<string>>(new Set<string>());
  readonly selectionTick = signal(0);

  readonly rowViewportMap = signal<Map<string, RowViewportState>>(new Map<string, RowViewportState>());
  readonly lastHiddenParentTitle = signal('');

  readonly selectedModule = computed(() => {
    return this.modules().find((m) => m.key === this.selectedModuleKey()) ?? null;
  });

  readonly selectedRoots = computed(() => this.selectedModule()?.roots ?? []);

  readonly currentNodeMap = computed(() => {
    const map = new Map<string, PermissionTreeVm>();

    const visit = (node: PermissionTreeVm): void => {
      map.set(node.key, node);
      for (const child of node.children ?? []) {
        visit(child);
      }
    };

    for (const root of this.selectedRoots()) {
      visit(root);
    }

    return map;
  });

  readonly visibleRows = computed(() => {
    const rows: PermissionRowVm[] = [];

    const visit = (node: PermissionTreeVm): void => {
      const isOpen = this.openKeys().has(node.key);
      const hasChildren = (node.children?.length ?? 0) > 0;

      rows.push({
        key: node.key,
        level: node.level,
        node,
        hasChildren,
        isOpen,
      });

      if (!hasChildren || !isOpen) {
        return;
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    for (const root of this.selectedRoots()) {
      visit(root);
    }

    return rows;
  });

  readonly allExpanded = computed(() => {
    const keys = this.collectExpandableKeys(this.selectedRoots());
    if (keys.length === 0) {
      return false;
    }

    const open = this.openKeys();
    return keys.every((k) => open.has(k));
  });

  readonly allSelected = computed(() => {
    this.selectionTick();
    const rows = this.visibleRows();

    if (rows.length === 0) {
      return false;
    }

    return rows.every((r) => r.node.perm.isGranted === true);
  });

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.queueViewportRefresh();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.queueViewportRefresh();
  }

  onClose(): void {
    this.cancelled.emit();
  }

  load(): void {
    if (!this.roleId || this.roleId <= 0) {
      this.error.set('No se recibió un roleId válido para cargar permisos.');
      this.role.set(null);
      this.allPermissions.set([]);
      this.modules.set([]);
      this.selectedModuleKey.set('');
      this.rowViewportMap.set(new Map<string, RowViewportState>());
      this.lastHiddenParentTitle.set('');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      role: this.roleService.get(this.roleId),
      roleForEdit: this.roleService.getRoleForEdit(this.roleId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ role, roleForEdit }) => {
          this.role.set(role);

          if (!this.roleName?.trim()) {
            this.roleName = role?.name ?? '';
          }

          if (!this.roleDisplay?.trim()) {
            this.roleDisplay = role?.displayName ?? '';
          }

          const permissions = this.buildPermissionStore(roleForEdit);
          this.allPermissions.set(permissions);

          this.rebuildModules(roleForEdit);
          this.ensureValidSelectedModule();
          this.bumpSelection();
          this.queueViewportRefresh();
        },
        error: (e) => {
          this.error.set(e?.message ?? 'Error cargando permisos del rol');
          this.role.set(null);
          this.allPermissions.set([]);
          this.modules.set([]);
          this.selectedModuleKey.set('');
          this.rowViewportMap.set(new Map<string, RowViewportState>());
          this.lastHiddenParentTitle.set('');
        },
      });
  }

  onSearch(value: string): void {
    this.q.set(value);
    this.rebuildModules();
    this.ensureValidSelectedModule();
    this.queueViewportRefresh();
  }

  selectModule(key: string): void {
    this.selectedModuleKey.set(key);
    this.rowViewportMap.set(new Map<string, RowViewportState>());
    this.lastHiddenParentTitle.set('');

    requestAnimationFrame(() => {
      const container = this.treeContainerRef?.nativeElement;
      if (container) {
        container.scrollTop = 0;
      }
      this.queueViewportRefresh();
    });
  }

  onTreeScroll(): void {
    this.queueViewportRefresh();
  }

  toggleNodeOpen(row: PermissionRowVm): void {
    if (!row.hasChildren) {
      return;
    }

    const next = new Set(this.openKeys());

    if (next.has(row.key)) {
      next.delete(row.key);
    } else {
      next.add(row.key);
    }

    this.openKeys.set(next);
    this.queueViewportRefresh();
  }

  toggleExpandChildren(row: PermissionRowVm): void {
    this.toggleNodeOpen(row);
  }

  toggleExpandAll(): void {
    const expandableKeys = this.collectExpandableKeys(this.selectedRoots());
    const next = new Set(this.openKeys());

    if (!this.allExpanded()) {
      for (const key of expandableKeys) {
        next.add(key);
      }
    } else {
      for (const key of expandableKeys) {
        next.delete(key);
      }
    }

    this.openKeys.set(next);
    this.queueViewportRefresh();
  }

  toggleSelectAll(): void {
    const nextValue = !this.allSelected();

    for (const row of this.visibleRows()) {
      row.node.perm.isGranted = nextValue;
    }

    this.bumpSelection();
  }

  toggleNodeSelection(row: PermissionRowVm, value: boolean): void {
    const permissionsToToggle = this.collectCascadePermissions(row.node);

    for (const permission of permissionsToToggle) {
      permission.isGranted = value;
    }

    this.bumpSelection();
  }

  rowIndent(row: PermissionRowVm): number {
    const rawIndent = this.rawIndent(row.level);
    const shiftLevels = this.getShiftLevelsForRow(row);
    const effectiveShift = shiftLevels * this.rowIndentPx;

    return Math.max(rawIndent - effectiveShift, 0);
  }

  rawIndent(level: number): number {
    return Math.max(level, 0) * this.rowIndentPx;
  }

  trackModule(_: number, module: ModuleVM): string {
    return module.key;
  }

  trackRow(_: number, row: PermissionRowVm): string {
    return row.key;
  }

  saveAll(): void {
    const currentRole = this.role();
    if (!currentRole) {
      this.error.set('No fue posible cargar el rol a actualizar.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const grantedPermissions = (this.allPermissions() ?? [])
      .filter((p) => p.isGranted === true)
      .map((p) => p.name);

    const input = currentRole.clone();
    input.grantedPermissions = grantedPermissions;

    this.roleService
      .update(input)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.saved.emit(),
        error: (e) => this.error.set(e?.message ?? 'Error guardando permisos'),
      });
  }

  private getShiftLevelsForRow(row: PermissionRowVm): number {
    const viewportMap = this.rowViewportMap();
    const chain = this.getAncestorChain(row.node);

    let shiftLevels = 0;

    for (const ancestor of chain) {
      if (!this.nodeHasChildren(ancestor)) {
        continue;
      }

      const state = viewportMap.get(ancestor.key);
      if (state?.isVisible && state.hasTouchedTop) {
        shiftLevels += 1;
      }
    }

    if (row.hasChildren) {
      const selfState = viewportMap.get(row.key);
      if (selfState?.isVisible && selfState.hasTouchedTop) {
        shiftLevels += 1;
      }
    }

    return shiftLevels;
  }

  private getAncestorChain(node: PermissionTreeVm): PermissionTreeVm[] {
    const map = this.currentNodeMap();
    const chain: PermissionTreeVm[] = [];
    let currentParentKey = node.parentKey;

    while (currentParentKey) {
      const parent = map.get(currentParentKey);
      if (!parent) {
        break;
      }

      chain.unshift(parent);
      currentParentKey = parent.parentKey;
    }

    return chain;
  }

  private recomputeViewportState(): void {
    const container = this.treeContainerRef?.nativeElement;
    if (!container) {
      this.rowViewportMap.set(new Map<string, RowViewportState>());
      this.lastHiddenParentTitle.set('');
      return;
    }

    const rows = Array.from(container.querySelectorAll<HTMLElement>('.tree-row[data-row-key]'));
    const containerRect = container.getBoundingClientRect();

    const viewportMap = new Map<string, RowViewportState>();
    let lastTouchedParent = '';

    for (const rowEl of rows) {
      const key = rowEl.dataset['rowKey'] ?? '';
      const title = rowEl.dataset['rowTitle'] ?? '';
      const hasChildren = rowEl.dataset['hasChildren'] === 'true';
      const rect = rowEl.getBoundingClientRect();

      const isVisible = rect.bottom > containerRect.top && rect.top < containerRect.bottom;
      const hasTouchedTop = isVisible && rect.top <= containerRect.top + 1;

      viewportMap.set(key, {
        isVisible,
        hasTouchedTop,
      });

      if (hasChildren && hasTouchedTop) {
        lastTouchedParent = title;
      }
    }

    this.rowViewportMap.set(viewportMap);
    this.lastHiddenParentTitle.set(lastTouchedParent);
  }

  private queueViewportRefresh(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.recomputeViewportState();
      });
    });
  }

  private collectCascadePermissions(node: PermissionTreeVm): LocalPermission[] {
    const result: LocalPermission[] = [];
    const unique = new Set<string>();

    const push = (permission: LocalPermission): void => {
      if (!permission?.name || unique.has(permission.name)) {
        return;
      }

      unique.add(permission.name);
      result.push(permission);
    };

    const visitVisibleBranch = (current: PermissionTreeVm): void => {
      push(current.perm);

      const isExpanded = this.openKeys().has(current.key);
      if (!isExpanded) {
        return;
      }

      for (const child of current.children ?? []) {
        visitVisibleBranch(child);
      }
    };

    push(node.perm);

    if (!this.openKeys().has(node.key)) {
      return result;
    }

    for (const child of node.children ?? []) {
      visitVisibleBranch(child);
    }

    return result;
  }

  private ensureValidSelectedModule(): void {
    const current = this.selectedModuleKey();
    const exists = this.modules().some((m) => m.key === current);

    if (!exists) {
      this.selectedModuleKey.set(this.modules()[0]?.key ?? '');
    }
  }

  private rebuildModules(sourceData?: GetRoleForEditOutput): void {
    const treeSource = sourceData?.permissionsTree ?? [];
    const baseModules =
      treeSource.length > 0
        ? this.buildModulesFromTree(treeSource)
        : this.buildModulesFromFlat(this.allPermissions());

    const term = (this.q() ?? '').trim().toLowerCase();
    const modules: ModuleVM[] = [];
    const autoOpen = new Set(this.openKeys());

    for (const module of baseModules) {
      const filteredRoots = this.filterTree(module.roots, term, autoOpen, 0, null);
      const count = this.countTreeNodes(filteredRoots);

      if (term && count === 0) {
        continue;
      }

      modules.push({
        key: module.key,
        title: module.title,
        count,
        roots: filteredRoots,
      });
    }

    modules.sort((a, b) => a.title.localeCompare(b.title));
    this.modules.set(modules);

    if (term) {
      this.openKeys.set(autoOpen);
    }
  }

  private buildModulesFromTree(tree: PermissionTreeDto[]): ModuleVM[] {
    const modules: ModuleVM[] = [];

    for (const root of tree ?? []) {
      if (!root?.name) {
        continue;
      }

      const vm = this.mapTreeNode(root, 0, null);
      modules.push({
        key: vm.key,
        title: vm.title,
        count: this.countTreeNodes([vm]),
        roots: [vm],
      });
    }

    return modules;
  }

  private buildModulesFromFlat(perms: LocalPermission[]): ModuleVM[] {
    const grouped = new Map<string, LocalPermission[]>();

    for (const permission of perms ?? []) {
      if (!permission?.name) {
        continue;
      }

      const rootKey = this.extractRootKey(permission.name);
      if (!grouped.has(rootKey)) {
        grouped.set(rootKey, []);
      }
      grouped.get(rootKey)!.push(permission);
    }

    const modules: ModuleVM[] = [];

    for (const [rootKey, groupedPermissions] of grouped.entries()) {
      const roots = this.buildTreeFromFlat(groupedPermissions);
      const title = roots[0]?.title?.trim() || rootKey;

      modules.push({
        key: rootKey,
        title,
        count: this.countTreeNodes(roots),
        roots,
      });
    }

    return modules;
  }

  private mapTreeNode(
    node: PermissionTreeDto,
    level: number,
    parentKey: string | null
  ): PermissionTreeVm {
    const permission: LocalPermission = {
      name: (node.name ?? '').toString(),
      displayName: (node.displayName ?? node.name ?? 'Permiso').toString(),
      description: node.description ?? undefined,
      isGranted: node.isGranted === true,
    };

    const currentKey = permission.name;

    const children = (node.children ?? [])
      .filter((x) => !!x?.name)
      .map((x) => this.mapTreeNode(x, level + 1, currentKey))
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      key: currentKey,
      title: permission.displayName,
      perm: permission,
      children,
      level,
      visibleChildrenCount: children.length,
      searchMatch: false,
      parentKey,
    };
  }

  private buildTreeFromFlat(perms: LocalPermission[]): PermissionTreeVm[] {
    const map = new Map<string, PermissionTreeVm>();
    const roots: PermissionTreeVm[] = [];

    for (const permission of perms ?? []) {
      if (!permission?.name) {
        continue;
      }

      map.set(permission.name, {
        key: permission.name,
        title: permission.displayName || permission.name,
        perm: permission,
        children: [],
        level: 0,
        visibleChildrenCount: 0,
        searchMatch: false,
        parentKey: null,
      });
    }

    for (const node of map.values()) {
      const parentName = this.getExistingParentName(node.key, map);
      if (!parentName) {
        roots.push(node);
        continue;
      }

      node.parentKey = parentName;
      map.get(parentName)?.children.push(node);
    }

    const applyLevels = (
      nodes: PermissionTreeVm[],
      level: number,
      parentKey: string | null
    ): PermissionTreeVm[] => {
      return nodes
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((node) => {
          const nextNode: PermissionTreeVm = {
            ...node,
            level,
            parentKey,
            children: [],
          };

          nextNode.children = applyLevels(node.children, level + 1, nextNode.key);
          nextNode.visibleChildrenCount = nextNode.children.length;

          return nextNode;
        });
    };

    return applyLevels(roots, 0, null);
  }

  private filterTree(
    nodes: PermissionTreeVm[],
    termLower: string,
    autoOpen: Set<string>,
    level: number,
    parentKey: string | null
  ): PermissionTreeVm[] {
    const filtered: PermissionTreeVm[] = [];

    for (const node of nodes ?? []) {
      const ownMatch = !termLower || this.nodeMatches(node, termLower);
      const filteredChildren = this.filterTree(
        node.children,
        termLower,
        autoOpen,
        level + 1,
        node.key
      );
      const isVisible = !termLower || ownMatch || filteredChildren.length > 0;

      if (!isVisible) {
        continue;
      }

      if (termLower && filteredChildren.length > 0) {
        autoOpen.add(node.key);
      }

      filtered.push({
        ...node,
        level,
        parentKey,
        searchMatch: ownMatch,
        visibleChildrenCount: filteredChildren.length,
        children: filteredChildren,
      });
    }

    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  private nodeMatches(node: PermissionTreeVm, termLower: string): boolean {
    const byName = (node.perm.name ?? '').toLowerCase();
    const byTitle = (node.perm.displayName ?? '').toLowerCase();
    const byDescription = (node.perm.description ?? '').toLowerCase();

    return (
      byName.includes(termLower) ||
      byTitle.includes(termLower) ||
      byDescription.includes(termLower)
    );
  }

  private collectExpandableKeys(nodes: PermissionTreeVm[]): string[] {
    const keys: string[] = [];

    const visit = (node: PermissionTreeVm): void => {
      if ((node.children?.length ?? 0) > 0) {
        keys.push(node.key);
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    for (const node of nodes ?? []) {
      visit(node);
    }

    return keys;
  }

  private countTreeNodes(nodes: PermissionTreeVm[]): number {
    let count = 0;

    const visit = (node: PermissionTreeVm): void => {
      count += 1;
      for (const child of node.children) {
        visit(child);
      }
    };

    for (const node of nodes ?? []) {
      visit(node);
    }

    return count;
  }

  private getExistingParentName(
    permissionName: string,
    map: Map<string, PermissionTreeVm>
  ): string | null {
    let current = permissionName;

    while (true) {
      const index = current.lastIndexOf('.');
      if (index <= 0) {
        return null;
      }

      current = current.substring(0, index);
      if (map.has(current)) {
        return current;
      }
    }
  }

  private extractRootKey(permissionName: string): string {
    const value = (permissionName ?? '').trim();
    if (!value) {
      return 'General';
    }

    const idx = value.indexOf('.');
    return idx > 0 ? value.substring(0, idx) : value;
  }

  private buildPermissionStore(data: GetRoleForEditOutput): LocalPermission[] {
    const fromTree = this.flattenFromTree(data?.permissionsTree ?? []);
    if (fromTree.length > 0) {
      return fromTree;
    }

    const granted = new Set(
      (data?.grantedPermissionNames ?? []).map((x) => (x ?? '').toString())
    );

    return (data?.permissions ?? [])
      .filter((p) => !!p?.name)
      .map((p: FlatPermissionDto) => ({
        name: (p.name ?? '').toString(),
        displayName: (p.displayName ?? p.name ?? 'Permiso').toString(),
        description: p.description ?? undefined,
        isGranted: granted.has((p.name ?? '').toString()),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  private flattenFromTree(tree: PermissionTreeDto[]): LocalPermission[] {
    const out: LocalPermission[] = [];

    const visit = (node: PermissionTreeDto | undefined): void => {
      if (!node?.name) {
        return;
      }

      out.push({
        name: (node.name ?? '').toString(),
        displayName: (node.displayName ?? node.name ?? 'Permiso').toString(),
        description: node.description ?? undefined,
        isGranted: node.isGranted === true,
      });

      for (const child of node.children ?? []) {
        visit(child);
      }
    };

    for (const root of tree ?? []) {
      visit(root);
    }

    const unique = new Map<string, LocalPermission>();

    for (const permission of out) {
      if (!permission.name) {
        continue;
      }
      unique.set(permission.name, permission);
    }

    return Array.from(unique.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }

  private nodeHasChildren(node: PermissionTreeVm | null | undefined): boolean {
    return (node?.children?.length ?? 0) > 0;
  }

  private bumpSelection(): void {
    this.selectionTick.update((v) => v + 1);
  }
}