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
import { AppTenantBrandingService } from '@shared/TenantBranding/app-tenant-branding.service';

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

  private readonly STORAGE_KEYS = {
    theme: 'ib-theme',
    sidebarPinned: 'ibs-layout.sidebar-pinned',
    selectedModule: 'ibs-layout.selected-module',
    lastRoute: 'ibs-layout.last-route',
  } as const;

  logoUrl$ = this._appTenantBrandingService.logoUrl$;
  companyDescription$ = this._appTenantBrandingService.companyDescription$;
  companyName$ = this._appTenantBrandingService.companyName$;
  companyType$ = this._appTenantBrandingService.companyType$;

  constructor(
    injector: Injector,
    private router: Router,
    private auth: AppAuthService,
    private _appTenantBrandingService: AppTenantBrandingService
  ) {
    super(injector);
    this.loadCurrentTenantLogo();
  }

  // ===== UI =====
  readonly sidebarCollapsed = signal<boolean>(true);
  readonly mobileSidebarOpen = signal<boolean>(false);
  readonly sidebarPinned = signal<boolean>(this.readSidebarPinned());
  readonly isMobile = signal<boolean>(window.innerWidth <= 991);

  readonly selectedModuleKey = signal<IbsModuleKey>(this.readStoredModuleKey());
  readonly search = signal<string>('');
  readonly openGroups = signal<Record<string, boolean>>({});

  // Dropdowns
  readonly modulePickerOpen = signal<boolean>(false);
  @ViewChild('modulePickerRoot', { static: false }) modulePickerRoot?: ElementRef<HTMLElement>;
  @ViewChild('userMenuRoot', { static: false }) userMenuRoot?: ElementRef<HTMLElement>;

  // User
  readonly currentUser = signal<any | null>(null);

  // Menu source
  readonly modules = signal<IbsNavModule[]>(IBS_NAV_MODULES);

  // Theme
  readonly theme = signal<'dark' | 'light'>(this.readTheme());

  // User menu
  readonly userMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.currentUser.set(this.appSession.user);

    this.applyResponsiveState(window.innerWidth);
    this.restoreInitialNavigationState();

    this.sub.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e) => {
          const nav = e as NavigationEnd;
          const url = this.normalizeUrl(nav.urlAfterRedirects || nav.url);

          this.persistLastRoute(url);
          this.syncModuleStateWithUrl(url);
          this.syncOpenGroupsWithUrl(url);

          this.mobileSidebarOpen.set(false);
          this.modulePickerOpen.set(false);
          this.userMenuOpen.set(false);
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

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
    if (this.isMobile()) return;
    if (!this.sidebarPinned()) this.sidebarCollapsed.set(false);
  }

  onSidebarLeave(): void {
    if (this.isMobile()) return;
    if (!this.sidebarPinned()) this.sidebarCollapsed.set(true);
  }

  togglePinSidebar(): void {
    if (this.isMobile()) {
      this.mobileSidebarOpen.update(v => !v);
      return;
    }

    const next = !this.sidebarPinned();
    this.sidebarPinned.set(next);
    this.persistSidebarPinned(next);
    this.sidebarCollapsed.set(!next);
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.toggleMobileSidebar();
      return;
    }

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
  selectModule(moduleKey: IbsModuleKey, navigateToDefault = false): void {
    if (!this.isMobile() && this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
    }

    this.selectedModuleKey.set(moduleKey);
    this.persistSelectedModule(moduleKey);

    this.search.set('');
    this.openFirstGroup();

    if (navigateToDefault) {
      const targetRoute = this.getDefaultRouteForModule(moduleKey);
      if (targetRoute) {
        this.router.navigateByUrl(targetRoute);
      }
    }

    if (this.isMobile()) {
      this.mobileSidebarOpen.set(false);
    }
  }

  setSearch(v: string): void {
    this.search.set(v ?? '');
  }

  // ===== Module Picker =====
  toggleModulePicker(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();

    if (!this.isMobile() && this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
    }

    this.modulePickerOpen.update(v => !v);
  }

  closeModulePicker(): void {
    this.modulePickerOpen.set(false);
  }

  onModulePick(key: IbsModuleKey): void {
    this.selectModule(key, true);
    this.closeModulePicker();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    const width = (event.target as Window)?.innerWidth ?? window.innerWidth;
    this.applyResponsiveState(width);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const target = ev.target as Node | null;

    if (this.modulePickerOpen()) {
      const moduleRoot = this.modulePickerRoot?.nativeElement;
      if (!moduleRoot || !target || !moduleRoot.contains(target)) {
        this.closeModulePicker();
      }
    }

    if (this.userMenuOpen()) {
      const userRoot = this.userMenuRoot?.nativeElement;
      if (!userRoot || !target || !userRoot.contains(target)) {
        this.closeUserMenu();
      }
    }
  }

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

    if (this.mobileSidebarOpen()) {
      this.closeMobileSidebar();
      handled = true;
    }

    if (handled) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  // ===== Group helpers =====
  isGroup(item: IbsNavItem): boolean {
    return !!item.children?.length;
  }

  hasRoute(item: IbsNavItem): boolean {
    return !!item.route;
  }

  toggleGroup(id: string): void {
    if (!this.isMobile() && this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
    }

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

  // ===== Theme API =====
  isLightTheme(): boolean {
    return this.theme() === 'light';
  }

  toggleGlobalTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(this.STORAGE_KEYS.theme, next);
  }

  private readTheme(): 'dark' | 'light' {
    const saved = localStorage.getItem(this.STORAGE_KEYS.theme) as 'dark' | 'light' | null;

    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      return saved;
    }

    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
    const initial = prefersLight ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', initial);
    return initial;
  }

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

  private filterItemByPermission(item: IbsNavItem): IbsNavItem | null {
    if (!item.children?.length) {
      return !item.requiredPolicy || this.isGranted(item.requiredPolicy) ? item : null;
    }

    const children = item.children
      .map(c => this.filterItemByPermission(c))
      .filter((x): x is IbsNavItem => !!x);

    if (children.length === 0 && !item.route) return null;
    if (item.requiredPolicy && !this.isGranted(item.requiredPolicy)) return null;

    return { ...item, children };
  }

  private filterItemBySearch(item: IbsNavItem, q: string): IbsNavItem | null {
    const selfMatch = (item.text ?? '').toLowerCase().includes(q);

    if (!item.children?.length) {
      return selfMatch ? item : null;
    }

    const children = item.children
      .map(c => this.filterItemBySearch(c, q))
      .filter((x): x is IbsNavItem => !!x);

    if (selfMatch) return { ...item, children: item.children };
    if (children.length === 0) return null;

    return { ...item, children };
  }

  private normalizeTenantName(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  private loadCurrentTenantLogo(): void {
    const savedTenantName = localStorage.getItem('ibs_tenancy_name');
    const normalized = this.normalizeTenantName(savedTenantName);

    if (!normalized) {
      this._appTenantBrandingService.clear();
      return;
    }

    this._appTenantBrandingService.loadCurrentTenantLogo().subscribe({
      next: () => {},
      error: () => this._appTenantBrandingService.clear(),
    });
  }

  private openFirstGroup(): void {
    const firstGroup = this.findFirstGroup(this.filteredItems());
    this.openGroups.set(firstGroup ? { [firstGroup.id]: true } : {});
  }

  private syncOpenGroupsWithUrl(url: string): void {
    const ids = this.findOpenGroupIdsByUrl(this.filteredItems(), url);

    if (ids.length > 0) {
      const next: Record<string, boolean> = {};
      for (const id of ids) next[id] = true;
      this.openGroups.set(next);
      return;
    }

    this.openFirstGroup();
  }

  toggleUserMenu(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();

    if (!this.userMenuOpen()) {
      this.modulePickerOpen.set(false);
    }

    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  private applyResponsiveState(width: number): void {
    const mobile = width <= 991;
    this.isMobile.set(mobile);

    if (mobile) {
      this.sidebarCollapsed.set(false);
      return;
    }

    this.mobileSidebarOpen.set(false);
    this.sidebarCollapsed.set(!this.sidebarPinned());
  }

  private restoreInitialNavigationState(): void {
    const currentUrl = this.normalizeUrl(this.router.url);

    this.syncModuleStateWithUrl(currentUrl);
    this.syncOpenGroupsWithUrl(currentUrl);

    if (this.shouldRestoreLastRoute(currentUrl)) {
      const lastRoute = this.readStoredLastRoute();
      if (lastRoute) {
        this.router.navigateByUrl(lastRoute);
        return;
      }
    }

    const matchedModule = this.findModuleByUrl(currentUrl);
    if (!matchedModule) {
      const storedModule = this.readStoredModuleKey();
      this.selectModule(storedModule, false);
    }
  }

  private shouldRestoreLastRoute(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    return normalized === '/' || normalized === '' || normalized === '/app';
  }

  private syncModuleStateWithUrl(url: string): void {
    const matchedModule = this.findModuleByUrl(url);
    if (matchedModule) {
      this.selectedModuleKey.set(matchedModule.key);
      this.persistSelectedModule(matchedModule.key);
      return;
    }

    const storedModule = this.readStoredModuleKey();
    this.selectedModuleKey.set(storedModule);
  }

  private findModuleByUrl(url: string): IbsNavModule | null {
    const normalizedUrl = this.normalizeUrl(url);

    for (const module of this.visibleModules()) {
      if (this.moduleContainsRoute(module.items, normalizedUrl)) {
        return module;
      }
    }

    return null;
  }

  private moduleContainsRoute(items: IbsNavItem[], url: string): boolean {
    for (const item of items) {
      if (item.route && this.routeMatches(url, item.route)) {
        return true;
      }

      if (item.children?.length && this.moduleContainsRoute(item.children, url)) {
        return true;
      }
    }

    return false;
  }

  private getDefaultRouteForModule(moduleKey: IbsModuleKey): string | null {
    const module = this.visibleModules().find(m => m.key === moduleKey);
    if (!module) return null;

    if (module.defaultRoute) return module.defaultRoute;

    return this.findFirstNavigableRoute(module.items);
  }

  private findFirstNavigableRoute(items: IbsNavItem[]): string | null {
    for (const item of items) {
      if (item.route) return item.route;

      if (item.children?.length) {
        const childRoute = this.findFirstNavigableRoute(item.children);
        if (childRoute) return childRoute;
      }
    }

    return null;
  }

  private findFirstGroup(items: IbsNavItem[]): IbsNavItem | null {
    for (const item of items) {
      if (this.isGroup(item)) return item;
    }

    return null;
  }

  private findOpenGroupIdsByUrl(items: IbsNavItem[], url: string, parents: string[] = []): string[] {
    for (const item of items) {
      const currentParents = this.isGroup(item) ? [...parents, item.id] : [...parents];

      if (item.route && this.routeMatches(url, item.route)) {
        return parents;
      }

      if (item.children?.length) {
        const result = this.findOpenGroupIdsByUrl(item.children, url, currentParents);
        if (result.length > 0) return result;

        const hasDirectChildMatch = item.children.some(child => !!child.route && this.routeMatches(url, child.route!));
        if (hasDirectChildMatch) {
          return currentParents;
        }
      }
    }

    return [];
  }

  private routeMatches(currentUrl: string, itemRoute: string): boolean {
    const current = this.normalizeUrl(currentUrl);
    const target = this.normalizeUrl(itemRoute);

    return current === target || current.startsWith(`${target}/`);
  }

  private normalizeUrl(url: string): string {
    const value = (url ?? '').trim();
    if (!value) return '/';

    const clean = value.split('?')[0].split('#')[0];
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  private readSidebarPinned(): boolean {
    return localStorage.getItem(this.STORAGE_KEYS.sidebarPinned) === 'true';
  }

  private persistSidebarPinned(value: boolean): void {
    localStorage.setItem(this.STORAGE_KEYS.sidebarPinned, String(value));
  }

  private readStoredModuleKey(): IbsModuleKey {
    const stored = localStorage.getItem(this.STORAGE_KEYS.selectedModule) as IbsModuleKey | null;
    const valid = IBS_NAV_MODULES.some(m => m.key === stored);

    return valid && stored ? stored : 'core';
  }

  private persistSelectedModule(value: IbsModuleKey): void {
    localStorage.setItem(this.STORAGE_KEYS.selectedModule, value);
  }

  private persistLastRoute(url: string): void {
    const normalized = this.normalizeUrl(url);
    localStorage.setItem(this.STORAGE_KEYS.lastRoute, normalized);
  }

  private readStoredLastRoute(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.lastRoute);
  }
}