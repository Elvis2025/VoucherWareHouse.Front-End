import { ChangePasswordComponent } from './change-password/change-password.component';
import {
    ChangeDetectorRef,
    Component,
    Injector,
    OnInit,
    TemplateRef,
    ViewChild,
    signal,
} from '@angular/core';
import { map, finalize } from 'rxjs/operators';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PagedListingComponentBase } from 'shared/paged-listing-component-base';
import {
    UserServiceProxy,
    UserDto,
    RoleDto,
} from '@shared/service-proxies/service-proxies';
import { CreateUserDialogComponent } from './create-user/create-user-dialog.component';
import { EditUserDialogComponent } from './edit-user/edit-user-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password/reset-password.component';
import { UsersAssignmentModalComponent } from './users-assignment/users-assignment-modal.component';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
    IbsGridAction,
    IbsGridColumn,
    IbsGridComponent,
    IbsGridQuery,
} from '../../controls/ibs-grid/ibs-grid.component';

@Component({
    templateUrl: './users.component.html',
    animations: [appModuleAnimation()],
    standalone: true,
    imports: [FormsModule, IbsGridComponent],
})
export class UsersComponent
    extends PagedListingComponentBase<UserDto>
    implements OnInit
{
    // ─── Templates para columnas con render custom ───────────────────────
    // NOTA: static:true porque se usan en ngOnInit (antes del primer CD)
    @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<{ $implicit: UserDto }>;
    @ViewChild('nameTpl',   { static: true }) nameTpl!:   TemplateRef<{ $implicit: UserDto }>;

    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<UserDto>;

    // ─── Policies ────────────────────────────────────────────────────────
    readonly createPolicy           = 'Pages.Users';
    readonly updatePolicy           = 'Pages.Users';
    readonly deletePolicy           = 'Pages.Users';

    // ─── Estado del grid ─────────────────────────────────────────────────
    readonly columns = signal<IbsGridColumn<UserDto>[]>([]);
    readonly actions = signal<IbsGridAction<UserDto>[]>([]);

    // Filtros extra que se pasan al service pero no al grid
    keyword  = '';
    isActive: boolean | null | undefined;

    // ─── Data loader (función pura, se pasa como @Input al grid) ─────────
    readonly loadUsers = (q: IbsGridQuery) =>
        this._userService
            .getAll(
                q.filter ?? this.keyword,
                this.isActive,
                q.sorting ?? '',
                q.skipCount    ?? 0,
                q.maxResultCount ?? 10
            )
            .pipe(
                map(result => ({
                    items:      result.items      ?? [],
                    totalCount: result.totalCount ?? 0,
                })),
                finalize(() => this.cd.detectChanges())
            );

    constructor(
        injector: Injector,
        private _userService:    UserServiceProxy,
        private _modalService:   BsModalService,
        private _activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword =
            this._activatedRoute.snapshot.queryParams['filterText'] ?? '';
    }

    ngOnInit(): void {
        // ─── Columnas ─────────────────────────────────────────────────────
        // REGLA: si la columna usa `template`, NO pongas `field`
        //        el template recibe la row completa como $implicit
        //        si no usa template, `field` define qué propiedad mostrar
        this.columns.set([
            {
                key:    'userName',
                header: 'Usuario',
                field:  'userName',   // ← sin template → field necesario
                width:  '15%',
            },
            {
                key:      'fullName',
                header:   'Nombre',
                template: this.nameTpl, // ← con template → NO field
                width:    '25%',
            },
            {
                key:    'emailAddress',
                header: 'Correo',
                field:  'emailAddress', // ← sin template → field necesario
                width:  '35%',
            },
            {
                key:      'isActive',
                header:   'Activo',
                template: this.activeTpl, // ← con template → NO field
                align:    'center',
                width:    '10%',
            },
            // La columna ACCIONES la genera el grid automáticamente
            // cuando pasas el @Input [actions]. No la pongas aquí.
        ]);

        // ─── Acciones por fila ────────────────────────────────────────────
        this.actions.set([
            {
                id:             'edit',
                text:           'Editar',
                icon:           'bi bi-pencil-square',
                requiredPolicy: this.updatePolicy,
                run:            (row) => this.editUser(row),
            },
            {
                id:             'assingUser',
                text:           'Asignar roles',
                icon:           'bi bi-pencil-square',  
                requiredPolicy: this.updatePolicy,
                run:            (row) => this.usersAssignment(row),
            },
            {
                id:             'resetPass',
                text:           'Change Password',
                icon:           'bi bi-key',
                requiredPolicy: this.updatePolicy,
                run:            (row) => this.changePassword(row),
            },
            {
                id:             'resetPass',
                text:           'Reset Password',
                icon:           'bi bi-arrow-clockwise',
                requiredPolicy: this.updatePolicy,
                run:            (row) => this.resetPassword(row),
            },
            {
                id:             'delete',
                text:           'Eliminar',
                icon:           'bi bi-trash',
                danger:         true,
                requiredPolicy: this.deletePolicy,
                disabled:         (row) => row.userName === 'admin', // Ejemplo: no permitir eliminar admin
                run:            (row) => this.delete(row),
            },
        ]);
    }

    // ─── Handlers del grid ───────────────────────────────────────────────
    onCreate():  void { this.createUser(); }
    refresh():   void { this.grid?.reload(); }
    list():      void { this.grid?.reloadFirstPage(); }

    clearFilters(): void {
        this.keyword  = '';
        this.isActive = undefined;
        this.grid?.reloadFirstPage();
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────
    createUser(): void {
        this.showCreateOrEditUserDialog();
    }

    editUser(user: UserDto): void {
        this.showCreateOrEditUserDialog(user.id);
    }

    usersAssignment(user: UserDto): void {
        this.showUsersAssignmentDialog(user.id);
    }

    resetPassword(user: UserDto): void {
        this._modalService.show(ResetPasswordDialogComponent, {
            class:        'modal-lg',
            initialState: { id: user.id },
        });
    }
    changePassword(user: UserDto): void {
      const ref: BsModalRef<ChangePasswordComponent> = this._modalService.show(
    ChangePasswordComponent,
    {
      class: 'modal-lg',
    }
  );

  ref.content?.onSave.subscribe(() => this.refresh());
    }

    delete(user: UserDto): void {
        abp.message.confirm(
            this.l('UserDeleteWarningMessage', user.fullName),
            undefined,
            (result: boolean) => {
                if (result) {
                    this._userService.delete(user.id).subscribe(() => {
                        abp.notify.success(this.l('SuccessfullyDeleted'));
                        this.refresh();
                    });
                }
            }
        );
    }

    // ─── Privados ─────────────────────────────────────────────────────────
    private showCreateOrEditUserDialog(id?: number): void {
        const ref: BsModalRef = id
            ? this._modalService.show(EditUserDialogComponent, {
                  class:        'modal-lg',
                  initialState: { id },
              })
            : this._modalService.show(CreateUserDialogComponent, {
                  class: 'modal-lg',
              });

        ref.content.onSave.subscribe(() => this.refresh());
    }

    
    private showUsersAssignmentDialog(id?: number): void {
        const ref: BsModalRef =  this._modalService.show(UsersAssignmentModalComponent, {
                  class: 'modal-lg',
              });

        ref.content.onSave.subscribe(() => this.refresh());
    }


}