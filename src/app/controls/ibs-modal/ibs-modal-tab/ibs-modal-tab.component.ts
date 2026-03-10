import {
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';

/**
 * Define un tab individual dentro de app-ibs-modal-tabs.
 *
 * Uso:
 *   <app-ibs-modal-tab label="Detalles" icon="bi bi-person">
 *     ... contenido ...
 *   </app-ibs-modal-tab>
 */
@Component({
  selector: 'app-ibs-modal-tab',
  standalone: true,
  template: `
    <ng-template #content>
      <ng-content />
    </ng-template>
  `,
})
export class IbsModalTabComponent {
  /** Texto del tab — requerido */
  @Input({ required: true }) label!: string;

  /** Icono Bootstrap Icons opcional, ej: 'bi bi-person' */
  @Input() icon?: string;

  /** Deshabilita el tab */
  @Input() disabled = false;

  /** Template del contenido — lo lee IbsModalTabsComponent */
  @ViewChild('content', { static: true }) content!: TemplateRef<any>;
}