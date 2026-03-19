import { inject, Injectable, InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { CancelSequenceEcfInputDto, CommercialApprovalEcfInputDto, EcfVoucherOutputDto, EcfVoucherWarehouseCreateDto, EcfVoucherWarehouseInputDto, EcfVoucherWarehouseOutputDto, EcfVoucherWarehouseUpdateDto, ReceiveCreditNoteECFInputDto, ReceivePurchaseECFInputDto, ReceiveSalesEcfInputDto } from "./ecf-voucher-warehouse.model.service";
import { HttpHeaders, HttpParams } from "@angular/common/module.d-CnjH8Dlt";
import { API_BASE_URL } from "../../../service-proxies";
import { HttpClient } from "@angular/common/http";
import { PagedResultDto } from "../../../../helpers/PagedResultDto";




@Injectable({ providedIn: 'root' })
export class EcfVoucherWarehouseService {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly baseUrl = `${this.apiBaseUrl}/api/services/app/EcfVoucherWarehouse`;

  get(id: number): Observable<EcfVoucherWarehouseOutputDto> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.get<EcfVoucherWarehouseOutputDto>(`${this.baseUrl}/Get`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    });
  }


  getAll(input: EcfVoucherWarehouseInputDto): Observable<PagedResultDto<EcfVoucherWarehouseOutputDto>> {
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

    return this.http.get<PagedResultDto<EcfVoucherWarehouseOutputDto>>(`${this.baseUrl}/GetAll`, {
      params,
      headers: new HttpHeaders({
        Accept: 'text/plain'
      })
    });
  }

   create(input: EcfVoucherWarehouseCreateDto): Observable<EcfVoucherWarehouseOutputDto> {
    return this.http.post<EcfVoucherWarehouseOutputDto>(`${this.baseUrl}/Create`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      })
    });
  }

  update(input: EcfVoucherWarehouseUpdateDto): Observable<EcfVoucherWarehouseOutputDto> {
    return this.http.put<EcfVoucherWarehouseOutputDto>(`${this.baseUrl}/Update`, input, {
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

  sendCreditNoteEcfToDGII(input: ReceiveCreditNoteECFInputDto): Observable<EcfVoucherOutputDto> {
    return this.http.post<EcfVoucherOutputDto>(`${this.baseUrl}/SendCreditNoteEcfToDGII`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  sendDebitNoteEcfToDGII(input: ReceiveCreditNoteECFInputDto): Observable<EcfVoucherOutputDto> {
    return this.http.post<EcfVoucherOutputDto>(`${this.baseUrl}/SendDebitNoteEcfToDGII`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  sendSalesEcfToDGII(input: ReceiveSalesEcfInputDto): Observable<EcfVoucherOutputDto> {
    return this.http.post<EcfVoucherOutputDto>(`${this.baseUrl}/SendSalesEcfToDGII`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  sendPurchaseEcfToDGII(input: ReceivePurchaseECFInputDto): Observable<EcfVoucherOutputDto> {
    return this.http.post<EcfVoucherOutputDto>(`${this.baseUrl}/SendPurchaseEcfToDGII`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  sendCancelSequenceEcfToDGII(input: CancelSequenceEcfInputDto): Observable<EcfVoucherOutputDto> {
    return this.http.post<EcfVoucherOutputDto>(`${this.baseUrl}/SendCancelSequenceEcfToDGII`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  sendCommercialApprovalEcfToDGII(input: CommercialApprovalEcfInputDto): Observable<EcfVoucherOutputDto> {
    return this.http.post<EcfVoucherOutputDto>(`${this.baseUrl}/SendCommercialApprovalEcfToDGII`, input, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }




}



