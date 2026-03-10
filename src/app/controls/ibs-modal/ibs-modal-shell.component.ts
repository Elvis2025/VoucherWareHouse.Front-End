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
        position: fixed;
        left: 50%;
        top: 2%;
        transform: translateX(-50%);

        width: auto;
        min-width: min(600px, calc(100vw - 24px));
        max-width: calc(100vw - 24px);
        max-height: calc(100dvh - 24px);

        background: var(--ibs-modal-background-color);
        color: var(--ibs-text);

        border: 1px solid color-mix(in srgb, var(--ibs-border) 70%, transparent);
        border-radius: 18px;
        box-shadow: 0 24px 90px rgba(0, 0, 0, 0.45);
        overflow: hidden;

        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;

        min-height: 0;
      }

      .ibs-slot {
        display: block;
        min-height: 0;
      }

      .ibs-slot-header {
        min-height: fit-content;
      }

      .ibs-slot-topbar {
        min-height: fit-content;
      }

      .ibs-slot-body {
        min-height: 0;
        overflow: hidden;
      }

      .ibs-slot-footer {
        min-height: fit-content;
      }

      @media (max-width: 767.98px) {
        .ibs-modal {
          top: 12px;
          left: 12px;
          right: 12px;
          transform: none;

          min-width: unset;
          width: auto;
          max-width: unset;
          max-height: calc(100dvh - 24px);
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