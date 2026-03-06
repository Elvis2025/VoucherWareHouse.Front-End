import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ibs-modal-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-modal-footer.component.html',
  styleUrls: ['../ibs-modal-shell.shared.scss'],
  host: { class: 'ibs-modal-footer-host' }, // ✅ clave
})
export class IbsModalFooterComponent {
  @Input() showClose = true;
  @Input() showSave = true;

  @Input() closeText = 'Cerrar';
  @Input() saveText = 'Guardar';

  @Input() saveDisabled = false;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
}