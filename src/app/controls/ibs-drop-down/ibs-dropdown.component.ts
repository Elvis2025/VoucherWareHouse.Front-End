import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type IbsDropdownAlign = 'start' | 'end';
export type IbsDropdownVariant = 'icon' | 'select' | 'button';

export interface IbsDropdownItem {
  id: string;
  text: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  run?: () => void;
}

@Component({
  selector: 'app-ibs-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ibs-dropdown.component.html',
  styleUrls: ['./ibs-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IbsDropdownComponent implements OnDestroy {
  /** ✅ Solo un dropdown abierto globalmente */
  private static active: IbsDropdownComponent | null = null;

  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild('panel', { read: ElementRef }) panelRef?: ElementRef<HTMLElement>;
  @ViewChild('anchor', { read: ElementRef }) anchorRef?: ElementRef<HTMLElement>;

  /** track si el panel fue movido al body */
  private portaled = false;

  /** reflow handle */
  private rafId: number | null = null;

  @Input() variant: IbsDropdownVariant = 'icon';
  @Input() align: IbsDropdownAlign = 'end';

  @Input() icon = 'bi bi-sliders';

  @Input() label?: string;
  @Input() valueText = '';

  @Input() text = 'Opciones';
  @Input() leftIcon?: string;

  @Input() items: IbsDropdownItem[] = [];

  @Input() minWidth = 220;
  @Input() maxHeight = 320;

  @Input() disabled = false;
  @Input() mutedOnDark = true;

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly isOpen = signal(false);

  /**
   * ✅ Track robusto: evita keys duplicadas incluso si id/text vienen "" o repetidos.
   * Angular NG0955 suele pasar cuando el track devuelve "" varias veces.
   */
  trackItemKey(index: number, it: IbsDropdownItem): string {
    const id = (it?.id ?? '').trim();
    const text = (it?.text ?? '').trim();

    // Prioridad: id -> text -> index
    // Y añadimos index como sufijo para garantizar unicidad si text se repite
    if (id) return `id:${id}`;
    if (text) return `txt:${text}#${index}`;
    return `idx:${index}`;
  }

  onTriggerClick(ev: MouseEvent): void {
    ev.stopPropagation();
    this.toggle();
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled) return;

    // ✅ UX: cierra el dropdown anterior
    const prev = IbsDropdownComponent.active;
    if (prev && prev !== this) prev.close();
    IbsDropdownComponent.active = this;

    this.isOpen.set(true);

    // Espera al render del panel y luego lo portal + posiciona
    this.schedulePositioning();
  }

  close(): void {
    if (!this.isOpen()) return;

    this.isOpen.set(false);
    this.cancelRaf();

    this.returnFromBody();

    if (IbsDropdownComponent.active === this) {
      IbsDropdownComponent.active = null;
    }

    this.closed.emit();
  }

  onItemClick(item: IbsDropdownItem): void {
    if (item.disabled || item.divider) return;
    this.close();
    item.run?.();
  }

  private schedulePositioning(): void {
    this.cancelRaf();

    // 2 frames: 1) asegurar DOM, 2) medir y posicionar ya con layout estable
    this.rafId = requestAnimationFrame(() => {
      this.portalToBody();
      this.rafId = requestAnimationFrame(() => {
        this.positionPanel();
        this.opened.emit();
      });
    });
  }

  private cancelRaf(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Mueve el panel al <body> para que quede por encima de TODO */
  private portalToBody(): void {
    if (this.portaled) return;

    const panel = this.panelRef?.nativeElement;
    if (!panel) return;

    document.body.appendChild(panel);
    this.portaled = true;

    // Asegura fixed + z-index top absoluto
    panel.style.position = 'fixed';
    panel.style.zIndex = '2147483647';
    panel.style.top = '0px';
    panel.style.left = '0px';
  }

  /** Devuelve el panel al anchor cuando se cierra */
  private returnFromBody(): void {
    if (!this.portaled) return;

    const panel = this.panelRef?.nativeElement;
    const anchor = this.anchorRef?.nativeElement;

    if (panel && anchor) {
      anchor.parentElement?.insertBefore(panel, anchor.nextSibling);
    }

    this.portaled = false;
  }

  /** Posiciona el panel ANCLADO al trigger (viewport coords) */
  private positionPanel(): void {
    const trigger = this.host.nativeElement.querySelector('.ibs-dd-trigger') as HTMLElement | null;
    const panel = this.panelRef?.nativeElement;

    if (!trigger || !panel) return;

    const gap = 10;
    const t = trigger.getBoundingClientRect();

    // Width
    const minW = Math.max(this.minWidth, Math.round(t.width));
    panel.style.minWidth = `${minW}px`;
    panel.style.maxHeight = `${this.maxHeight}px`;

    // Medir altura real (ya portaled)
    const panelRect = panel.getBoundingClientRect();
    const desiredH = Math.min(this.maxHeight, Math.round(panelRect.height || this.maxHeight));

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Decide abrir arriba/abajo según espacio
    const spaceBelow = vh - t.bottom;
    const spaceAbove = t.top;
    const openUp = spaceBelow < desiredH + gap && spaceAbove > spaceBelow;

    // Top
    let top = openUp ? (t.top - desiredH - gap) : (t.bottom + gap);
    top = Math.max(gap, Math.min(top, vh - desiredH - gap));

    // Left (align end = alinear derecha del panel con derecha del botón)
    let left = this.align === 'end' ? (t.right - minW) : t.left;
    left = Math.max(gap, Math.min(left, vw - minW - gap));

    panel.style.top = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(left)}px`;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    const hostEl = this.host.nativeElement;
    const panel = this.panelRef?.nativeElement;

    // click dentro del trigger/host
    if (hostEl.contains(target)) return;

    // click dentro del panel (que está en body)
    if (panel && panel.contains(target)) return;

    this.close();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isOpen()) return;
    this.positionPanel();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.isOpen()) return;
    this.positionPanel();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  ngOnDestroy(): void {
    this.cancelRaf();
    try {
      this.returnFromBody();
    } catch {
      // no-op
    }
    if (IbsDropdownComponent.active === this) {
      IbsDropdownComponent.active = null;
    }
  }
}