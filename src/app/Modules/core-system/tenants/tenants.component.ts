import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injector,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { map, finalize } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ActivatedRoute } from '@angular/router';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import {
  TenantDto,
  TenantServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { CreateTenantDialogComponent } from './create-tenant/create-tenant-dialog.component';
import { EditTenantDialogComponent } from './edit-tenant/edit-tenant-dialog.component';

import {
  IbsGridAction,
  IbsGridColumn,
  IbsGridComponent,
  IbsGridQuery,
} from '../../../controls/ibs-grid/ibs-grid.component';

@Component({
  templateUrl: './tenants.component.html',
  animations: [appModuleAnimation()],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IbsGridComponent, LocalizePipe],
})
export class TenantsComponent
  extends PagedListingComponentBase<TenantDto>
  implements OnInit
{
  @ViewChild(IbsGridComponent) grid?: IbsGridComponent<TenantDto>;

  readonly createPolicy = 'Pages.Tenants';
  readonly updatePolicy = 'Pages.Tenants';
  readonly deletePolicy = 'Pages.Tenants';

  readonly columns = signal<IbsGridColumn<TenantDto>[]>([]);
  readonly actions = signal<IbsGridAction<TenantDto>[]>([]);

  readonly keyword = signal('');
  readonly isActive = signal<boolean | undefined>(undefined);

  readonly loadTenants = (q: IbsGridQuery) =>
    this.tenantService
      .getAll(
        (q.filter ?? this.keyword()).trim(),
        this.isActive(),
        q.sorting ?? '',
        q.skipCount ?? 0,
        q.maxResultCount ?? 10
      )
      .pipe(
        map((result) => ({
          items: result.items ?? [],
          totalCount: result.totalCount ?? 0,
        })),
        finalize(() => this.cd.detectChanges())
      );

  constructor(
    injector: Injector,
    private readonly tenantService: TenantServiceProxy,
    private readonly modalService: BsModalService,
    private readonly activatedRoute: ActivatedRoute,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
    this.keyword.set(this.activatedRoute.snapshot.queryParams['keyword'] ?? '');
  }

  ngOnInit(): void {
    this.configureColumns();
    this.configureActions();
  }

  onCreate(): void {
    this.createTenant();
  }

  refresh(): void {
    this.grid?.reload();
  }

  list(): void {
    this.grid?.reloadFirstPage();
  }

  clearFilters(): void {
    this.keyword.set('');
    this.isActive.set(undefined);
    this.grid?.reloadFirstPage();
  }

  createTenant(): void {
    this.showCreateOrEditTenantDialog();
  }

  editTenant(tenant: TenantDto): void {
    this.showCreateOrEditTenantDialog(tenant.id);
  }

  delete(tenant: TenantDto): void {
    abp.message.confirm(
      this.l('TenantDeleteWarningMessage', tenant.name),
      undefined,
      (result: boolean) => {
        if (!result) {
          return;
        }

        this.tenantService.delete(tenant.id).subscribe(() => {
          abp.notify.success(this.l('SuccessfullyDeleted'));
          this.refresh();
        });
      }
    );
  }

  protected listFilteredItems(): void {}

  private configureColumns(): void {
    this.columns.set([
      {
        key: 'tenancyName',
        header: 'Nombre',
        field: 'tenancyName',
        width: '30%',
      },
      {
        key: 'name',
        header: 'Name',
        field: 'name',
        width: '35%',
      },
      {
        key: 'isActive',
        header: 'Activo',
        field: 'isActive',
        align: 'center',
        width: '15%',
      },
    ]);
  }

  private configureActions(): void {
    this.actions.set([
      {
        id: 'edit',
        text: 'Edit',
        icon: 'bi bi-pencil-square',
        requiredPolicy: this.updatePolicy,
        run: (row) => this.editTenant(row),
      },
      {
        id: 'delete',
        text: 'Delete',
        icon: 'bi bi-trash',
        danger: true,
        requiredPolicy: this.deletePolicy,
        run: (row) => this.delete(row),
      },
    ]);
  }

  private showCreateOrEditTenantDialog(id?: number): void {
    const ref: BsModalRef = id
      ? this.modalService.show(EditTenantDialogComponent, {
          class: 'modal-lg',
          initialState: { id },
        })
      : this.modalService.show(CreateTenantDialogComponent, {
          class: 'modal-lg',
        });

    ref.content?.onSave?.subscribe(() => {
      this.refresh();
    });
  }
}