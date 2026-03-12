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

      .ibs-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
      }

      .ibs-modal {
        --ibs-modal-viewport-gap: 32px;
        --ibs-modal-min-width: 920px;
        --ibs-modal-wide-min-width: 1280px;

        position: fixed;
        left: 50%;
        top: 16px;
        transform: translateX(-50%);

        display: inline-grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;

        width: auto;
        min-width: min(var(--ibs-modal-min-width), calc(100vw - var(--ibs-modal-viewport-gap)));
        max-width: calc(100vw - var(--ibs-modal-viewport-gap));
        max-height: calc(100dvh - 32px);
        min-height: 0;

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

      @media (max-width: 767.98px) {
        .ibs-modal {
          --ibs-modal-viewport-gap: 20px;

          top: 10px;
          left: 10px;
          right: 10px;
          transform: none;

          width: auto;
          min-width: unset;
          max-width: unset;
          max-height: calc(100dvh - 20px);
        }

        .ibs-modal.wide {
          min-width: unset;
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