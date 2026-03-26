import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Injector, OnInit, signal, TemplateRef, ViewChild, viewChild } from "@angular/core";
import { IbsModalHeaderComponent } from "../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IbsModalTopBarComponent } from "../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component";
import { IbsModalBodyComponent } from "../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component";
import { IbsModalFooterComponent } from "../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component";
import { IbsModalShellComponent } from "../../../controls/ibs-modal/ibs-modal-shell.component";
import { IbsGridAction, IbsGridColumn, IbsGridComponent, IbsGridQuery } from "../../../controls/ibs-grid/ibs-grid.component";
import { PagedListingComponentBase } from "../../../../shared/paged-listing-component-base";
import { EcfApiAuthenticationInputDto, EcfApiAuthenticationLoginDto, EcfApiAuthenticationOutputDto } from "../../../../shared/service-proxies/services/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.model.service";
import { LazyLoadEvent } from "primeng/api";

import { ActivatedRoute } from "@angular/router";
import { finalize, map, Observable } from "rxjs";
import { EcfApiAuthenticationCreateDialogComponent } from "./ecf-api-authentication-create/ecf-api-authentication-create-dialog.component";
import { EcfApiAuthenticationUpdateDialogComponent } from "./ecf-api-authentication-update/ecf-api-authentication-update-dialog.component";
import { EcfApiAuthenticationService } from "../../../../shared/service-proxies/services/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";



@Component({
    selector: 'app-ecf-api-authentication',
    standalone: true,
     imports: [
    CommonModule,
    FormsModule,
    IbsGridComponent
  ],
    templateUrl: './ecf-api-authentication.component.html',
    styleUrls: ['./ecf-api-authentication.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class EcfApiAuthenticationComponent extends PagedListingComponentBase<EcfApiAuthenticationOutputDto> implements OnInit{
    @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<{ $implicit: EcfApiAuthenticationOutputDto }>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<{ $implicit: EcfApiAuthenticationOutputDto }>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<EcfApiAuthenticationOutputDto>;
    
    constructor(
        injector: Injector,
        private ecfApiAuthenticationService: EcfApiAuthenticationService,
        private modalService: BsModalService,
        private activatedRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
        this.keyword =
            this.activatedRoute.snapshot.queryParams['filterText'] ?? '';
    }

    readonly createPolicy = "Pages.Users";
    readonly updatePolicy = "Pages.Users";
    readonly deletePolicy = "Pages.Users";

    readonly columns = signal<IbsGridColumn<EcfApiAuthenticationOutputDto>[]>([]);
    readonly actions = signal<IbsGridAction<EcfApiAuthenticationOutputDto>[]>([]);

    keyword = '';
    isActive: boolean;


   readonly loadEcfApiAuthentication = 
    (
        q: IbsGridQuery
    ): Observable<{ items: EcfApiAuthenticationOutputDto[]; totalCount: number }> => {
    const input = {} as unknown as EcfApiAuthenticationInputDto;

    input.skipCount = q.skipCount ?? 0;
    input.maxResultCount = q.maxResultCount ?? 10;
    input.sorting = q.sorting ?? '';
    //input.filterText = this.keyword ?? '';

    return this.ecfApiAuthenticationService
        .getAll(input)
        .pipe(
        map(result => ({
            items: result.items ?? [],
            totalCount: result.totalCount ?? 0
        })),
        finalize(() => this.cd.detectChanges())
        );
};



    protected list(event?: LazyLoadEvent): void {
         this.grid?.reloadFirstPage();
    }
       refresh(): void {
        this.grid?.reload();
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
                key: 'tenancyName',
                header: 'Tenant',
                field: 'tenancyName',
                width: '105px',
            },
            {
                key: 'userName',
                header: 'Usuario/Email',
                field: 'usernameOrEmailAddress',
                width: '115px',
            },
            
            {
                key: 'urlAuth',
                header: 'Url de autenticación',
                field: 'authUrl',
                width: '222px',
                showFullOnHover:true
            },
            {
                key: 'urlBase',
                header: 'Url Base',
                field: 'baseUrl',
                width: '100%',
                showFullOnHover:true
            },
            
        ]);

        this.actions.set([
            {
                id: 'edit',
                text: 'Editar',
                requiredPolicy: this.createPolicy,
                run: (row) => this.onEdit(row)
            },
            
            {
                id: 'testAuth',
                text: 'Probar Autenticación',
                requiredPolicy: this.createPolicy,
                run: (row) => this.onTestAuth()
            },

            {
                id: 'delete',
                text: 'Eliminar',
                requiredPolicy: this.createPolicy,
                danger: true,
                run: (row) => this.delete(row)
            },

        ]);
    }


    onEdit(input: EcfApiAuthenticationOutputDto): void {
        this.openCreateOrEditDialog(input.id);
    }

    onCreate(): void {
        this.openCreateOrEditDialog();
    }

    private openCreateOrEditDialog(id?: number){
         const ref: BsModalRef = id
                    ? this.modalService.show(EcfApiAuthenticationUpdateDialogComponent, {
                          class: 'modal-lg',
                          initialState:{id},
                      })
                    : this.modalService.show(EcfApiAuthenticationCreateDialogComponent, {
                          class: 'modal-lg',
                      });
                ref.content?.onSave?.subscribe(() => this.refresh());

                this.refresh();
    }
    
    protected delete(entity: EcfApiAuthenticationOutputDto): void {
        abp.message.confirm(
             this.l('UserDeleteWarningMessage', entity.tenancyName),
            undefined,
            (result: boolean) => {
                if (result) {
                    this.ecfApiAuthenticationService.delete(entity.id).subscribe(() => {
                        abp.notify.success(this.l('SuccessfullyDeleted'));
                        this.refresh();
                    });
                }
            }
        )


        
    }

    protected onTestAuth(): void {


        this.ecfApiAuthenticationService.testAuthenticateAPI().subscribe((result) => {

            console.log(result)
            if(!result.isSuccess){
                console.log('Error de autenticacion', result);
                abp.message.error(`Error de autenticacion: ${result.error?.message}. Codigo: (${result.error?.code})`);
                return;
            } 
            if(result.unAuthorizedRequest){
                abp.message.error('Error de autenticacion contra el api de facturación electrónica');
                return;
            }

            abp.message.success('Usuario autenticado exitosamente !!!');
    });


       


        
    }

    

}