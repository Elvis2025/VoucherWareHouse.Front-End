import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-ibs-check-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-check-box.component.html',
  styleUrls: ['./ibs-check-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IbsCheckBoxComponent),
      multi: true,
    },
  ],
})
export class IbsCheckBoxComponent implements ControlValueAccessor {
  @Input() text = '';
  @Input() required = false;

  /** Error manual opcional (si quieres) */
  @Input() set error(v: string | null | undefined) {
    this._externalError.set(v ?? null);
  }

  @Output() changed = new EventEmitter<boolean>();

  private _value = signal<boolean>(false);
  readonly value = computed(() => this._value());

  private _disabled = signal(false);
  readonly disabled = computed(() => this._disabled());

  private _touched = signal(false);
  private _externalError = signal<string | null>(null);

  readonly invalid = computed(() => {
    if (this._externalError()) return true;
    if (!this.required) return false;
    if (!this._touched()) return false;
    return this._value() !== true;
  });

  readonly errorText = computed(() => this._externalError() ?? (this.required ? 'Este campo es requerido' : null));

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(obj: any): void {
    this._value.set(!!obj);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  toggle() {
    if (this.disabled()) return;
    const next = !this._value();
    this._value.set(next);
    this.onChange(next);
    this.changed.emit(next);
  }

  onBlur() {
    this._touched.set(true);
    this.onTouched();
  }
}
