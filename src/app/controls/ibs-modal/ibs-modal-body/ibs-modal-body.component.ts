import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ibs-modal-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-modal-body.component.html',
  styleUrls: ['../ibs-modal-shell.shared.scss'],
  host: { class: 'ibs-modal-body-host' }, // ✅ clave
})
export class IbsModalBodyComponent {
  // por defecto: scroll interno
  @Input() overflow: 'hidden' | 'auto' | 'visible' = 'auto';
}