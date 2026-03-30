import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BsDatepickerConfig,
  BsDatepickerDirective,
  BsDatepickerModule,
} from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-ibs-datepicker',
  standalone: true,
  imports: [CommonModule, BsDatepickerModule],
  templateUrl: './ibs-datepicker.component.html',
  styleUrls: ['./ibs-datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IbsDatepickerComponent),
      multi: true,
    },
  ],
})
export class IbsDatepickerComponent implements ControlValueAccessor, OnInit {
  @ViewChild('inp', { static: true }) inp!: ElementRef<HTMLInputElement>;
  @ViewChild('dp', { static: true }) dp!: BsDatepickerDirective;

  @Input() id = 'ibs-dp-' + Math.random().toString(36).substring(2);
  @Input() name?: string;
  @Input() label = '';
  @Input() placeholder?: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() autocomplete = 'off';
  @Input() ariaLabel?: string;

  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() daysDisabled?: number[];
  @Input() datesDisabled?: Date[];
  @Input() datesEnabled?: Date[];
  @Input() autoOpenOnFocus = false;

  @Input() iconClass = 'bi bi-calendar-date';
  @Input() colorTheme = 'theme-dark-blue';

  @Output() valueChange = new EventEmitter<Date | null>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();

  value: Date | null = null;
  focused = false;
  isOpen = false;

  bsConfig!: Partial<BsDatepickerConfig>;

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.bsConfig = {
      containerClass: this.colorTheme,
      dateInputFormat: 'DD-MM-YYYY',
      showWeekNumbers: false,
      adaptivePosition: true,
      isAnimated: false
    };
  }

  get resolvedPlaceholder(): string | null {
    return this.placeholder?.trim() ? this.placeholder : null;
  }

  get showClear(): boolean {
    return !!this.value && !this.disabled && !this.readonly;
  }

  get hasValue(): boolean {
    return !!this.value;
  }

  writeValue(val: Date | null): void {
    this.value = val;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  onDateValueChange(date: Date | null): void {
    this.value = date;
    this.onChange(date);
    this.valueChange.emit(date);
    this.cdr.markForCheck();
  }

  onFocus(ev: FocusEvent): void {
    this.focused = true;
    this.focusEvent.emit(ev);

    if (this.autoOpenOnFocus && !this.disabled && !this.readonly) {
      this.open();
    }

    this.cdr.markForCheck();
  }

  onBlur(ev: FocusEvent): void {
    this.focused = false;
    this.onTouched();
    this.blurEvent.emit(ev);
    this.cdr.markForCheck();
  }

  open(ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();

    if (this.disabled || this.readonly) return;

    this.inp?.nativeElement?.focus();

    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.dp?.show();
      }, 0);
    });
  }

  toggle(ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();

    if (this.disabled || this.readonly) return;

    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.dp?.toggle();
      }, 0);
    });
  }

  clear(ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();

    if (this.disabled || this.readonly) return;

    this.value = null;
    this.onChange(null);
    this.onTouched();
    this.valueChange.emit(null);
    this.cdr.markForCheck();
  }

  onShown(): void {
    this.isOpen = true;
    this.cdr.markForCheck();
  }

  onHidden(): void {
    this.isOpen = false;
    this.cdr.markForCheck();
  }
}