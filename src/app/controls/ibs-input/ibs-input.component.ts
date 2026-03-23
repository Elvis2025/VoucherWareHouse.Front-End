import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'search'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'time'
  | 'week';

@Component({
  selector: 'app-ibs-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-input.component.html',
  styleUrls: ['./ibs-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IbsInputComponent),
      multi: true,
    },
  ],
})
export class IbsInputComponent implements ControlValueAccessor {
  @Input() id = `ibs-inp-${Math.random().toString(16).slice(2)}`;
  @Input() label = 'Label';
  @Input() placeholder = ' ';
  @Input() type: InputType = 'text';

  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;

  @Input() name?: string;
  @Input() autocomplete?: string;
  @Input() inputMode?: string;
  @Input() maxLength?: number;
  @Input() minLength?: number;
  @Input() min?: string | number;
  @Input() max?: string | number;
  @Input() step?: string | number;
  @Input() pattern?: string;
  @Input() ariaLabel?: string;

  /**
   * Cuando type="number", internamente el input nativo se renderiza como text
   * para evitar spinners y mejorar UX, pero manteniendo el API actual.
   */
  @Input() numberAsText = true;

  /**
   * Define cómo sanitizar cuando type="number".
   * - integer: solo enteros, opcional signo negativo
   * - decimal: enteros o decimales, opcional signo negativo
   */
  @Input() numericMode: 'integer' | 'decimal' = 'integer';

  /**
   * Permite signo negativo cuando type="number".
   */
  @Input() allowNegative = false;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() changeEvent = new EventEmitter<Event>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() keydownEvent = new EventEmitter<KeyboardEvent>();
  @Output() keyupEvent = new EventEmitter<KeyboardEvent>();

  @ViewChild('inp') inp?: ElementRef<HTMLInputElement>;

  value = '';
  focused = false;
  touched = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  writeValue(value: unknown): void {
    const next = value == null ? '' : String(value);
    this.value = this.isNumberLike ? this.sanitizeNumericValue(next) : next;
    this.syncDomValue();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  get hasValue(): boolean {
    return this.value.trim().length > 0;
  }

  get showClear(): boolean {
    if (this.disabled || this.readonly) return false;
    if (!this.focused) return false;
    return this.hasValue;
  }

  get isNumberLike(): boolean {
    return this.type === 'number';
  }

  get nativeType(): string {
    if (this.isNumberLike && this.numberAsText) {
      return 'text';
    }

    return this.type;
  }

  get resolvedInputMode(): string | null {
    if (this.inputMode?.trim()) {
      return this.inputMode.trim();
    }

    if (this.isNumberLike) {
      return this.numericMode === 'decimal' ? 'decimal' : 'numeric';
    }

    return null;
  }

  get resolvedPattern(): string | null {
    const explicitPattern = this.safePattern(this.pattern);
    if (explicitPattern) {
      return explicitPattern;
    }

    if (!this.isNumberLike) {
      return null;
    }

    if (this.numericMode === 'decimal') {
      return this.allowNegative ? '^-?[0-9]*[.,]?[0-9]*$' : '^[0-9]*[.,]?[0-9]*$';
    }

    return this.allowNegative ? '^-?[0-9]*$' : '^[0-9]*$';
  }

  onInput(ev: Event): void {
    const el = ev.target as HTMLInputElement | null;
    if (!el) return;

    let nextValue = el.value;

    if (this.isNumberLike) {
      nextValue = this.sanitizeNumericValue(nextValue);

      if (el.value !== nextValue) {
        el.value = nextValue;
      }
    }

    this.value = nextValue;
    this.onChange(this.value);
    this.inputEvent.emit(ev as InputEvent);
    this.cdr.markForCheck();
  }

  onChangeNative(ev: Event): void {
    this.changeEvent.emit(ev);
  }

  onFocus(ev: FocusEvent): void {
    this.focused = true;
    this.focusEvent.emit(ev);
    this.cdr.markForCheck();
  }

  onBlur(ev: FocusEvent): void {
    this.focused = false;
    this.touched = true;
    this.onTouched();

    if (this.isNumberLike && this.numericMode === 'decimal') {
      const normalized = this.normalizeDecimalEnding(this.value);
      if (normalized !== this.value) {
        this.value = normalized;
        this.syncDomValue();
        this.onChange(this.value);
      }
    }

    this.blurEvent.emit(ev);
    this.cdr.markForCheck();
  }

  onKeydown(ev: KeyboardEvent): void {
    this.keydownEvent.emit(ev);
  }

  onKeyup(ev: KeyboardEvent): void {
    this.keyupEvent.emit(ev);
  }

  clear(): void {
    if (this.disabled || this.readonly) return;

    this.value = '';
    this.onChange(this.value);
    this.onTouched();
    this.touched = true;

    const el = this.inp?.nativeElement;
    if (el) {
      el.value = '';
    }

    this.cdr.markForCheck();

    queueMicrotask(() => {
      this.inp?.nativeElement?.focus();
    });
  }

  focus(): void {
    if (this.disabled) return;
    this.inp?.nativeElement?.focus();
  }

  private syncDomValue(): void {
    const el = this.inp?.nativeElement;
    if (!el) return;

    const nextValue = this.value ?? '';
    if (el.value !== nextValue) {
      el.value = nextValue;
    }
  }

  private safePattern(pattern?: string): string | null {
    const value = pattern?.trim();
    if (!value) return null;

    try {
      new RegExp(value);
      return value;
    } catch {
      return null;
    }
  }

  private sanitizeNumericValue(raw: string): string {
    if (!raw) return '';

    const normalized = raw.replace(',', '.');

    if (this.numericMode === 'decimal') {
      return this.sanitizeDecimal(normalized);
    }

    return this.sanitizeInteger(normalized);
  }

  private sanitizeInteger(raw: string): string {
    let result = '';
    let hasSign = false;

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];

      if (ch >= '0' && ch <= '9') {
        result += ch;
        continue;
      }

      if (ch === '-' && this.allowNegative && i === 0 && !hasSign) {
        result += ch;
        hasSign = true;
      }
    }

    return result;
  }

  private sanitizeDecimal(raw: string): string {
    let result = '';
    let hasSign = false;
    let hasDot = false;

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];

      if (ch >= '0' && ch <= '9') {
        result += ch;
        continue;
      }

      if (ch === '-' && this.allowNegative && i === 0 && !hasSign) {
        result += ch;
        hasSign = true;
        continue;
      }

      if (ch === '.' && !hasDot) {
        result += ch;
        hasDot = true;
      }
    }

    return result;
  }

  private normalizeDecimalEnding(raw: string): string {
    if (!raw) return raw;

    if (raw.endsWith('.')) {
      return raw.slice(0, -1);
    }

    return raw;
  }

  @HostBinding('class.is-disabled')
  get isDisabledHost(): boolean {
    return this.disabled;
  }
}