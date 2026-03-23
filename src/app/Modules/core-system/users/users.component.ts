import { ChangePasswordComponent } from './change-password/change-password.component';
import {
    ChangeDetectionStrategy,
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
} from '@shared/service-proxies/service-proxies';
import { CreateUserDialogComponent } from './create-user/create-user-dialog.component';
import { EditUserDialogComponent } from './edit-user/edit-user-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password/reset-password.component';
import { UsersAssignmentModalComponent } from './users-assignment/users-assignment-modal.component';
import { UsersPermissionsModalComponent } from './permissions-user/user-permissions-modal.component';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
    IbsGridAction,
    IbsGridColumn,
    IbsGridComponent,
    IbsGridQuery,
} from '../../../controls/ibs-grid/ibs-grid.component';

@Component({
    templateUrl: './users.component.html',
    animations: [appModuleAnimation()],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, IbsGridComponent],
})
export class UsersComponent
    extends PagedListingComponentBase<UserDto>
    implements OnInit
{
    @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<{ $implicit: UserDto }>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<{ $implicit: UserDto }>;

    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<UserDto>;

    readonly createPolicy = 'Pages.Users';
    readonly updatePolicy = 'Pages.Users';
    readonly deletePolicy = 'Pages.Users';

    readonly columns = signal<IbsGridColumn<UserDto>[]>([]);
    readonly actions = signal<IbsGridAction<UserDto>[]>([]);

    keyword = '';
    isActive: boolean | null | undefined;

    readonly loadUsers = (q: IbsGridQuery) =>
        this._userService
            .getAll(
                q.filter ?? this.keyword,
                this.isActive,
                q.sorting ?? '',
                q.skipCount ?? 0,
                q.maxResultCount ?? 10
            )
            .pipe(
                map(result => ({
                    items: result.items ?? [],
                    totalCount: result.totalCount ?? 0,
                })),
                finalize(() => this.cd.detectChanges())
            );

    constructor(
        injector: Injector,
        private _userService: UserServiceProxy,
        private _modalService: BsModalService,
        private _activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword =
            this._activatedRoute.snapshot.queryParams['filterText'] ?? '';
    }

    ngOnInit(): void {
        this.columns.set([
            {
                key: 'isActive',
                header: 'Activo',
                template: this.activeTpl,
                align: 'center',
            },
            {
                key: 'userName',
                header: 'Usuario',
                field: 'userName',
            },
            {
                key: 'fullName',
                header: 'Nombre',
                template: this.nameTpl,
            },
            {
                key: 'emailAddress',
                header: 'Correo',
                field: 'emailAddress',
            },
        ]);

        this.actions.set([
            {
                id: 'permissions',
                text: 'Permisos',
                icon: 'bi bi-shield-lock',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.openPermissions(row),
            },
            {
                id: 'edit',
                text: 'Editar',
                icon: 'bi bi-pencil-square',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.editUser(row),
            },
            {
                id: 'assignUser',
                text: 'Asignar roles',
                icon: 'bi bi-person-gear',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.usersAssignment(row),
            },
            {
                id: 'changePass',
                text: 'Change Password',
                icon: 'bi bi-key',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.changePassword(row),
            },
            {
                id: 'resetPass',
                text: 'Reset Password',
                icon: 'bi bi-arrow-clockwise',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.resetPassword(row),
            },
            {
                id: 'delete',
                text: 'Eliminar',
                icon: 'bi bi-trash',
                danger: true,
                requiredPolicy: this.deletePolicy,
                disabled: (row) => row.userName === 'admin',
                run: (row) => this.delete(row),
            },
        ]);
    }

    onCreate(): void {
        this.createUser();
    }

    refresh(): void {
        this.grid?.reload();
    }

    list(): void {
        this.grid?.reloadFirstPage();
    }

    clearFilters(): void {
        this.keyword = '';
        this.isActive = undefined;
        this.grid?.reloadFirstPage();
    }

    createUser(): void {
        this.showCreateOrEditUserDialog();
    }

    editUser(user: UserDto): void {
        this.showCreateOrEditUserDialog(user.id);
    }

    openPermissions(user: UserDto): void {
        const userId = Number(user?.id ?? 0);
        const userName =
            (user?.fullName ?? '').trim() ||
            `${user?.name ?? ''} ${user?.surname ?? ''}`.trim() ||
            user?.userName ||
            '';

        if (!userId || userId <= 0) {
            abp.message.warn(
                'No se pudo abrir los permisos porque el usuario no tiene un identificador válido.',
                'Advertencia'
            );
            return;
        }

        const ref: BsModalRef<UsersPermissionsModalComponent> = this._modalService.show(
            UsersPermissionsModalComponent,
            {
                class: 'modal-xl',
                ignoreBackdropClick: true,
                initialState: {
                    userId,
                    userName,
                },
            }
        );

        ref.content?.saved?.subscribe(() => {
            abp.notify.success(this.l('SavedSuccessfully'));
            this.refresh();
            ref.hide();
        });

        ref.content?.cancelled?.subscribe(() => {
            ref.hide();
        });
    }

    usersAssignment(user: UserDto): void {
        this.showUsersAssignmentDialog(user);
    }

    resetPassword(user: UserDto): void {
        this._modalService.show(ResetPasswordDialogComponent, {
            class: 'modal-lg',
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

        ref.content?.onSave?.subscribe(() => this.refresh());
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

    private showCreateOrEditUserDialog(id?: number): void {
        const ref: BsModalRef = id
            ? this._modalService.show(EditUserDialogComponent, {
                  class: 'modal-lg',
                  initialState: { id },
              })
            : this._modalService.show(CreateUserDialogComponent, {
                  class: 'modal-lg',
              });

        ref.content?.onSave?.subscribe(() => this.refresh());
    }

    private showUsersAssignmentDialog(user: UserDto): void {
        const userId = user?.id;
        const userName =
            (user?.fullName ?? '').trim() ||
            `${user?.name ?? ''} ${user?.surname ?? ''}`.trim() ||
            user?.userName ||
            '';

        if (!userId || Number(userId) <= 0) {
            abp.message.warn(
                'No se pudo abrir la asignación de roles porque el usuario no tiene un identificador válido.',
                'Advertencia'
            );
            return;
        }

        const ref: BsModalRef<UsersAssignmentModalComponent> = this._modalService.show(
            UsersAssignmentModalComponent,
            {
                class: 'modal-lg',
                ignoreBackdropClick: true,
            }
        );

        if (!ref.content) {
            abp.message.warn(
                'No se pudo inicializar el modal de asignación de roles.',
                'Advertencia'
            );
            return;
        }

        ref.content.userId = userId;
        ref.content.userName = userName;
        ref.content.initialize(userId, userName);

        ref.content.save?.subscribe(() => {
            this.refresh();
        });

        ref.content.cancelled?.subscribe(() => {
            ref.hide();
        });
    }
}