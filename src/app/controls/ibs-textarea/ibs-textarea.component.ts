import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewChild,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ibs-textarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-textarea.component.html',
  styleUrls: ['./ibs-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IbsTextareaComponent),
      multi: true,
    },
  ],
})
export class IbsTextareaComponent implements ControlValueAccessor {
  @Input() id = `ibs-txta-${Math.random().toString(16).slice(2)}`;
  @Input() name?: string;

  /**
   * Texto flotante/fijo visual dentro del componente.
   * Lo dejo como label porque encaja mejor con tu sistema actual.
   */
  @Input() label = 'Descripción';

  /**
   * Placeholder nativo del textarea.
   * Si no quieres hint interno extra, déjalo vacío.
   */
  @Input() placeholder = '';

  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() error = false;

  @Input() rows = 5;
  @Input() resize: 'none' | 'vertical' | 'horizontal' | 'both' = 'vertical';

  @Input() minLength?: number;
  @Input() maxLength?: number;

  @Input() autocomplete?: string;
  @Input() ariaLabel?: string;
  @Input() spellcheck = false;

  @ViewChild('textareaEl') textareaEl?: ElementRef<HTMLTextAreaElement>;

  readonly value = signal('');
  readonly focused = signal(false);
  readonly touched = signal(false);

  readonly hasValue = computed(() => this.value().trim().length > 0);
  readonly charCount = computed(() => this.value().length);

  readonly helperText = computed(() => {
    const min = this.minLength;
    const max = this.maxLength;

    if (min != null && max != null) {
      return `Mínimo ${min} caracteres · Máximo ${max} caracteres`;
    }

    if (min != null) {
      return `Mínimo ${min} caracteres`;
    }

    if (max != null) {
      return `Máximo ${max} caracteres`;
    }

    return '';
  });

  readonly showHelper = computed(() => this.helperText().length > 0);

  readonly currentLengthState = computed<'normal' | 'valid' | 'invalid'>(() => {
    const count = this.charCount();
    const min = this.minLength;
    const max = this.maxLength;

    if (min != null && count > 0 && count < min) return 'invalid';
    if (max != null && count > max) return 'invalid';

    if ((min != null || max != null) && count > 0) return 'valid';

    return 'normal';
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(value == null ? '' : String(value));
    this.syncDomValue();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement | null;
    if (!el) return;

    let nextValue = el.value;

    if (this.maxLength != null && nextValue.length > this.maxLength) {
      nextValue = nextValue.slice(0, this.maxLength);
      el.value = nextValue;
    }

    this.value.set(nextValue);
    this.onChange(nextValue);
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.focused.set(false);
    this.markAsTouched();
  }

  clear(): void {
    if (this.disabled || this.readonly) return;

    this.value.set('');
    this.onChange('');
    this.markAsTouched();
    this.syncDomValue();

    queueMicrotask(() => {
      this.textareaEl?.nativeElement?.focus();
    });
  }

  focus(): void {
    if (this.disabled) return;
    this.textareaEl?.nativeElement?.focus();
  }

  get showClear(): boolean {
    if (this.disabled || this.readonly) return false;
    if (!this.focused()) return false;
    return this.hasValue();
  }

  get isBelowMin(): boolean {
    const min = this.minLength;
    if (min == null) return false;
    return this.charCount() > 0 && this.charCount() < min;
  }

  get isAtMax(): boolean {
    const max = this.maxLength;
    if (max == null) return false;
    return this.charCount() >= max;
  }

  @HostBinding('class.is-disabled')
  get isDisabledHost(): boolean {
    return this.disabled;
  }

  private markAsTouched(): void {
    if (this.touched()) return;
    this.touched.set(true);
    this.onTouched();
  }

  private syncDomValue(): void {
    const el = this.textareaEl?.nativeElement;
    if (!el) return;

    const nextValue = this.value();
    if (el.value !== nextValue) { 
      el.value = nextValue;
    }
  }
}