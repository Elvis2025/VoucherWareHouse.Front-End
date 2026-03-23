import { inject, Injectable, InjectionToken } from "@angular/core";
import { map, Observable } from "rxjs";
import { TaxVoucherTypesCreateDto, TaxVoucherTypesInputDto, TaxVoucherTypesOutputDto, TaxVoucherTypesUpdateDto} from "./tax-voucher-types.model.service";
import { API_BASE_URL } from "../../../service-proxies";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { PagedResultDto } from "../../../../helpers/PagedResultDto";




@Injectable({ providedIn: 'root' })
export class TaxVoucherTypesService {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly baseUrl = `${this.apiBaseUrl}/api/services/app/TaxVoucherTypes`;

  get(id: number): Observable<TaxVoucherTypesOutputDto> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.get<any>(`${this.baseUrl}/Get`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    }).pipe(
      map(response => response?.result)

    );
  }


  getAll(input: TaxVoucherTypesInputDto): Observable<PagedResultDto<TaxVoucherTypesOutputDto>> {
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

   create(input: TaxVoucherTypesCreateDto): Observable<TaxVoucherTypesOutputDto> {
    return this.http.post<TaxVoucherTypesOutputDto>(`${this.baseUrl}/Create`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      })
    });
  }

  update(input: TaxVoucherTypesUpdateDto): Observable<TaxVoucherTypesOutputDto> {
    return this.http.put<TaxVoucherTypesOutputDto>(`${this.baseUrl}/Update`, input, {
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



