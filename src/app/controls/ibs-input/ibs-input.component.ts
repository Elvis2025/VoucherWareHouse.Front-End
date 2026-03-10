import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  Output,
  ViewChild,
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
    this.value = value == null ? '' : String(value);
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

  get nativePattern(): string | null {
    const pattern = this.pattern?.trim();
    if (!pattern) return null;

    try {
      new RegExp(pattern);
      return pattern;
    } catch {
      return null;
    }
  }

  onInput(ev: Event): void {
    const el = ev.target as HTMLInputElement | null;
    if (!el) return;

    this.value = el.value;
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

  @HostBinding('class.is-disabled')
  get isDisabledHost(): boolean {
    return this.disabled;
  }
}