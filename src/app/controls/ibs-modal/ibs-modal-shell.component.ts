import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ibs-modal-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-modal-shell.component.html',
  styleUrls: ['./ibs-modal-shell.shared.scss'],
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        display: block;
        font-size: 14px;
      }

      .ibs-modal-backdrop{
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.55);
      }

      .ibs-modal{
        position: fixed;
        left: 50%;
    top: 2%;
  transform: translateX(-50%);

        // width: min(1200px, calc(100vw - 24px));
        width: auto;
        min-width: min(600px, calc(100vw - 24px));
        max-height: min(780px, calc(100vh - 24px));
        height: auto;


        /* ✅ OPACO: elimina “ver la pantalla detrás” */
        background: var(--ibs-modal-background-color);
        color: var(--ibs-text);

        border: 1px solid color-mix(in srgb, var(--ibs-border) 70%, transparent);
        border-radius: 18px;
        box-shadow: 0 24px 90px rgba(0,0,0,.45);
        overflow: hidden;

        display: flex;
        flex-direction: column;

        min-height: 0;
      }

      .ibs-slot{
        display: block;
        min-height: 0;
      }

      .ibs-slot-header{ flex: 0 0 auto; }
      .ibs-slot-topbar{ flex: 0 0 auto; }
      .ibs-slot-footer{ flex: 0 0 auto; }

      .ibs-slot-body{
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden; /* scroll va dentro del body */
      }

      .ibs-modal{
  display: flex;
  flex-direction: column;
  min-height: 0;      /* ✅ clave */
}

.ibs-slot{ 
  display:block; 
  min-height:0;       /* ✅ clave */
}

.ibs-slot-header{ flex: 0 0 auto; }
.ibs-slot-topbar{ flex: 0 0 auto; }
.ibs-slot-footer{ flex: 0 0 auto; }

.ibs-slot-body{
  flex: 1 1 auto;     /* ✅ body toma el espacio restante */
  min-height: 0;      /* ✅ permite que el overflow funcione */
  overflow: hidden;   /* ✅ el scroll va adentro del body */
}


    `,
  ],
})
export class IbsModalShellComponent {
  @Input() wide = true;
  @Input() zIndex = 3000;

  @Output() cancelled = new EventEmitter<void>();
}