import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Input,
  QueryList,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IbsModalTabComponent } from './ibs-modal-tab.component';

/**
 * Contenedor de tabs para modales IBS.
 * Si no se usa, el modal funciona exactamente igual que antes.
 *
 * Uso básico:
 *
 *   <app-ibs-modal-tabs>
 *
 *     <app-ibs-modal-tab label="Detalles" icon="bi bi-person">
 *       ... contenido del tab 1 ...
 *     </app-ibs-modal-tab>
 *
 *     <app-ibs-modal-tab label="Roles" icon="bi bi-shield">
 *       ... contenido del tab 2 ...
 *     </app-ibs-modal-tab>
 *
 *   </app-ibs-modal-tabs>
 */
@Component({
  selector: 'app-ibs-modal-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ibs-modal-tabs.component.html',
  styleUrls: ['./ibs-modal-tabs.component.scss'],
})
export class IbsModalTabsComponent implements AfterContentInit {

  @ContentChildren(IbsModalTabComponent)
  tabComponents!: QueryList<IbsModalTabComponent>;

  /** Tab inicial (0-based) */
  @Input() initialTab = 0;

  tabs: IbsModalTabComponent[] = [];

  readonly activeIndex = signal(0);

  constructor(private cd: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.tabs = this.tabComponents.toArray();
    this.activeIndex.set(
      Math.min(this.initialTab, Math.max(0, this.tabs.length - 1))
    );

    // Reacciona si los tabs cambian dinámicamente
    this.tabComponents.changes.subscribe(() => {
      this.tabs = this.tabComponents.toArray();
      this.cd.markForCheck();
    });
  }

  select(index: number): void {
    if (this.tabs[index]?.disabled) return;
    this.activeIndex.set(index);
  }

  /** Obtiene el template del tab en posición i */
  getTemplate(i: number) {
    return this.tabs[i]?.content ?? null;
  }
}