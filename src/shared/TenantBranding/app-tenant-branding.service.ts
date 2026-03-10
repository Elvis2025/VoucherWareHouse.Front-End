import { UploadTenantLogoInputDto } from '../../shared/TenantBranding/app-tenant-branding.model.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import {
  TenantBrandingDto,
  TenantBrandingServiceProxy
} from '../service-proxies/service-proxies';

@Injectable({
  providedIn: 'root'
})
export class AppTenantBrandingService {
  private readonly _logoUrl = new BehaviorSubject<string | null>(null);
  private readonly _companyDescription = new BehaviorSubject<string | null>(null);
  private readonly _companyName = new BehaviorSubject<string | null>(null);
  private readonly _companyType = new BehaviorSubject<string | null>(null);
  private readonly _branding = new BehaviorSubject<TenantBrandingDto | null>(null);
  private readonly _loading = new BehaviorSubject<boolean>(false);

  readonly logoUrl$ = this._logoUrl.asObservable();
  readonly companyDescription$ = this._companyDescription.asObservable();
  readonly companyName$ = this._companyName.asObservable();
  readonly companyType$ = this._companyType.asObservable();
  readonly branding$ = this._branding.asObservable();
  readonly loading$ = this._loading.asObservable();

  constructor(
    private readonly tenantBrandingServiceProxy: TenantBrandingServiceProxy
  ) {}

  get currentLogoUrl(): string | null {
    return this._logoUrl.value;
  }

  get currentCompanyDescription(): string | null {
    return this._companyDescription.value;
  }

  get currentCompanyName(): string | null {
    return this._companyName.value;
  }

  get currentCompanyType(): string | null {
    return this._companyType.value;
  }

  get currentBranding(): TenantBrandingDto | null {
    return this._branding.value;
  }

  get isLoading(): boolean {
    return this._loading.value;
  }

  /**
   * Carga el branding actual del tenant y actualiza el estado global.
   */
  loadCurrentTenantLogo(): Observable<TenantBrandingDto | null> {
    this._loading.next(true);

    return this.tenantBrandingServiceProxy
      .getCurrentTenantLogo()
      .pipe(
        map(result => result ?? null),
        tap(result => this.setBrandingState(result)),
        finalize(() => this._loading.next(false)),
        catchError(error => {
          console.error('Error loading current tenant logo:', error);
          this.clearBrandingState();
          return of(null);
        })
      );
  }

  loadTenantBrandingLogoByTenantId(tenantId: number): Observable<TenantBrandingDto | null> {
    this._loading.next(true);

    return this.tenantBrandingServiceProxy
      .getCurrentTenantBrandingLogoByTenantId(tenantId)
      .pipe(
        map(result => result ?? null),
        tap(result => this.setBrandingState(result)),
        finalize(() => this._loading.next(false)),
        catchError(error => {
          console.error('Error loading current tenant logo:', error);
          this.clearBrandingState();
          return of(null);
        })
      );
  }

  /**
   * Sube el branding del tenant usando el proxy generado.
   */
  uploadLogo(input: UploadTenantLogoInputDto): Observable<TenantBrandingDto> {
    this._loading.next(true);

    return this.tenantBrandingServiceProxy
      .uploadLogo(
        input.tenantId,
        input.companyName,
        input.companyDescription,
        input.companyType,
        input.file
      )
      .pipe(
        tap(result => this.setBrandingState(result)),
        finalize(() => this._loading.next(false))
      );
  }

  /**
   * Elimina el logo actual del tenant y limpia el estado global.
   */
  removeCurrentTenantLogo(): Observable<void> {
    this._loading.next(true);

    return this.tenantBrandingServiceProxy
      .removeCurrentTenantLogo()
      .pipe(
        tap(() => this.clearBrandingState()),
        finalize(() => this._loading.next(false))
      );
  }

  /**
   * Fuerza manualmente el branding en memoria.
   */
  setBranding(branding: TenantBrandingDto | null): void {
    this.setBrandingState(branding);
  }

  /**
   * Fuerza manualmente solo la URL del logo.
   */
  setLogoUrl(url: string | null): void {
    this._logoUrl.next(url);
  }

  /**
   * Fuerza manualmente el nombre de la empresa.
   */
  setCompanyName(value: string | null): void {
    this._companyName.next(value);
  }

  /**
   * Fuerza manualmente la descripción de la empresa.
   */
  setCompanyDescription(value: string | null): void {
    this._companyDescription.next(value);
  }

  /**
   * Fuerza manualmente el tipo de empresa.
   */
  setCompanyType(value: string | null): void {
    this._companyType.next(value);
  }

  /**
   * Limpia el estado global del branding.
   */
  clear(): void {
    this.clearBrandingState();
  }

  private setBrandingState(branding: TenantBrandingDto | null | undefined): void {
    const normalized = branding ?? null;

    this._branding.next(normalized);
    this._logoUrl.next(normalized?.fullLogoUrl ?? null);
    this._companyName.next(normalized?.companyName ?? null);
    this._companyDescription.next(normalized?.companyDescription ?? null);
    this._companyType.next(normalized?.companyType ?? null);
  }

  private clearBrandingState(): void {
    this._branding.next(null);
    this._logoUrl.next(null);
    this._companyName.next(null);
    this._companyDescription.next(null);
    this._companyType.next(null);
  }
}