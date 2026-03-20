import { inject, Injectable, InjectionToken } from "@angular/core";
import { map, Observable, tap } from "rxjs";
import { EcfApiAuthenticationCreateDto, EcfApiAuthenticationInputDto, EcfApiAuthenticationOutputDto, EcfApiAuthenticationUpdateDto} from "./ecf-api-authentication.model.service";
import { API_BASE_URL } from "../../../service-proxies";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { PagedResultDto } from "../../../../helpers/PagedResultDto";




@Injectable({ providedIn: 'root' })
export class EcfApiAuthenticationService {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly baseUrl = `${this.apiBaseUrl}/api/services/app/EcfApiAuthentication`;

  get(id: number): Observable<EcfApiAuthenticationOutputDto> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.get<EcfApiAuthenticationOutputDto>(`${this.baseUrl}/Get`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    });
  }


  getAll(input: EcfApiAuthenticationInputDto): Observable<PagedResultDto<EcfApiAuthenticationOutputDto>> {
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
      Accept: 'application/json'
    })
  }).pipe(
    tap(response => {
      console.log('🔥 RESPONSE RAW BACKEND:', response);
      console.log('🔥 ITEMS DIRECTO:', response?.items);
      console.log('🔥 TOTALCOUNT DIRECTO:', response?.totalCount);
      console.log('🔥 RESPONSE.RESULT:', response?.result);
      console.log('🔥 ITEMS EN RESULT:', response?.result?.items);
      console.log('🔥 TOTALCOUNT EN RESULT:', response?.result?.totalCount);
    }),
    map(response => response?.result ?? { items: [], totalCount: 0 })
  );
  }

   create(input: EcfApiAuthenticationCreateDto): Observable<EcfApiAuthenticationOutputDto> {
    return this.http.post<EcfApiAuthenticationOutputDto>(`${this.baseUrl}/Create`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      })
    });
  }

  update(input: EcfApiAuthenticationUpdateDto): Observable<EcfApiAuthenticationOutputDto> {
    return this.http.put<EcfApiAuthenticationOutputDto>(`${this.baseUrl}/Update`, input, {
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



