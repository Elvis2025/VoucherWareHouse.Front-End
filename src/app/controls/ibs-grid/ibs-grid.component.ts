import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
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

export interface IbsGridColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: IbsAlign;
  field?: keyof T | string;
  template?: TemplateRef<{ $implicit: T }>;
  sortable?: boolean;
}

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

@Component({
  selector: 'app-ibs-grid',
  standalone: true,
  imports: [CommonModule, IbsDropdownComponent],
  templateUrl: './ibs-grid.component.html',
  styleUrls: ['./ibs-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IbsGridComponent<T> extends AppComponentBase implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() placeholderSearch = 'Buscar...';

  @Input({ required: true }) columns!: IbsGridColumn<T>[];
  @Input({ required: true }) load!: (q: IbsGridQuery) => Observable<IbsPagedResult<T>>;

  @Input() actions: IbsGridAction<T>[] = [];
  @Input() createPolicy?: string;

  @Input() pageSizeOptions: number[] = [10, 20, 50];

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
    const pagesAfter = (count - 1) - idx;
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

  pageSizeItems(): IbsDropdownItem[] {
    return (this.pageSizeOptions ?? []).map(n => ({
      id: String(n),
      text: String(n),
      run: () => this.setPageSize(n),
    }));
  }

  ngOnInit(): void {
    this.pageSizeSig.set(this.pageSize);
    this.fetch();
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
        console.log(res);
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

  /** Detecta si el valor de una celda es boolean para renderizar badge Sí/No */
  isBooleanValue(v: any): boolean {
    return typeof v === 'boolean';
  }

  cellValue(row: any, c: IbsGridColumn<T>): any {
    const key = (c.field ?? c.key) as string;
    if (!key) return '';
    if (key.includes('.')) {
      return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), row) ?? '';
    }
    return row?.[key] ?? '';
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
      left: rect.right - 220,
    };

    this.openRowId = rowId;
  }

  closeActions() {
    this.openRowId = null;
  }
}