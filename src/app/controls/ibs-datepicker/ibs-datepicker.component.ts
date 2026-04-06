// ibs-datepicker.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-ibs-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, FloatLabelModule],
  templateUrl: './ibs-datepicker.component.html',
  styleUrl: './ibs-datepicker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IbsDatepickerComponent),
      multi: true
    }
  ]
})
export class IbsDatepickerComponent implements ControlValueAccessor {
  @Input() label: string = 'Fecha';
  @Input() dateFormat: string = 'dd-mm-yy';
  @Input() appendTo: any = 'body';
  @Input() showIcon: boolean = true;
  @Input() iconDisplay: 'input' | 'button' = 'input';
  @Input() inputStyleClass: string = 'w-100';
  @Input() styleClass: string = 'w-100';
  @Input() disabled: boolean = false;
  @Input() variant: 'on' | 'in' | 'over' = 'on';

  @Output() valueChange = new EventEmitter<Date | null>();

  value: Date | null = null;

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(value: Date | null): void {
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}