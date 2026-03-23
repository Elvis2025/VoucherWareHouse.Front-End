import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface IbsSelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
  icon?: string;
}

type SelectValue = any | any[] | null;

@Component({
  selector: 'app-ibs-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-select.component.html',
  styleUrls: ['./ibs-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IbsSelectComponent),
      multi: true,
    },
  ],
})
export class IbsSelectComponent implements ControlValueAccessor, AfterViewInit {
  @Input() id = `ibs-sel-${Math.random().toString(16).slice(2)}`;
  @Input() name?: string;

  @Input() label = 'Seleccionar';
  @Input() placeholder = ' ';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() emptyText = 'No hay resultados';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() multiple = false;
  @Input() clearable = true;
  @Input() searchable = true;
  @Input() closeOnSelect = true;
  @Input() maxDropdownHeight = 280;
  @Input() ariaLabel?: string;

  /**
   * Máximo de opciones visibles antes del scroll interno.
   */
  @Input() visibleOptions = 4;

  /**
   * Puedes pasar:
   * - [{ label:'Activo', value:1 }]
   * - ['A', 'B', 'C']
   * - [{ id:1, name:'Admin' }] usando bindLabel/bindValue
   */
  @Input() options: any[] = [];
  @Input() bindLabel = 'label';
  @Input() bindValue = 'value';

  /**
   * compareWith para objetos complejos
   */
  @Input() compareWith: (a: any, b: any) => boolean = (a, b) => a === b;

  /**
   * Estado visual de error opcional
   */
  @Input() error = false;

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectValue>();

  @ViewChild('triggerEl') triggerEl?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInputEl') searchInputEl?: ElementRef<HTMLInputElement>;

  isOpen = false;
  focused = false;
  touched = false;
  searchTerm = '';
  activeIndex = -1;

  panelStyles: Record<string, string> = {};

  private readonly optionRowHeight = 52;
  private readonly panelGap = 8;
  private readonly viewportMargin = 12;
  private readonly searchAreaHeight = 58;
  private readonly panelVerticalPadding = 16;

  private innerValue: SelectValue = null;
  private onChange: (value: SelectValue) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private host: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.cdr.markForCheck();
  }

  writeValue(value: SelectValue): void {
    if (this.multiple) {
      this.innerValue = Array.isArray(value) ? [...value] : [];
    } else {
      this.innerValue = value ?? null;
    }

    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: SelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  @HostBinding('class.is-disabled')
  get isDisabledHost(): boolean {
    return this.disabled;
  }

  get normalizedOptions(): IbsSelectOption[] {
    return (this.options ?? []).map((item) => this.normalizeOption(item));
  }

  get filteredOptions(): IbsSelectOption[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.normalizedOptions;

    return this.normalizedOptions.filter((opt) => {
      const label = String(opt.label ?? '').toLowerCase();
      const desc = String(opt.description ?? '').toLowerCase();
      return label.includes(term) || desc.includes(term);
    });
  }

  get hasValue(): boolean {
    if (this.multiple) {
      return Array.isArray(this.innerValue) && this.innerValue.length > 0;
    }

    return this.innerValue !== null && this.innerValue !== undefined && this.innerValue !== '';
  }

  get showClear(): boolean {
    if (!this.clearable || this.disabled || this.readonly) return false;
    if (!(this.focused || this.isOpen)) return false;
    return this.hasValue;
  }

  get selectedOptions(): IbsSelectOption[] {
    if (!this.multiple) {
      const selected = this.normalizedOptions.find((opt) => this.isSelected(opt));
      return selected ? [selected] : [];
    }

    const values = Array.isArray(this.innerValue) ? this.innerValue : [];
    return this.normalizedOptions.filter((opt) =>
      values.some((v) => this.compareWith(v, opt.value))
    );
  }

  get displayLabel(): string {
    if (!this.hasValue) return '';

    if (this.multiple) {
      const selected = this.selectedOptions;
      if (selected.length === 0) return '';
      if (selected.length === 1) return selected[0].label;
      return `${selected.length} elementos seleccionados`;
    }

    return this.selectedOptions[0]?.label ?? '';
  }

  get optionsViewportMaxHeight(): number {
    return (this.visibleOptions * this.optionRowHeight) + this.panelVerticalPadding;
  }

  get computedPanelMaxHeight(): number {
    const searchHeight = this.searchable ? this.searchAreaHeight : 0;
    const desiredHeight = this.optionsViewportMaxHeight + searchHeight;
    return Math.min(this.maxDropdownHeight, desiredHeight);
  }

  open(): void {
    if (this.disabled || this.readonly || this.isOpen) return;

    this.isOpen = true;
    this.focused = true;
    this.syncActiveIndex();
    this.opened.emit();
    this.cdr.markForCheck();

    queueMicrotask(() => {
      this.updatePanelPosition();

      if (this.searchable) {
        this.searchInputEl?.nativeElement?.focus();
        this.searchInputEl?.nativeElement?.select();
      }
    });
  }

  close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.searchTerm = '';
    this.activeIndex = -1;
    this.focused = false;
    this.panelStyles = {};
    this.closed.emit();
    this.markAsTouched();
    this.cdr.markForCheck();
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  focus(): void {
    if (this.disabled) return;
    this.triggerEl?.nativeElement?.focus();
  }

  onTriggerClick(event?: MouseEvent): void {
    event?.preventDefault();
    if (this.disabled || this.readonly) return;
    this.toggle();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm = input?.value ?? '';
    this.searchChange.emit(this.searchTerm);
    this.syncActiveIndex(true);
    this.cdr.markForCheck();

    queueMicrotask(() => this.updatePanelPosition());
  }

  onTriggerFocus(): void {
    this.focused = true;
    this.cdr.markForCheck();
  }

  onTriggerBlur(): void {
    if (!this.isOpen) {
      this.focused = false;
      this.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onOptionClick(option: IbsSelectOption, event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (option.disabled || this.disabled || this.readonly) return;

    if (this.multiple) {
      const current = Array.isArray(this.innerValue) ? [...this.innerValue] : [];
      const index = current.findIndex((v) => this.compareWith(v, option.value));

      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(option.value);
      }

      this.innerValue = current;
      this.emitValue();

      if (this.searchable) {
        queueMicrotask(() => this.searchInputEl?.nativeElement?.focus());
      }

      if (!this.searchable) {
        this.syncActiveIndex();
      }

      queueMicrotask(() => this.updatePanelPosition());
    } else {
      this.innerValue = option.value;
      this.emitValue();

      if (this.closeOnSelect) {
        this.close();
        queueMicrotask(() => this.triggerEl?.nativeElement?.focus());
      } else {
        queueMicrotask(() => this.updatePanelPosition());
      }
    }

    this.cdr.markForCheck();
  }

  removeChip(option: IbsSelectOption, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled || this.readonly || !this.multiple) return;

    const current = Array.isArray(this.innerValue) ? [...this.innerValue] : [];
    const next = current.filter((v) => !this.compareWith(v, option.value));
    this.innerValue = next;
    this.emitValue();
    this.cdr.markForCheck();

    queueMicrotask(() => this.updatePanelPosition());
  }

  clear(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.disabled || this.readonly) return;

    this.innerValue = this.multiple ? [] : null;
    this.searchTerm = '';
    this.emitValue();
    this.markAsTouched();
    this.cdr.markForCheck();

    queueMicrotask(() => {
      this.updatePanelPosition();

      if (this.isOpen && this.searchable) {
        this.searchInputEl?.nativeElement?.focus();
      } else {
        this.triggerEl?.nativeElement?.focus();
      }
    });
  }

  clearSearch(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.searchTerm = '';
    this.syncActiveIndex(true);
    this.cdr.markForCheck();

    queueMicrotask(() => {
      this.updatePanelPosition();
      this.searchInputEl?.nativeElement?.focus();
    });
  }

  isSelected(option: IbsSelectOption): boolean {
    if (this.multiple) {
      const values = Array.isArray(this.innerValue) ? this.innerValue : [];
      return values.some((v) => this.compareWith(v, option.value));
    }

    return this.compareWith(this.innerValue, option.value);
  }

  trackByValue(_: number, option: IbsSelectOption): any {
    return option.value;
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          this.moveActive(1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          this.moveActive(-1);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          this.selectActive();
        }
        break;

      case 'Escape':
        if (this.isOpen) {
          event.preventDefault();
          this.close();
          queueMicrotask(() => this.triggerEl?.nativeElement?.focus());
        }
        break;

      case 'Tab':
        this.close();
        break;

      case 'Backspace':
        if (!this.isOpen && this.multiple && this.hasValue && !this.searchTerm) {
          const current = Array.isArray(this.innerValue) ? [...this.innerValue] : [];
          current.pop();
          this.innerValue = current;
          this.emitValue();
          this.cdr.markForCheck();
        }
        break;
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;

      case 'Enter':
        event.preventDefault();
        this.selectActive();
        break;

      case 'Escape':
        event.preventDefault();
        this.close();
        queueMicrotask(() => this.triggerEl?.nativeElement?.focus());
        break;

      case 'Tab':
        this.close();
        break;

      case 'Backspace':
        if (this.multiple && !this.searchTerm) {
          const current = Array.isArray(this.innerValue) ? [...this.innerValue] : [];
          current.pop();
          this.innerValue = current;
          this.emitValue();
          this.cdr.markForCheck();
        }
        break;
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen) return;

    const target = event.target as Node | null;
    if (!target) return;

    if (!this.host.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isOpen) return;
    this.updatePanelPosition();
    this.cdr.markForCheck();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isOpen) return;
    this.updatePanelPosition();
    this.cdr.markForCheck();
  }

  private moveActive(step: number): void {
    const options = this.filteredOptions.filter((o) => !o.disabled);
    if (!options.length) {
      this.activeIndex = -1;
      this.cdr.markForCheck();
      return;
    }

    const currentActive = this.getActiveEnabledIndex(options);
    const nextIndex =
      currentActive < 0
        ? 0
        : (currentActive + step + options.length) % options.length;

    const nextOption = options[nextIndex];
    this.activeIndex = this.filteredOptions.findIndex((o) =>
      this.compareWith(o.value, nextOption.value)
    );

    this.cdr.markForCheck();
  }

  private selectActive(): void {
    const option = this.filteredOptions[this.activeIndex];
    if (!option || option.disabled) return;
    this.onOptionClick(option);
  }

  private syncActiveIndex(forceFirst = false): void {
    const options = this.filteredOptions.filter((o) => !o.disabled);
    if (!options.length) {
      this.activeIndex = -1;
      return;
    }

    if (forceFirst) {
      this.activeIndex = this.filteredOptions.findIndex((o) =>
        this.compareWith(o.value, options[0].value)
      );
      return;
    }

    const selected = this.filteredOptions.findIndex((o) => this.isSelected(o) && !o.disabled);
    if (selected >= 0) {
      this.activeIndex = selected;
      return;
    }

    this.activeIndex = this.filteredOptions.findIndex((o) => !o.disabled);
  }

  private getActiveEnabledIndex(options: IbsSelectOption[]): number {
    const active = this.filteredOptions[this.activeIndex];
    if (!active) return -1;

    return options.findIndex((o) => this.compareWith(o.value, active.value));
  }

  private emitValue(): void {
    const value = this.multiple
      ? (Array.isArray(this.innerValue) ? [...this.innerValue] : [])
      : this.innerValue;

    this.onChange(value);
    this.selectionChange.emit(value);
  }

  private markAsTouched(): void {
    if (this.touched) return;
    this.touched = true;
    this.onTouched();
  }

  private updatePanelPosition(): void {
    const trigger = this.triggerEl?.nativeElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const desiredHeight = this.computedPanelMaxHeight;
    const spaceBelow = viewportHeight - rect.bottom - this.panelGap - this.viewportMargin;
    const spaceAbove = rect.top - this.panelGap - this.viewportMargin;

    const openUpward = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const maxAvailableHeight = Math.max(140, openUpward ? spaceAbove : spaceBelow);
    const finalHeight = Math.min(desiredHeight, maxAvailableHeight);

    const top = openUpward
      ? rect.top - finalHeight - this.panelGap
      : rect.bottom + this.panelGap;

    this.panelStyles = {
      position: 'fixed',
      left: `${Math.round(rect.left)}px`,
      top: `${Math.round(top)}px`,
      width: `${Math.round(rect.width)}px`,
      maxHeight: `${Math.round(finalHeight)}px`,
      zIndex: '99999',
    };
  }

  private normalizeOption(item: any): IbsSelectOption {
    if (
      item &&
      typeof item === 'object' &&
      ('label' in item || this.bindLabel in item || this.bindValue in item)
    ) {
      return {
        label: String(item[this.bindLabel] ?? item.label ?? ''),
        value: item[this.bindValue] ?? item.value ?? item,
        disabled: !!item.disabled,
        description: item.description ?? '',
        icon: item.icon ?? '',
      };
    }

    return {
      label: String(item),
      value: item,
      disabled: false,
    };
  }
}