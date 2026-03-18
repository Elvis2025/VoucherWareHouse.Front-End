import { inject, Injectable, InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { HttpHeaders, HttpParams } from "@angular/common/module.d-CnjH8Dlt";
import { API_BASE_URL } from "../../../service-proxies/service-proxies";
import { HttpClient } from "@angular/common/http";
import { PagedResultDto } from "../../../helpers/PagedResultDto";
import { TaxVoucherTypeCreateDto, TaxVoucherTypeInputDto, TaxVoucherTypeOutputDto, TaxVoucherTypeUpdateDto } from "./ecf-api-authentication.model.service";





@Injectable({ providedIn: 'root' })
export class TaxVoucherTypeService {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly baseUrl = `${this.apiBaseUrl}/api/services/app/EcfApiAuthentication`;

  get(id: number): Observable<TaxVoucherTypeOutputDto> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.get<TaxVoucherTypeOutputDto>(`${this.baseUrl}/Get`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    });
  }


  getAll(input: TaxVoucherTypeInputDto): Observable<PagedResultDto<TaxVoucherTypeOutputDto>> {
    let params = new HttpParams();

    if (input.sorting) {
      params = params.set('Sorting', input.sorting);
    }

    if (input.skipCount !== undefined && input.skipCount !== null) {
      params = params.set('SkipCount', input.skipCount.toString());
    }

    if (input.maxResultCount !== undefined && input.maxResultCount !== null) {
      params = params.set('MaxResultCount', input.maxResultCount.toString());
    }

    return this.http.get<PagedResultDto<TaxVoucherTypeOutputDto>>(`${this.baseUrl}/GetAll`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    });
  }

   create(input: TaxVoucherTypeCreateDto): Observable<TaxVoucherTypeOutputDto> {
    return this.http.post<TaxVoucherTypeOutputDto>(`${this.baseUrl}/Create`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      })
    });
  }

  update(input: TaxVoucherTypeUpdateDto): Observable<TaxVoucherTypeOutputDto> {
    return this.http.put<TaxVoucherTypeOutputDto>(`${this.baseUrl}/Update`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      })
    });
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.delete<void>(`${this.baseUrl}/Delete`, {
      params
    });
  }

  



}



