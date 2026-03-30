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
      .ibs-modal-layer {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        pointer-events: auto;
      }

      .ibs-modal-backdrop {
       
        //background: rgba(0, 0, 0, 0.55);
        //backdrop-filter: blur(2px);
        //-webkit-backdrop-filter: blur(2px);
      }

      .ibs-modal {
        --ibs-modal-viewport-gap: 32px;
        --ibs-modal-min-width: 920px;
        --ibs-modal-wide-min-width: 1280px;

        position: relative;
        z-index: 1;

        display: inline-grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;

        width: auto;
        min-width: min(var(--ibs-modal-min-width), calc(100vw - var(--ibs-modal-viewport-gap)));
        max-width: calc(100vw - var(--ibs-modal-viewport-gap));
        max-height: calc(100dvh - 32px);
        min-height: 0;
        margin-top: 0;

        background: var(--ibs-modal-background-color);
        color: var(--ibs-text);
        border: 1px solid color-mix(in srgb, var(--ibs-border) 70%, transparent);
        border-radius: 18px;
        box-shadow: 0 24px 90px rgba(0, 0, 0, 0.45);
        overflow: hidden;
      }

      .ibs-modal.wide {
        min-width: min(var(--ibs-modal-wide-min-width), calc(100vw - var(--ibs-modal-viewport-gap)));
      }

      .ibs-slot {
        display: block;
        min-height: 0;
        min-width: 0;
      }

      .ibs-slot-header,
      .ibs-slot-topbar,
      .ibs-slot-footer {
        width: 100%;
      }

      .ibs-slot-body {
        min-height: 0;
        min-width: 0;
        overflow: hidden;
      }

      @media (max-width: 1199.98px) {
        .ibs-modal {
          --ibs-modal-min-width: 760px;
          --ibs-modal-wide-min-width: 980px;
        }
      }

      @media (max-width: 991.98px) {
        .ibs-modal-layer {
          padding: 12px;
        }

        .ibs-modal {
          --ibs-modal-viewport-gap: 24px;
          --ibs-modal-min-width: 100%;
          --ibs-modal-wide-min-width: 100%;

          width: 100%;
          min-width: 0;
          max-width: 100%;
          max-height: calc(100dvh - 24px);
        }

        .ibs-modal.wide {
          min-width: 0;
        }
      }

      @media (max-width: 767.98px) {
        :host {
          font-size: 13px;
        }

        .ibs-modal-layer {
          padding: 10px;
          align-items: flex-start;
        }

        .ibs-modal {
          --ibs-modal-viewport-gap: 20px;

          width: 100%;
          min-width: 0;
          max-width: 100%;
          max-height: calc(100dvh - 20px);
          border-radius: 16px;
        }

        .ibs-modal.wide {
          min-width: 0;
        }
      }

      @media (max-width: 575.98px) {
        .ibs-modal-layer {
          padding: 8px;
        }

        .ibs-modal {
          --ibs-modal-viewport-gap: 16px;
          max-height: calc(100dvh - 16px);
          border-radius: 14px;
        }
      }
    `,
  ],
})
export class IbsModalShellComponent {
  @Input() wide = true;
  @Input() zIndex = 3000;

  @Output() cancelled = new EventEmitter<void>();
}