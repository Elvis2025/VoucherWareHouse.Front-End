import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { BsModalService } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import {
    Observable,
    Subject,
    Subscription,
    catchError,
    finalize,
    interval,
    map,
    of,
    startWith,
    switchMap,
    takeUntil
} from "rxjs";

import { PagedListingComponentBase } from "../../../../shared/paged-listing-component-base";
import {
    CancelEcfVoucherJobInputDto,
    EcfVoucherJobStatusDto,
    EcfVoucherWarehouseInputDto,
    EcfVoucherWarehouseOutputDto,
    GetEcfVoucherJobsInputDto,
    LoadExcelInputDto,
    UploadJobResponseDto
} from "../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.model.service";
import { EcfVoucherWarehouseService } from "../../../../shared/service-proxies/services/voucher-warehouse/ecf-voucher-warehouse/ecf-voucher-warehouse.service";
import {
    IbsGridAction,
    IbsGridColumn,
    IbsGridComponent,
    IbsGridQuery
} from "../../../controls/ibs-grid/ibs-grid.component";



@Component({
    selector: 'app-generate-ecf-voucher-warehouse',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IbsGridComponent
    ],
    templateUrl: './generate-ecf-voucher-warehouse.component.html',
    styleUrls: ['./generate-ecf-voucher-warehouse.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateEcfVoucherWarehouseComponent
    extends PagedListingComponentBase<EcfVoucherWarehouseOutputDto>
    implements OnInit, OnDestroy {

    @ViewChild('activeTpl', { static: true }) activeTpl!: TemplateRef<{ $implicit: EcfVoucherWarehouseOutputDto }>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<{ $implicit: EcfVoucherWarehouseOutputDto }>;
    @ViewChild(IbsGridComponent) grid?: IbsGridComponent<EcfVoucherWarehouseOutputDto>;

    selectedFile: File | null = null;
    isUploading = false;

    activeJobs: EcfVoucherJobStatusDto[] = [];
    private readonly destroy$ = new Subject<void>();
    private jobsPollingSubscription?: Subscription;

    constructor(
        injector: Injector,
        private ecfVoucherWarehouseService: EcfVoucherWarehouseService,
        private modalService: BsModalService,
        private activateRoute: ActivatedRoute,
        cd: ChangeDetectorRef
    ) {
        super(injector, cd);
    }

    readonly readPolicy = "Pages.Users";
    readonly columns = signal<IbsGridColumn<EcfVoucherWarehouseOutputDto>[]>([]);
    readonly actions = signal<IbsGridAction<EcfVoucherWarehouseOutputDto>[]>([]);

    filterText = '';
    isActive: Boolean;

    readonly loadEcfVouchers =
        (q: IbsGridQuery): Observable<{ items: EcfVoucherWarehouseOutputDto[]; totalCount: number }> => {
            const input = {} as unknown as EcfVoucherWarehouseInputDto;

            input.skipCount = q.skipCount ?? 0;
            input.maxResultCount = q.maxResultCount ?? 0;
            input.sorting = q.sorting ?? '';
            input.skipCount = q.skipCount ?? 0;
            input.filterText = q.filter ?? '';

            return this.ecfVoucherWarehouseService
                .getAll(input)
                .pipe(
                    map(result => ({
                        items: result.items,
                        totalCount: result.totalCount ?? 0
                    })),
                    finalize(() => this.cd.detectChanges())
                );
        };

    ngOnInit(): void {
        this.columns.set([
            {
                key: 'code',
                header: 'Codigo Interno',
                field: 'code',
                width: '118px'
            },
            {
                key: 'status',
                header: 'Estado',
                field: 'statusFomatted',
                width: '190px'
            },
            {
                key: 'dgiiQrCodeUrl',
                header: 'Consulta a la DGII',
                field: 'dgiiQrCodeUrl',
                width: '160px',
                isQrCode: true,
                linkText: () => 'Consultar e-NCF',
                linkTarget: '_blank',
                qrActionText: 'Consultar e-NCF'
            },
            {
                key: 'dgiiResponseMessage',
                header: 'Respuesta de la DGII',
                field: 'dgiiResponseMessage',
                width: '162px',
                showFullOnHover: true
            },
            {
                key: 'dgiiUsedSequence',
                header: 'Secuencia consumida',
                field: 'dgiiUsedSequenceFormatted',
                width: '160px',
                align: 'center',
            },
            {
                key: 'tipoECF',
                header: 'Tipo de NCF',
                field: 'tipoECF',
                width: '110px'
            },
            {
                key: 'eNCF',
                header: 'e-NCF',
                field: 'encf',
                width: '150px'
            },
            {
                key: 'rNCEmisor',
                header: 'RNC Emisor',
                field: 'rncEmisor',
                width: '150px'
            },
            {
                key: 'razonSocialEmisor',
                header: 'Razón social emisor',
                field: 'razonSocialEmisor',
                width: '150px'
            },
            {
                key: 'rNCComprador',
                header: 'RNC Comprador',
                field: 'rncComprador',
                width: '150px'
            },
            {
                key: 'razonSocialComprador',
                header: 'Razón social comprador',
                field: 'razonSocialComprador',
                width: '150px'
            },
            {
                key: 'fechaEmision',
                header: 'Fecha de Emisión',
                field: 'fechaEmision',
                width: '150px'
            },
            {
                key: 'totalITBIS',
                header: 'Monto de ITBIS',
                field: 'totalITBIS',
                width: '150px'
            },
            {
                key: 'montoTotal',
                header: 'Monto Total',
                field: 'montoTotal',
            }
        ]);

        this.startJobsRealtimePolling();
    }

    ngOnDestroy(): void {
        this.jobsPollingSubscription?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    protected list(event?: LazyLoadEvent): void {
        this.grid?.reloadFirstPage();
    }

    refresh(): void {
        this.grid?.reload();
    }

    loadFile(): void {
        abp.message.success("KLK");
    }

    onExcelSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0] ?? null;
        this.cd.detectChanges();
    }

    clearSelectedFile(fileInput?: HTMLInputElement): void {
        this.selectedFile = null;

        if (fileInput) {
            fileInput.value = '';
        }

        this.cd.detectChanges();
    }

    uploadExcel(fileInput?: HTMLInputElement): void {
        if (!this.selectedFile) {
            abp.message.warn('Debe seleccionar un archivo Excel.');
            return;
        }

        const fileName = this.selectedFile.name.toLowerCase();
        const isExcelFile = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');

        if (!isExcelFile) {
            abp.message.warn('Solo se permiten archivos Excel (.xls, .xlsx).');
            return;
        }

        this.isUploading = true;

        const dto: LoadExcelInputDto = {
            file: this.selectedFile
        };

        (this.ecfVoucherWarehouseService.sendEcfExcel(dto) as Observable<UploadJobResponseDto | void>)
            .pipe(
                finalize(() => {
                    this.isUploading = false;
                    this.cd.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    abp.notify.success('Archivo cargado correctamente. El procesamiento fue enviado a segundo plano.');
                    this.clearSelectedFile(fileInput);
                    this.grid?.reloadFirstPage();
                    this.refreshJobsNow();
                },
                error: (error) => {
                    const message =
                        error?.error?.error?.message ||
                        error?.error?.message ||
                        'Ocurrió un error al cargar el archivo Excel.';
                    abp.message.error(message);
                }
            });
    }

    cancelJob(job: EcfVoucherJobStatusDto): void {
        abp.message.confirm(
            `¿Estás seguro de que deseas cancelar el procesamiento del archivo "${job.fileName}"?`,
            'Confirmar cancelación',
            (isConfirmed: boolean) => {
                if (!isConfirmed) {
                    return;
                }

                const payload: CancelEcfVoucherJobInputDto = {
                    jobId: job.jobId
                };

                this.cancelJobRequest(payload).subscribe({
                    next: () => {
                        abp.notify.info(`Se solicitó la cancelación del job: ${job.fileName}`);

                        // Lo quitamos inmediatamente del HUD
                        this.activeJobs = this.activeJobs.filter(x => x.jobId !== job.jobId);
                        this.expandedJobIds.delete(job.jobId);

                        this.cd.detectChanges();

                        // Refrescar estado desde backend
                        this.refreshJobsNow();
                    },
                    error: (error) => {
                        const message =
                            error?.error?.error?.message ||
                            error?.error?.message ||
                            'No se pudo cancelar el job.';
                        abp.message.error(message);
                    }
                });
            }
        );
    }

    trackByJob(_: number, job: EcfVoucherJobStatusDto): string {
        return job.jobId;
    }

    getProgressValue(job: EcfVoucherJobStatusDto): number {
        if (!job) {
            return 0;
        }

        if (job.totalRows <= 0) {
            if (job.status === 'Processing') {
                return 12;
            }

            if (job.status === 'CancellationRequested') {
                return 100;
            }

            return 0;
        }

        const rawValue = (job.processedRows / job.totalRows) * 100;
        return Math.max(0, Math.min(100, rawValue));
    }

    getPendingRows(job: EcfVoucherJobStatusDto): number {
        return Math.max(0, (job.totalRows ?? 0) - (job.processedRows ?? 0));
    }

    getStatusLabel(job: EcfVoucherJobStatusDto): string {
        switch (job?.status) {
            case 'Pending':
                return 'En cola';
            case 'Processing':
                return 'Procesando';
            case 'CancellationRequested':
                return 'Cancelando';
            case 'Completed':
                return 'Completado';
            case 'CompletedWithErrors':
                return 'Completado con errores';
            case 'Failed':
                return 'Fallido';
            case 'Cancelled':
                return 'Cancelado';
            default:
                return job?.status ?? 'Desconocido';
        }
    }

    getStatusClass(job: EcfVoucherJobStatusDto): string {
        switch (job?.status) {
            case 'Pending':
                return 'job-chip--pending';
            case 'Processing':
                return 'job-chip--processing';
            case 'CancellationRequested':
                return 'job-chip--canceling';
            case 'Completed':
                return 'job-chip--completed';
            case 'CompletedWithErrors':
                return 'job-chip--warning';
            case 'Failed':
                return 'job-chip--failed';
            case 'Cancelled':
                return 'job-chip--cancelled';
            default:
                return 'job-chip--pending';
        }
    }

    canCancelJob(job: EcfVoucherJobStatusDto): boolean {
        return !!job &&
            !job.isCancellationRequested &&
            job.isActive &&
            job.status !== 'Cancelled' &&
            job.status !== 'Completed' &&
            job.status !== 'CompletedWithErrors' &&
            job.status !== 'Failed';
    }

    formatElapsed(job: EcfVoucherJobStatusDto): string {
        const startDate = job?.startTime ? new Date(job.startTime) : null;
        if (!startDate) {
            return 'Iniciando...';
        }

        const endDate = job?.endTime ? new Date(job.endTime) : new Date();
        const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }

        return `${seconds}s`;
    }

    get activeJobsCount(): number {
        return this.activeJobs.length;
    }

    get activeJobsTotalRows(): number {
        return this.activeJobs.reduce((sum, job) => sum + (job.totalRows || 0), 0);
    }

    get activeJobsProcessedRows(): number {
        return this.activeJobs.reduce((sum, job) => sum + (job.processedRows || 0), 0);
    }

    get activeJobsPendingRows(): number {
        return this.activeJobs.reduce((sum, job) => sum + this.getPendingRows(job), 0);
    }

    get overallProgressPercentage(): number {
        const total = this.activeJobsTotalRows;
        if (total <= 0) {
            return 0;
        }

        return Math.max(0, Math.min(100, (this.activeJobsProcessedRows / total) * 100));
    }

    protected delete(entity: EcfVoucherWarehouseOutputDto): void {
        throw new Error("Method not implemented.");
    }

    private startJobsRealtimePolling(): void {
        this.jobsPollingSubscription?.unsubscribe();

        this.jobsPollingSubscription = interval(1000)
            .pipe(
                startWith(0),
                switchMap(() => this.getJobsStatusRequest({
                    onlyActive: true,
                    maxResultCount: 12
                })),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (jobs) => {
                    this.setVisibleJobs(jobs);
                    this.cd.detectChanges();
                },
                error: () => {
                    this.activeJobs = [];
                    this.cd.detectChanges();
                }
            });
    }

    private refreshJobsNow(): void {
        this.getJobsStatusRequest({
            onlyActive: true,
            maxResultCount: 12
        }).subscribe({
            next: (jobs) => {
                this.setVisibleJobs(jobs);
                this.refresh();
                this.cd.detectChanges();

            },
            error: () => {
                this.cd.detectChanges();
            }
        });
    }

    private getJobsStatusRequest(input: GetEcfVoucherJobsInputDto): Observable<EcfVoucherJobStatusDto[]> {
        const service = this.ecfVoucherWarehouseService as any;

        if (typeof service.getJobsStatus === 'function') {
            return (service.getJobsStatus(input) as Observable<EcfVoucherJobStatusDto[]>)
                .pipe(catchError(() => of([])));
        }

        if (typeof service.getImportsStatus === 'function') {
            return (service.getImportsStatus(input) as Observable<EcfVoucherJobStatusDto[]>)
                .pipe(catchError(() => of([])));
        }

        if (typeof service.getActiveJobsStatus === 'function') {
            return (service.getActiveJobsStatus(input) as Observable<EcfVoucherJobStatusDto[]>)
                .pipe(catchError(() => of([])));
        }

        return of([]);
    }

    private cancelJobRequest(input: CancelEcfVoucherJobInputDto): Observable<void> {
        const service = this.ecfVoucherWarehouseService as any;

        if (typeof service.cancelJob === 'function') {
            return service.cancelJob(input) as Observable<void>;
        }

        if (typeof service.requestImportCancellation === 'function') {
            return service.requestImportCancellation(input) as Observable<void>;
        }

        if (typeof service.cancelImportJob === 'function') {
            return service.cancelImportJob(input) as Observable<void>;
        }

        return of(void 0);
    }

    expandedJobIds = new Set<string>();

    toggleJobExpanded(jobId: string): void {
        if (!jobId) {
            return;
        }

        if (this.expandedJobIds.has(jobId)) {
            this.expandedJobIds.delete(jobId);
        } else {
            this.expandedJobIds.add(jobId);
        }

        this.cd.detectChanges();
    }

    isJobExpanded(jobId: string): boolean {
        return this.expandedJobIds.has(jobId);
    }

    private shouldDisplayJob(job: EcfVoucherJobStatusDto | null | undefined): boolean {
        if (!job) {
            return false;
        }

        if (!job.isActive) {
            return false;
        }

        return job.status !== 'Cancelled'
            && job.status !== 'Completed'
            && job.status !== 'CompletedWithErrors'
            && job.status !== 'Failed';
    }

    private setVisibleJobs(jobs: EcfVoucherJobStatusDto[] | null | undefined): void {
        this.activeJobs = (jobs ?? []).filter(job => this.shouldDisplayJob(job));

        const activeJobIds = new Set(this.activeJobs.map(x => x.jobId));
        this.expandedJobIds.forEach(jobId => {
            if (!activeJobIds.has(jobId)) {
                this.expandedJobIds.delete(jobId);
            }
        });
    }
}