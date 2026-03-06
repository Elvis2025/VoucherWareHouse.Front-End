import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ibs-modal-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-modal-top-bar.component.html',
  styleUrls: ['../ibs-modal-shell.shared.scss'],
  host: { class: 'ibs-modal-topbar-host' }, // ✅ clave
})
export class IbsModalTopBarComponent {
  @Input() showSearch = true;
  @Input() showRefresh = true;

  @Input() searchPlaceholder = 'Buscar...';
  @Input() searchValue = '';
  @Input() showClear = true;

  @Input() refreshText = 'Refrescar';
  @Input() refreshDisabled = false;

  @Output() searchChanged = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
  @Output() refreshed = new EventEmitter<void>();

  onInput(v: string) {
    this.searchChanged.emit(v);
  }

  onClear() {
    this.cleared.emit();
    this.searchChanged.emit('');
  }

  onRefresh() {
    this.refreshed.emit();
  }
}