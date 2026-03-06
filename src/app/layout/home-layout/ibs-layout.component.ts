import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';

import {
  IBS_NAV_MODULES,
  IbsNavItem,
  IbsNavModule,
  IbsModuleKey,
} from './ibs-navigation';
import { AppComponentBase } from '../../../shared/app-component-base';
import { AppAuthService } from '../../../shared/auth/app-auth.service';

@Component({
  selector: 'app-ibs-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './ibs-layout.component.html',
  styleUrls: ['./ibs-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IbsLayoutComponent extends AppComponentBase implements OnInit, OnDestroy {
  private sub = new Subscription();

  constructor(
    injector: Injector,
    private router: Router,
    private auth: AppAuthService
  ) {
    super(injector);
  }

  // ===== UI =====
  readonly sidebarCollapsed = signal<boolean>(true);
  readonly mobileSidebarOpen = signal<boolean>(false);
  readonly sidebarPinned = signal<boolean>(false);

  readonly selectedModuleKey = signal<IbsModuleKey>('core');
  readonly search = signal<string>('');
  readonly openGroups = signal<Record<string, boolean>>({});

  // ✅ Dropdown Module Picker (Angular-controlled)
  readonly modulePickerOpen = signal<boolean>(false);
  @ViewChild('modulePickerRoot', { static: false }) modulePickerRoot?: ElementRef<HTMLElement>;
  @ViewChild('userMenuRoot', { static: false }) userMenuRoot?: ElementRef<HTMLElement>;
  // ===== USER =====
  readonly currentUser = signal<any | null>(null);

  // ===== MENU SOURCE =====
  readonly modules = signal<IbsNavModule[]>(IBS_NAV_MODULES);

  // ===== THEME =====
  readonly theme = signal<'dark' | 'light'>(this.readTheme());

  ngOnInit(): void {
    this.currentUser.set(this.appSession.user);

    // Auto-open: grupo que contenga la URL actual
    this.syncOpenGroupsWithUrl(this.router.url);

    this.sub.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e) => {
          const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
          this.syncOpenGroupsWithUrl(url);
          this.mobileSidebarOpen.set(false);

          // ✅ Si navegas, cierra el module picker también
          this.modulePickerOpen.set(false);
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ===== Computeds =====
  readonly visibleModules = computed(() => {
    const mods = this.modules();
    return mods.filter(m => !m.requiredPolicy || this.isGranted(m.requiredPolicy));
  });

  readonly selectedModule = computed(() => {
    const key = this.selectedModuleKey();
    const mods = this.visibleModules();
    return mods.find(m => m.key === key) ?? mods[0] ?? null;
  });

  readonly filteredItems = computed(() => {
    const mod = this.selectedModule();
    if (!mod) return [];

    const q = (this.search() ?? '').trim().toLowerCase();

    const items = (mod.items ?? [])
      .map(i => this.filterItemByPermission(i))
      .filter((x): x is IbsNavItem => !!x);

    if (!q) return items;

    return items
      .map(i => this.filterItemBySearch(i, q))
      .filter((x): x is IbsNavItem => !!x);
  });

  // ===== Sidebar hover/pin =====
  onSidebarEnter(): void {
    if (window.innerWidth <= 991) return;
    if (!this.sidebarPinned()) this.sidebarCollapsed.set(false);
  }

  onSidebarLeave(): void {
    if (window.innerWidth <= 991) return;
    if (!this.sidebarPinned()) this.sidebarCollapsed.set(true);
  }

  togglePinSidebar(): void {
    this.sidebarPinned.update(v => !v);

    if (this.sidebarPinned()) {
      this.sidebarCollapsed.set(false);
    } else {
      this.sidebarCollapsed.set(true);
    }
  }

  toggleSidebar(): void {
    if (this.sidebarPinned()) return;
    this.sidebarCollapsed.update(v => !v);
  }

  // ===== Mobile =====
  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  // ===== Module =====
  selectModule(moduleKey: IbsModuleKey): void {
    if (this.sidebarCollapsed()) this.sidebarCollapsed.set(false);

    this.selectedModuleKey.set(moduleKey);
    this.search.set('');
    this.openFirstGroup();
  }

  setSearch(v: string): void {
    this.search.set(v ?? '');
  }

  // ===== ✅ Module Picker Dropdown handlers (NO Bootstrap JS needed) =====
  toggleModulePicker(ev: MouseEvent): void {
    // IMPORTANT: evita que el click burbujee al document y lo cierre al instante
    ev.preventDefault();
    ev.stopPropagation();

    // Si sidebar está colapsado por hover, al abrir el picker asegúrate que se vea
    if (this.sidebarCollapsed()) this.sidebarCollapsed.set(false);

    this.modulePickerOpen.update(v => !v);
  }

  closeModulePicker(): void {
    this.modulePickerOpen.set(false);
  }

  onModulePick(key: IbsModuleKey): void {
    // Selecciona usando tu método actual
    this.selectModule(key);

    // Cierra el dropdown
    this.closeModulePicker();
  }

  // Click afuera: cerrar
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
     const target = ev.target as Node | null;

  // ===== Module picker =====
  if (this.modulePickerOpen()) {
    const moduleRoot = this.modulePickerRoot?.nativeElement;

    if (!moduleRoot || !target || !moduleRoot.contains(target)) {
      this.closeModulePicker();
    }
  }

  // ===== User menu =====
  if (this.userMenuOpen()) {
    const userRoot = this.userMenuRoot?.nativeElement;

    if (!userRoot || !target || !userRoot.contains(target)) {
      this.closeUserMenu();
    }
  }
  }

  // ESC: cerrar
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
     if (ev.key !== 'Escape') return;

  let handled = false;

  if (this.modulePickerOpen()) {
    this.closeModulePicker();
    handled = true;
  }

  if (this.userMenuOpen()) {
    this.closeUserMenu();
    handled = true;
  }

  if (handled) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  }

  // ===== Group helpers =====
  isGroup(item: IbsNavItem): boolean {
    return !!item.children && item.children.length > 0;
  }

  toggleGroup(id: string): void {
    if (this.sidebarCollapsed()) this.sidebarCollapsed.set(false);
    this.openGroups.update(x => ({ ...x, [id]: !x[id] }));
  }

  isOpen(id: string): boolean {
    return !!this.openGroups()[id];
  }

  // ===== User UI =====
  displayName(): string {
    const u = this.currentUser();
    if (!u) return 'Usuario';
    return (u.name || u.userName || u.emailAddress || u.email || 'Usuario').toString();
  }

  initials(): string {
    const name = this.displayName().trim();
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    const a = parts[0]?.[0] ?? 'U';
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (a + b).toUpperCase();
  }

  goMyAccount(): void {
    this.router.navigateByUrl('/app/admin/profile');
  }

  logout(): void {
    this.auth.logout();
  }

  // ===== Theme API (HTML usa esto) =====
  isLightTheme(): boolean {
    return this.theme() === 'light';
  }

  toggleGlobalTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ib-theme', next);
  }

  private readTheme(): 'dark' | 'light' {
    const saved = (localStorage.getItem('ib-theme') as 'dark' | 'light' | null);
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      return saved;
    }

    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
    const initial = prefersLight ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', initial);
    return initial;
  }

  // ===== Track functions usadas en HTML =====
  trackById = (_: number, x: { id: string }) => x.id;

  trackMenuItem(index: number, it: any): string {
    const id = (it?.id ?? '').toString().trim();
    const name = (it?.name ?? '').toString().trim();
    const path = (it?.path ?? '').toString().trim();
    const route = (it?.route ?? '').toString().trim();
    const text = (it?.text ?? '').toString().trim();

    if (id) return `id:${id}`;
    if (route) return `route:${route}`;
    if (path) return `path:${path}`;
    if (name) return `name:${name}#${index}`;
    if (text) return `text:${text}#${index}`;
    return `idx:${index}`;
  }

  // ===== Internal filters =====
  private filterItemByPermission(item: IbsNavItem): IbsNavItem | null {
    if (!item.children || item.children.length === 0) {
      return !item.requiredPolicy || this.isGranted(item.requiredPolicy) ? item : null;
    }

    const children = item.children
      .map(c => this.filterItemByPermission(c))
      .filter((x): x is IbsNavItem => !!x);

    if (children.length === 0) return null;

    if (item.requiredPolicy && !this.isGranted(item.requiredPolicy)) return null;

    return { ...item, children };
  }

  private filterItemBySearch(item: IbsNavItem, q: string): IbsNavItem | null {
    const selfMatch = (item.text ?? '').toLowerCase().includes(q);

    if (!item.children || item.children.length === 0) {
      return selfMatch ? item : null;
    }

    const children = item.children
      .map(c => this.filterItemBySearch(c, q))
      .filter((x): x is IbsNavItem => !!x);

    if (selfMatch) return item;
    if (children.length === 0) return null;

    return { ...item, children };
  }

  private openFirstGroup(): void {
    const items = this.filteredItems();
    const firstGroup = items.find(i => this.isGroup(i));
    this.openGroups.set(firstGroup ? { [firstGroup.id]: true } : {});
  }

  private syncOpenGroupsWithUrl(url: string): void {
    const items = this.filteredItems();
    const groupToOpen = this.findGroupContainingRoute(items, url);

    if (groupToOpen) {
      this.openGroups.update(x => ({ ...x, [groupToOpen.id]: true }));
    } else {
      this.openFirstGroup();
    }
  }

readonly userMenuOpen = signal<boolean>(false);

toggleUserMenu(ev: MouseEvent): void {
  ev.preventDefault();
  ev.stopPropagation();

  // si abre user menu, cerrar module picker
  if (!this.userMenuOpen()) {
    this.modulePickerOpen.set(false);
  }

  this.userMenuOpen.update(v => !v);
}

closeUserMenu(): void {
  this.userMenuOpen.set(false);
}

  private findGroupContainingRoute(items: IbsNavItem[], url: string): IbsNavItem | null {
    for (const item of items) {
      if (this.isGroup(item)) {
        const has = (item.children ?? []).some(c => !!c.route && url.startsWith(c.route));
        if (has) return item;
      }
      if (!!item.route && url.startsWith(item.route)) return null;
    }
    return null;
  }
}