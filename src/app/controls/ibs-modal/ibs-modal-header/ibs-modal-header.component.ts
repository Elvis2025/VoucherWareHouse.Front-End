import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ibs-modal-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-modal-header.component.html',
  styleUrls: ['../ibs-modal-shell.shared.scss'],
  host: { class: 'ibs-modal-header-host' }, // ✅ clave
})
export class IbsModalHeaderComponent {
  @Input() title = '';
  @Input() accent = '';
  @Input() closeTitle = 'Cerrar';

  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }
}