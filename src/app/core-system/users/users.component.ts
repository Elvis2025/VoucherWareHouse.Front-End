import { ChangeDetectorRef, Component, Injector, OnInit, TemplateRef, ViewChild, signal } from '@angular/core';
import { map, finalize } from 'rxjs/operators';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PagedListingComponentBase } from 'shared/paged-listing-component-base';
import { UserServiceProxy, UserDto, RoleDto } from '@shared/service-proxies/service-proxies';
import { CreateUserDialogComponent } from './create-user/create-user-dialog.component';
import { EditUserDialogComponent } from './edit-user/edit-user-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password/reset-password.component';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IbsGridAction, IbsGridColumn, IbsGridComponent, IbsGridQuery } from '../../controls/ibs-grid/ibs-grid.component';

@Component({
    templateUrl: './users.component.html',
    animations: [appModuleAnimation()],
    standalone: true,
    imports: [FormsModule, IbsGridComponent],
})
export class UsersComponent extends PagedListingComponentBase<UserDto> implements OnInit {
    @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<any>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<UserDto>;

    users: UserDto[] = [];
    keyword = '';
    isActive: boolean | null | undefined;
    advancedFiltersVisible = false;

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly columns = signal<IbsGridColumn<UserDto>[]>([]);
    readonly actions = signal<IbsGridAction<UserDto>[]>([]);

    readonly createPolicy = 'Pages.Users';
    readonly updatePolicy = 'Pages.Users';
    readonly deletePolicy = 'Pages.Users';
    readonly manageRolesPolicy = 'Pages.Users';
    readonly managePermissionsPolicy = 'Pages.Users';

    readonly editOpen = signal(false);
    readonly editMode = signal<'create' | 'edit'>('create');
    readonly editModel = signal<UserDto | null>(null);

    readonly rolesOpen = signal(false);
    readonly rolesModel = signal<RoleDto | null>(null);

    readonly permsOpen = signal(false);
    readonly permsUserId = signal<string | null>(null);
    readonly permsUserName = signal<string | null>(null);

    readonly assignOpen = signal(false);
    readonly assignUserId = signal<string | null>(null);
    readonly assignUserName = signal<string | null>(null);

    readonly loadUsers = (q: IbsGridQuery) => {
        this.error.set(null);
        this.loading.set(true);

        return this._userService
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
                finalize(() => {
                    this.loading.set(false);
                    this.cd.detectChanges();
                })
            );
    };

    constructor(
        injector: Injector,
        private _userService: UserServiceProxy,
        private _modalService: BsModalService,
        private _activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword = this._activatedRoute.snapshot.queryParams['filterText'] || '';
    }

    ngOnInit(): void {
        this.columns.set([
            {
                key: 'userName',
                header: 'Usuario',
                field: 'userName',
                width: '23%'
            },
            {
                key: 'fullName',
                header: 'Nombre',
                template: this.nameTpl,
                sortable: true,
                field: 'name',
                width: '23.5%'
            },
            {
                key: 'emailAddress',
                header: 'Correo',
                sortable: true,
                field: 'emailAddress',
                width: '28.5%'
            },
            {
                key: 'isActive',
                header: 'Activo',
                sortable: false,
                template: this.activeTpl,
                align: 'center',
                width: '110px'
            },
        ]);

        this.actions.set([
            {
                id: 'edit',
                text: 'Editar',
                icon: 'bi bi-pencil-square',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.editUser(row),
            },
            {
                id: 'resetPass',
                text: 'Reset Password',
                icon: 'bi bi-shield-lock',
                requiredPolicy: this.updatePolicy,
                run: (row) => this.resetPassword(row),
            },
            {
                id: 'delete',
                text: 'Eliminar',
                icon: 'bi bi-trash',
                danger: true,
                requiredPolicy: this.deletePolicy,
                run: (row) => this.delete(row),
            },
        ]);
    }

    onCreate(): void {
        this.createUser();
    }

    createUser(): void {
        this.showCreateOrEditUserDialog();
    }

    editUser(user: UserDto): void {
        this.showCreateOrEditUserDialog(user.id);
    }

    resetPassword(user: UserDto): void {
        this.showResetPasswordUserDialog(user.id);
    }

    clearFilters(): void {
        this.keyword = '';
        this.isActive = undefined;
        this.grid?.reloadFirstPage();
    }

    list(): void {
        this.grid?.reloadFirstPage();
    }

    refresh(): void {
        this.grid?.reload();
    }

    delete(user: UserDto): void {
        abp.message.confirm(this.l('UserDeleteWarningMessage', user.fullName), undefined, (result: boolean) => {
            if (result) {
                this._userService.delete(user.id).subscribe(() => {
                    abp.notify.success(this.l('SuccessfullyDeleted'));
                    this.refresh();
                });
            }
        });
    }

    private showResetPasswordUserDialog(id?: number): void {
        this._modalService.show(ResetPasswordDialogComponent, {
            class: 'modal-lg',
            initialState: {
                id: id,
            },
        });
    }

    private showCreateOrEditUserDialog(id?: number): void {
        let createOrEditUserDialog: BsModalRef;

        if (!id) {
            createOrEditUserDialog = this._modalService.show(CreateUserDialogComponent, {
                class: 'modal-lg',
            });
        } else {
            createOrEditUserDialog = this._modalService.show(EditUserDialogComponent, {
                class: 'modal-lg',
                initialState: {
                    id: id,
                },
            });
        }

        createOrEditUserDialog.content.onSave.subscribe(() => {
            this.refresh();
        });
    }
}