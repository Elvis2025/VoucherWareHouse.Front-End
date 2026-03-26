import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  computed,
  signal,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Observable, of, finalize } from 'rxjs';

import {
  IbsDropdownComponent,
  IbsDropdownItem,
} from '../ibs-drop-down/ibs-dropdown.component';
import { AppComponentBase } from '../../../shared/app-component-base';

export type IbsAlign = 'left' | 'center' | 'right';
export type IbsLinkTarget = '_self' | '_blank';

export interface IbsGridColumn<T> {
  key?: string;
  header: string;
  width?: string;
  minWidth?: number;
  align?: IbsAlign;
  field?: keyof T | string;
  template?: TemplateRef<{ $implicit: T }>;
  sortable?: boolean;
  resizable?: boolean;
  showFullOnHover?: boolean;

  /**
   * Link normal
   */
  isLink?: boolean;

  /**
   * Link tipo QR
   */
  isQrCode?: boolean;

  /**
   * URL real del link.
   * Si no se define, se usa el valor del field.
   */
  linkUrl?: keyof T | string | ((row: T, value: any) => string | null | undefined);

  /**
   * Texto visible del link.
   * Si no se define o viene vacío, se usa el valor del field.
   */
  linkText?: keyof T | string | ((row: T, value: any) => string | null | undefined);

  /**
   * Target del link
   */
  linkTarget?: IbsLinkTarget;

  /**
   * Texto opcional de acción dentro del panel QR
   */
  qrActionText?: string;
}

type IbsGridResolvedColumn<T> = IbsGridColumn<T> & {
  key: string;
};

export interface IbsGridAction<T> {
  id: string;
  text: string;
  icon?: string;
  requiredPolicy?: string;
  danger?: boolean;
  disabled?: (row: T) => boolean;
  run: (row: T) => void;
}

export interface IbsPagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface IbsGridQuery {
  filter?: string;
  sorting?: string;
  skipCount: number;
  maxResultCount: number;
}

type HoverPanelState = {
  visible: boolean;
  text: string;
  label: string;
  top: number;
  left: number;
};

type QrPanelState = {
  visible: boolean;
  label: string;
  text: string;
  url: string;
  qrUrl: string;
  actionText: string;
};

@Component({
  selector: 'app-ibs-grid',
  standalone: true,
  imports: [CommonModule, IbsDropdownComponent],
  templateUrl: './ibs-grid.component.html',
  styleUrls: ['./ibs-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IbsGridComponent<T>
  extends AppComponentBase
  implements OnInit, OnChanges, OnDestroy
{
  constructor(injector: Injector) {
    super(injector);
  }

  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() placeholderSearch = 'Buscar...';

  @Input({ required: true }) columns: IbsGridColumn<T>[] = [];
  @Input({ required: true }) load!: (q: IbsGridQuery) => Observable<IbsPagedResult<T>>;

  @Input() actions: IbsGridAction<T>[] = [];
  @Input() createPolicy?: string;

  @Input() pageSizeOptions: number[] = [10, 20, 50];

  /**
   * Mínimo general para columnas normales resizeables.
   */
  @Input() columnMinWidth = 140;

  /**
   * Ancho constante para la columna de acciones.
   */
  @Input() actionsColumnWidth = 114;

  /**
   * Ancho constante para columnas tipo isActive/active/activo.
   */
  @Input() activeColumnWidth = 72;

  private _pageSize = 10;
  readonly pageSizeSig = signal(10);

  @Input()
  set pageSize(v: number) {
    const n = Number(v);
    this._pageSize = Number.isFinite(n) && n > 0 ? n : 10;
    this.pageSizeSig.set(this._pageSize);
  }
  get pageSize(): number {
    return this._pageSize;
  }

  @Input() showSearch = true;
  @Input() showCreateFab = true;
  @Input() toolsTemplate?: TemplateRef<any>;

  @Output() create = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly items = signal<T[]>([]);
  readonly totalCount = signal(0);

  readonly search = signal('');
  readonly pageIndex = signal(0);
  readonly sorting = signal<string | undefined>(undefined);

  readonly resizedWidths = signal<Record<string, number>>({});
  readonly resolvedColumns = signal<IbsGridResolvedColumn<T>[]>([]);

  readonly hoverPanel = signal<HoverPanelState>({
    visible: false,
    text: '',
    label: '',
    top: 0,
    left: 0,
  });

  readonly qrPanel = signal<QrPanelState>({
    visible: false,
    label: '',
    text: '',
    url: '',
    qrUrl: '',
    actionText: 'Navegar al enlace',
  });

  private resizingColumnKey: string | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private resizeMinWidth = 140;

  readonly pageCount = computed(() => {
    const total = this.totalCount();
    const size = this.pageSizeSig();
    return Math.max(1, Math.ceil(total / size));
  });

  readonly pageWheel = computed(() => {
    const count = this.pageCount();
    const current = this.pageIndex() + 1;

    const prev = current > 1 ? current - 1 : null;
    const next = current < count ? current + 1 : null;

    return [
      { p: prev, dist: -1 as const },
      { p: current, dist: 0 as const },
      { p: next, dist: 1 as const },
    ];
  });

  readonly canFirstJump = computed(() => {
    const count = this.pageCount();
    const idx = this.pageIndex();
    if (count <= 2) return false;
    return idx >= 2;
  });

  readonly canLastJump = computed(() => {
    const count = this.pageCount();
    const idx = this.pageIndex();
    if (count <= 2) return false;
    const pagesAfter = count - 1 - idx;
    return pagesAfter >= 2;
  });

  readonly canCreate = computed(() => {
    if (!this.showCreateFab) return false;
    if (!this.createPolicy) return true;
    return this.isGranted(this.createPolicy);
  });

  readonly visibleActions = computed(() => {
    const all = this.actions ?? [];
    return all.filter(a => !a.requiredPolicy || this.isGranted(a.requiredPolicy));
  });

  ngOnInit(): void {
    this.pageSizeSig.set(this.pageSize);
    this.normalizeColumns();
    this.fetch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.normalizeColumns();
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('ibs-grid-resizing');
    document.body.classList.remove('ibs-grid-qr-open');
  }

  private normalizeColumns(): void {
    const input = Array.isArray(this.columns) ? this.columns : [];

    const normalized = input.map((col, index) => {
      const autoKey = this.buildColumnAutoKey(col, index);

      return {
        ...col,
        key: (col.key ?? autoKey).trim(),
      } as IbsGridResolvedColumn<T>;
    });

    this.resolvedColumns.set(normalized);
  }

  private buildColumnAutoKey(col: IbsGridColumn<T>, index: number): string {
    const raw =
      String(col.field ?? '').trim() ||
      String(col.header ?? '').trim() ||
      `col-${index + 1}`;

    const normalized = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, '-')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return normalized || `col-${index + 1}`;
  }

  pageSizeItems(): IbsDropdownItem[] {
    return (this.pageSizeOptions ?? []).map(n => ({
      id: String(n),
      text: String(n),
      run: () => this.setPageSize(n),
    }));
  }

  fetch(): void {
    this.loading.set(true);

    const q: IbsGridQuery = {
      filter: (this.search() ?? '').trim() || undefined,
      sorting: this.sorting(),
      skipCount: this.pageIndex() * this.pageSizeSig(),
      maxResultCount: this.pageSizeSig(),
    };

    (this.load ? this.load(q) : of({ items: [], totalCount: 0 }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        this.items.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
      });
  }

  setSearch(v: string): void {
    this.search.set(v ?? '');
    this.pageIndex.set(0);
    this.fetch();
  }

  refresh(): void {
    this.fetch();
  }

  reload(): void {
    this.fetch();
  }

  reloadFirstPage(): void {
    this.pageIndex.set(0);
    this.fetch();
  }

  setPageSize(v: number): void {
    this.pageSize = v;
    this.pageIndex.set(0);
    this.fetch();
  }

  prev(): void {
    if (this.pageIndex() <= 0) return;
    this.pageIndex.update(x => x - 1);
    this.fetch();
  }

  next(): void {
    if (this.pageIndex() >= this.pageCount() - 1) return;
    this.pageIndex.update(x => x + 1);
    this.fetch();
  }

  first(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.set(0);
    this.fetch();
  }

  last(): void {
    const lastIdx = this.pageCount() - 1;
    if (this.pageIndex() >= lastIdx) return;
    this.pageIndex.set(lastIdx);
    this.fetch();
  }

  goToPage(oneBased: number): void {
    const idx = Math.max(0, Math.min(this.pageCount() - 1, (oneBased ?? 1) - 1));
    if (idx === this.pageIndex()) return;
    this.pageIndex.set(idx);
    this.fetch();
  }

  onCreate(): void {
    this.create.emit();
  }

  trackByIndex = (i: number) => i;
  trackByColumn = (_: number, c: IbsGridResolvedColumn<T>) => c.key;

  isBooleanValue(v: any): boolean {
    return typeof v === 'boolean';
  }

  cellValue(row: any, c: IbsGridResolvedColumn<T>): any {
    const key = (c.field ?? c.key) as string;
    if (!key) return '';

    if (key.includes('.')) {
      return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), row) ?? '';
    }

    return row?.[key] ?? '';
  }

  cellDisplayValue(row: any, c: IbsGridResolvedColumn<T>): string {
    const value = this.cellValue(row, c);

    if (this.isBooleanValue(value)) {
      return value ? 'Sí' : 'No';
    }

    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }

  rowActionItems(row: T): IbsDropdownItem[] {
    return (this.visibleActions() ?? []).map(a => ({
      id: a.id,
      text: a.text,
      icon: a.icon,
      danger: a.danger,
      disabled: a.disabled?.(row) ?? false,
      run: () => a.run(row),
    }));
  }

  openRowId: string | null = null;
  dropdownPos = { top: 0, left: 0 };

  toggleActions(rowId: string, ev: MouseEvent) {
    ev.stopPropagation();

    if (this.openRowId === rowId) {
      this.closeActions();
      return;
    }

    const btn = ev.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();

    this.dropdownPos = {
      top: rect.bottom + 8,
      left: rect.left,
    };

    this.openRowId = rowId;
  }

  closeActions() {
    this.openRowId = null;
  }

  private normalizeIdentity(value?: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  isActiveLikeColumn(c: IbsGridResolvedColumn<T>): boolean {
    const key = this.normalizeIdentity(c.key);
    const field = this.normalizeIdentity(String(c.field ?? ''));
    const header = this.normalizeIdentity(c.header);

    return (
      key === 'isactive' ||
      key === 'active' ||
      key === 'activo' ||
      field === 'isactive' ||
      field === 'active' ||
      field === 'activo' ||
      header === 'activo' ||
      header === 'active'
    );
  }

  isColumnResizable(c: IbsGridResolvedColumn<T>): boolean {
    if (this.isActiveLikeColumn(c)) return false;
    return c.resizable !== false;
  }

  getColumnMinWidth(c: IbsGridResolvedColumn<T>): number {
    if (this.isActiveLikeColumn(c)) {
      return this.activeColumnWidth;
    }

    const colMin = Number(c.minWidth);
    const globalMin = Number(this.columnMinWidth);

    const safeColMin = Number.isFinite(colMin) && colMin > 0 ? colMin : undefined;
    const safeGlobalMin = Number.isFinite(globalMin) && globalMin > 0 ? globalMin : 140;

    return Math.max(80, safeColMin ?? safeGlobalMin);
  }

  private parsePxWidth(value?: string): number | null {
    if (!value) return null;

    const v = value.trim().toLowerCase();

    if (!v.endsWith('px')) return null;

    const n = Number(v.replace('px', '').trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  getColumnCurrentWidth(c: IbsGridResolvedColumn<T>): number | null {
    if (this.isActiveLikeColumn(c)) {
      return this.activeColumnWidth;
    }

    const manual = this.resizedWidths()[c.key];
    if (Number.isFinite(manual) && manual > 0) {
      return manual;
    }

    return this.parsePxWidth(c.width);
  }

  getColumnFixedWidth(c: IbsGridResolvedColumn<T>): string | null {
    if (this.isActiveLikeColumn(c)) {
      return `${this.activeColumnWidth}px`;
    }

    const manual = this.resizedWidths()[c.key];
    if (Number.isFinite(manual) && manual > 0) {
      return `${manual}px`;
    }

    return c.width?.trim() || null;
  }

  hasStrictWidth(c: IbsGridResolvedColumn<T>): boolean {
    return !!this.getColumnFixedWidth(c);
  }

  getColumnStyle(c: IbsGridResolvedColumn<T>): Record<string, string | null> {
    const fixedWidth = this.getColumnFixedWidth(c);

    if (fixedWidth) {
      return {
        width: fixedWidth,
        minWidth: fixedWidth,
        maxWidth: fixedWidth,
      };
    }

    return {
      width: null,
      minWidth: `${this.getColumnMinWidth(c)}px`,
      maxWidth: null,
    };
  }

  getActionsColumnStyle(): Record<string, string> {
    const width = `${this.actionsColumnWidth}px`;
    return {
      width,
      minWidth: width,
      maxWidth: width,
    };
  }

  startResize(c: IbsGridResolvedColumn<T>, event: MouseEvent, th: HTMLElement): void {
    if (!this.isColumnResizable(c)) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = th.getBoundingClientRect();

    this.resizingColumnKey = c.key;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = rect.width;
    this.resizeMinWidth = this.getColumnMinWidth(c);

    document.body.classList.add('ibs-grid-resizing');
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    if (!this.resizingColumnKey) return;

    const delta = event.clientX - this.resizeStartX;
    const nextWidth = Math.max(
      this.resizeMinWidth,
      Math.round(this.resizeStartWidth + delta)
    );

    this.resizedWidths.update(state => ({
      ...state,
      [this.resizingColumnKey as string]: nextWidth,
    }));
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    if (!this.resizingColumnKey) return;

    this.resizingColumnKey = null;
    document.body.classList.remove('ibs-grid-resizing');
  }

  showHoverPanel(event: MouseEvent, row: T, c: IbsGridResolvedColumn<T>): void {
    if (!c.showFullOnHover) return;
    if (this.isLinkColumn(c) || this.isQrColumn(c)) return;

    const text = this.cellDisplayValue(row, c)?.trim();
    if (!text) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const panelWidth = 360;
    const viewportPadding = 12;

    let left = rect.left;
    const maxLeft = window.innerWidth - panelWidth - viewportPadding;
    if (left > maxLeft) {
      left = Math.max(viewportPadding, maxLeft);
    }

    let top = rect.bottom + 10;
    const estimatedHeight = 110;
    if (top + estimatedHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, rect.top - estimatedHeight - 10);
    }

    this.hoverPanel.set({
      visible: true,
      text,
      label: c.header,
      top,
      left,
    });
  }

  hideHoverPanel(): void {
    const current = this.hoverPanel();
    if (!current.visible) return;

    this.hoverPanel.set({
      visible: false,
      text: '',
      label: '',
      top: 0,
      left: 0,
    });
  }

  isLinkColumn(c: IbsGridResolvedColumn<T>): boolean {
    return c.isLink === true && c.isQrCode !== true;
  }

  isQrColumn(c: IbsGridResolvedColumn<T>): boolean {
    return c.isQrCode === true;
  }

  private resolveValueByPath(source: any, key?: keyof T | string): any {
    const path = String(key ?? '').trim();
    if (!path) return null;

    if (path.includes('.')) {
      return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), source) ?? null;
    }

    return source?.[path] ?? null;
  }

  resolveLinkUrl(row: T, c: IbsGridResolvedColumn<T>): string {
    const value = this.cellValue(row, c);

    if (typeof c.linkUrl === 'function') {
      return String(c.linkUrl(row, value) ?? '').trim();
    }

    if (typeof c.linkUrl === 'string' && c.linkUrl.trim()) {
      return String(this.resolveValueByPath(row, c.linkUrl) ?? '').trim();
    }

    return String(value ?? '').trim();
  }

  resolveLinkText(row: T, c: IbsGridResolvedColumn<T>): string {
    const value = this.cellValue(row, c);
    let resolved: any = null;

    if (typeof c.linkText === 'function') {
      resolved = c.linkText(row, value);
    } else if (typeof c.linkText === 'string' && c.linkText.trim()) {
      resolved = this.resolveValueByPath(row, c.linkText);
    }

    const text = String(resolved ?? '').trim();
    if (text) {
      return text;
    }

    return this.cellDisplayValue(row, c);
  }

  resolveLinkTarget(c: IbsGridResolvedColumn<T>): IbsLinkTarget {
    return c.linkTarget ?? '_blank';
  }

  hasValidLink(row: T, c: IbsGridResolvedColumn<T>): boolean {
    const url = this.resolveLinkUrl(row, c);
    return !!url;
  }

  openLink(event: MouseEvent, row: T, c: IbsGridResolvedColumn<T>): void {
    event.preventDefault();
    event.stopPropagation();

    const url = this.resolveLinkUrl(row, c);
    if (!url) return;

    const target = this.resolveLinkTarget(c);
    window.open(url, target, target === '_blank' ? 'noopener,noreferrer' : undefined);
  }

  openQrPanel(event: MouseEvent, row: T, c: IbsGridResolvedColumn<T>): void {
    event.preventDefault();
    event.stopPropagation();

    const text = this.resolveLinkText(row, c)?.trim();
    const url = this.resolveLinkUrl(row, c)?.trim();

    if (!url) return;

    const qrUrl =
      'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' +
      encodeURIComponent(url);

    this.qrPanel.set({
      visible: true,
      label: c.header,
      text: text || url,
      url,
      qrUrl,
      actionText: c.qrActionText?.trim() || 'Navegar al enlace',
    });

    document.body.classList.add('ibs-grid-qr-open');
  }

  closeQrPanel(): void {
    const current = this.qrPanel();
    if (!current.visible) return;

    this.qrPanel.set({
      visible: false,
      label: '',
      text: '',
      url: '',
      qrUrl: '',
      actionText: 'Navegar al enlace',
    });

    document.body.classList.remove('ibs-grid-qr-open');
  }

  openQrNavigation(): void {
    const current = this.qrPanel();
    if (!current.url) return;

    window.open(current.url, '_blank', 'noopener,noreferrer');
  }

  @HostListener('document:keydown.escape')
  onEscClosePanels(): void {
    this.closeQrPanel();
    this.hideHoverPanel();
  }
}