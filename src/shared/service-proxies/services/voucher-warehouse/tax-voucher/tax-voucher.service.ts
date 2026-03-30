import { inject, Injectable, InjectionToken } from "@angular/core";
import { map, Observable } from "rxjs";
import { API_BASE_URL } from "../../../service-proxies";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { PagedResultDto } from "../../../../helpers/PagedResultDto";
import { TaxVoucherCreateDto, TaxVoucherInputDto, TaxVoucherOutputDto, TaxVoucherUpdateDto } from "./tax-voucher.model.service";




@Injectable({ providedIn: 'root' })
export class TaxVoucherService {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly baseUrl = `${this.apiBaseUrl}/api/services/app/TaxVoucher`;

  get(id: number): Observable<TaxVoucherOutputDto> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.get<any>(`${this.baseUrl}/Get`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    }).pipe(map( response => response?.result));
  }


  getAll(input: TaxVoucherInputDto): Observable<PagedResultDto<TaxVoucherOutputDto>> {
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

    return this.http.get<any>(`${this.baseUrl}/GetAll`, {
          params,
          headers: new HttpHeaders({
            Accept: 'text/plain'
          })
        }).pipe(
            map(response => response?.result ?? { items: [], totalCount: 0 })
          );
  }

   create(input: TaxVoucherCreateDto): Observable<TaxVoucherOutputDto> {
    return this.http.post<TaxVoucherOutputDto>(`${this.baseUrl}/Create`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      })
    });
  }

  update(input: TaxVoucherUpdateDto): Observable<TaxVoucherOutputDto> {
    return this.http.put<TaxVoucherOutputDto>(`${this.baseUrl}/Update`, input, {
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



