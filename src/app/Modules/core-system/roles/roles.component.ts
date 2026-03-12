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

import { CreateRoleDialogComponent } from './create-role/create-role-dialog.component';
import { EditRoleDialogComponent } from './edit-role/edit-role-dialog.component';
import { RolesPermissionsModalComponent } from './permissions-roles/roles-permissions-modal.component';

import {
  IbsGridAction,
  IbsGridColumn,
  IbsGridComponent,
  IbsGridQuery,
} from '../../../controls/ibs-grid/ibs-grid.component';
import { LocalizePipe } from '../../../../shared/pipes/localize.pipe';
import { PagedListingComponentBase } from '../../../../shared/paged-listing-component-base';
import { RoleDto, RoleServiceProxy } from '../../../../shared/service-proxies/service-proxies';
import { appModuleAnimation } from '../../../../shared/animations/routerTransition';


@Component({
  templateUrl: './roles.component.html',
  animations: [appModuleAnimation()],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IbsGridComponent, LocalizePipe],
})
export class RolesComponent
  extends PagedListingComponentBase<RoleDto>
  implements OnInit
{
  @ViewChild(IbsGridComponent) grid?: IbsGridComponent<RoleDto>;

  readonly createPolicy = 'Pages.Roles';
  readonly updatePolicy = 'Pages.Roles';
  readonly deletePolicy = 'Pages.Roles';

  readonly columns = signal<IbsGridColumn<RoleDto>[]>([]);
  readonly actions = signal<IbsGridAction<RoleDto>[]>([]);
  readonly keyword = signal('');

  readonly loadRoles = (q: IbsGridQuery) =>
    this.rolesService
      .getAll(
        (q.filter ?? this.keyword()).trim(),
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
    private readonly rolesService: RoleServiceProxy,
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
    this.createRole();
  }

  refresh(): void {
    this.grid?.reload();
  }

  list(): void {
    this.grid?.reloadFirstPage();
  }

  createRole(): void {
    this.showCreateOrEditRoleDialog();
  }

  editRole(role: RoleDto): void {
    this.showCreateOrEditRoleDialog(role.id);
  }

  openPermissions(role: RoleDto): void {
    const ref: BsModalRef = this.modalService.show(RolesPermissionsModalComponent, {
      class: 'modal-xl',
      initialState: {
        roleId: role.id,
        roleName: role.name,
        roleDisplay: role.displayName,
      },
    });

    ref.content?.saved?.subscribe(() => {
      abp.notify.success(this.l('SavedSuccessfully'));
      this.refresh();
      ref.hide();
    });

    ref.content?.cancelled?.subscribe(() => {
      ref.hide();
    });
  }

  delete(role: RoleDto): void {
    abp.message.confirm(
      this.l('RoleDeleteWarningMessage', role.displayName),
      undefined,
      (result: boolean) => {
        if (!result) {
          return;
        }

        this.rolesService.delete(role.id).subscribe(() => {
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
        key: 'name',
        header: 'RoleName',
        field: 'name',
        width: '40%',
      },
      {
        key: 'displayName',
        header: 'DisplayName',
        field: 'displayName',
        width: '45%',
      },
    ]);
  }

  private configureActions(): void {
    this.actions.set([
      {
        id: 'permissions',
        text: 'Permissions',
        icon: 'bi bi-shield-lock',
        requiredPolicy: this.updatePolicy,
        run: (row) => this.openPermissions(row),
      },
      {
        id: 'edit',
        text: 'Edit',
        icon: 'bi bi-pencil-square',
        requiredPolicy: this.updatePolicy,
        run: (row) => this.editRole(row),
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

  private showCreateOrEditRoleDialog(id?: number): void {
    const ref: BsModalRef = id
      ? this.modalService.show(EditRoleDialogComponent, {
          class: 'modal-lg',
          initialState: { id },
        })
      : this.modalService.show(CreateRoleDialogComponent, {
          class: 'modal-lg',
        });

    ref.content?.onSave?.subscribe(() => {
      this.refresh();
    });
  }
}