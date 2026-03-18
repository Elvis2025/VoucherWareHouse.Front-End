// ecf-voucher-warehouse-dto.ts

import { BaseEntityDto } from "../../../helpers/BaseEntityDto";
import { BaseInputEntityDto } from "../../../helpers/BaseInputEntityDto";




  // =========================================================
  // AUTH / LOGIN
  // =========================================================

  export interface AuthenticateInputDto {
    baseUrlIbsApiDgii: string;
    authenticateUrlIbsApiDgii: string;
    tenancyName: string;
    usernameOrEmailAddress: string;
    password: string;
  }

  export interface LoginInputDto {
    tenancyName: string;
    usernameOrEmailAddress: string;
    password: string;
    rememberMe: boolean;
  }

  export interface AuthenticationResponseOutputDto {
    isSuccess: boolean;
    unAuthorizedRequest: boolean;
    result: ResultResponse | null;
    error: ErrorResponse | null;
  }

  export interface ResultResponse {
    expires: string;
    issued: string;
    passwordResetCode: string;
    token: string;
  }

  export interface ErrorResponse {
    code: string;
    message: string;
    validationErrors: string[];
  }

  // =========================================================
  // GENERALES DEL MÓDULO
  // =========================================================

  export interface EcfVoucherOutputDto {
    result: ResultDto | null;
    error: ErrorDto | null;
  }

  export interface EcfVoucherWarehouseCreateDto extends BaseEntityDto<number> {}

  export interface EcfVoucherWarehouseInputDto extends BaseInputEntityDto<number> {}

  export interface EcfVoucherWarehouseOutputDto extends BaseEntityDto<number> {
    status: string;
  }

  export interface EcfVoucherWarehouseUpdateDto extends BaseEntityDto<number> {}

  export interface UpdateRecordInputDto {
    trackId: string;
    qrCodeUrl: string;
    entityId: number;
    code: string;
    message: string;
    securityCode: string;
    signatureDate: string;
    statusId: number | null;
    entityName: string;
    usedSequence: boolean;
  }

  export interface ValidateTrackIdDto {
    id: number;
    statusId: number;
    trackId: string;
  }

  export interface ResultDto {
    id: number;
    trackId: string;
    exception: any | null;
    message: string;
    messageError: string;
    messageInfo: string;
    code: string;
    qrCodeUrl: string;
    securityCode: string;
    signatureDate: string;
    usedSequence: boolean;
    success: boolean;
  }

  export interface ErrorDto {
    code: string;
    details: string;
    message: string;
    validationErrors: ValidationError[];
  }

  export interface ValidationError {
    message: string;
    members: string;
  }

  // =========================================================
  // CANCELACIÓN DE SECUENCIAS
  // =========================================================

  export interface CancelSecuencieEcfDto {
    ecfType: string;
    sequenceEcfFrom: string;
    sequenceEcfTo: string;
    sequenceQuantity: number;
  }

  export interface CancelSequenceEcfInputDto {
    encabezado: Encabezado;
    detalleAnulacion: DetalleAnulacion[];
  }

  export interface Encabezado {
    rncEmisor: string;
    cantidadeNCFAnulados: number;
    fechaHoraAnulacioneNCF: string;
  }

  export interface DetalleAnulacion {
    noLinea: string[];
    tipoeCF: string;
    cantidadeNCFAnulados: number;
    tablaRangoSecuenciasAnuladaseNCF: RangoSequences[];
  }

  export interface RangoSequences {
    secuenciaeNCFDesde: string;
    secuenciaeNCFHasta: string;
  }

  // =========================================================
  // APROBACIÓN COMERCIAL
  // =========================================================

  export interface CommercialApprovalEcfInputDto {
    detalleAprobacionComercial: DetalleAprobacionComercial;
  }

  export interface DetalleAprobacionComercial {
    rNCEmisor: string;
    eNCF: string;
    fechaEmision: string;
    montoTotal: number;
    rNCComprador: string;
    estado: number;
    detalleMotivoRechazo?: string | null;
    fechaHoraAprobacionComercial: string;
  }

  // =========================================================
  // RECEPCIÓN SALES
  // =========================================================

  export interface ReceiveSalesEcfInputDto {
    printFormat: number;
    sendPrintedFile: boolean;
    authenticationServiceUrl: string;
    receptionServiceUrl: string;
    comercialApprovalServiceUrl: string;
    encabezado: EncabezadoSales;
    detallesItems: DetallesItem[];
    subtotales: Subtotales[];
    descuentosORecargos: DescuentosORecargo[];
  }

  export interface ReceiveCreditNoteECFInputDto extends ReceiveSalesEcfInputDto {
    informacionReferencia: InformacionReferencia;
  }

  export interface InformacionReferencia {
    nCFModificado: string;
    rNCOtroContribuyente: string;
    fechaNCFModificado: string;
    codigoModificacion: number;
    razonModificacion: string;
  }

  export interface ReceivePurchaseECFInputDto {
    printFormat: number;
    sendPrintedFile: boolean;
    encabezado: EncabezadoPurchase;
    detallesItems: DetallesItem[];
    subtotales: Subtotales[];
    descuentosORecargos: DescuentosORecargo[];
  }

  export interface EncabezadoPurchase extends EncabezadoSales {}

  // =========================================================
  // SALE RESUME
  // =========================================================

  export interface ReceiveSaleResumeInputDto {
    printFormat: number;
    sendPrintedFile: boolean;
    encabezado: EncabezadoResume;
  }

  export interface EncabezadoResume {
    idDoc: IdDocResume;
    emisor: EmisorResume;
    comprador: CompradorResume | null;
    totales: TotalesResume;
  }

  export interface IdDocResume {
    tipoeCF: string;
    eNCF: string;
    tipoIngresos: string;
    tipoPago: number;
    fechaLimitePago: string;
    tablaFormasPago: TablaFormasPago[];
    tipoCuentaPago: string;
  }

  export interface EmisorResume {
    rNCEmisor: string;
    razonSocialEmisor: string;
    fechaEmision: string;
  }

  export interface CompradorResume extends Comprador {
    identificadorExtranjero: string;
  }

  export interface TotalesResume {
    montoGravadoI1: number | null;
    montoGravadoI2: number | null;
    montoGravadoI3: number | null;
    montoGravadoTotal: number | null;
    montoExento: number;
    totalITBIS1: number | null;
    totalITBIS2: number | null;
    totalITBIS3: number | null;
    totalITBIS: number | null;
    montoImpuestoAdicional: number | null;
    impuestosAdicionales: ImpuestosAdicional[];
    montoNoFacturable: number;
    montoTotal: number;
    montoPeriodo: number;
  }

  // =========================================================
  // ESTRUCTURA SALES / PURCHASE
  // =========================================================

  export interface DescuentosORecargo {
    numeroLinea: number;
    tipoAjuste: string;
    indicadorNorma1007: number | null;
    descripcionDescuentooRecargo: string;
    tipoValor: tipoSubDescuento;
    valorDescuentooRecargo: number;
    montoDescuentooRecargo: number;
    montoDescuentooRecargoOtraMoneda: number;
    indicadorFacturacionDescuentooRecargo: number;
  }

  export interface DetallesItem {
    numeroLinea: number;
    tablaCodigosItem: TablaCodigosItem[];
    indicadorFacturacion: number;
    nombreItem: string;
    indicadorBienoServicio: number;
    descripcionItem: string;
    cantidadItem: number;
    unidadMedida: number;
    cantidadReferencia: number;
    unidadReferencia: number;
    tablaSubcantidad: TablaSubcantidad[];
    gradosAlcohol: number | null;
    precioUnitarioReferencia: number;
    precioUnitarioItem: number;
    descuentoMonto: number;
    tablaSubDescuento: TablaSubDescuento[];
    recargoMonto: number;
    tablaSubRecargo: TablaSubRecargo[];
    tablaImpuestoAdicional: TablaImpuestoAdicional[];
    otramonedasDetalles: OtramonedasDetalles | null;
    retencion: Retencion | null;
    montoItem: number;
  }

  export interface Retencion {
    indicadorAgenteRetencionoPercepcion: number;
    montoISRRetenido: number;
    montoITBISRetenido: number;
  }

  export interface TablaCodigosItem {
    tipoCodigo: string;
    codigoItem: string;
  }

  export interface EncabezadoSales {
    idDoc: IdDoc;
    emisor: Emisor;
    comprador: Comprador | null;
    totales: Totales;
    otraMoneda: Otramonedas | null;
    informacionesAdicionales: InformacionesAdicionales | null;
    transporte: Transporte | null;
  }

  export interface Comprador {
    rNCComprador: string;
    razonSocialComprador: string;
    identificadorExtranjero: string;
    contactoComprador: string;
    correoComprador: string;
    direccionComprador: string;
    municipioComprador: string;
    provinciaComprador: string;
    fechaEntrega: string;
    fechaOrdenCompra: string;
    numeroOrdenCompra: string;
    codigoInternoComprador: string;
    contactoEntrega: string;
    direccionEntrega: string;
    telefonoAdicional: string;
  }

  export interface Emisor {
    rNCEmisor: string;
    razonSocialEmisor: string;
    nombreComercial: string;
    direccionEmisor: string;
    municipio: string;
    provincia: string;
    tablaTelefonoEmisor: string[];
    correoEmisor: string;
    webSite: string;
    codigoVendedor: string;
    fechaEmision: string;
    numeroFacturaInterna: string;
    numeroPedidoInterno: string;
    zonaVenta: string;
  }

  export interface IdDoc {
    tipoeCF: string;
    eNCF: string;
    fechaVencimientoSecuencia: string;
    indicadorNotaCredito: string;
    indicadorMontoGravado: number | null;
    tipoIngresos: string;
    tipoPago: number;
    fechaLimitePago: string;
    terminoPago: string;
    tablaFormasPago: TablaFormasPago[];
    tipoCuentaPago: string;
    numeroCuentaPago: string;
    bancoPago: string;
  }

  export interface Totales {
    montoGravadoI1: number;
    montoGravadoI2: number;
    montoGravadoI3: number;
    montoGravadoTotal: number;
    montoExento: number;
    iTBIS1: number | null;
    iTBIS2: number | null;
    iTBIS3: number | null;
    totalITBIS1: number;
    totalITBIS2: number;
    totalITBIS3: number;
    totalITBISRetenido: number;
    totalISRRetencion: number;
    totalITBISPercepcion: number;
    totalISRPercepcion: number;
    totalITBIS: number;
    montoImpuestoAdicional: number | null;
    impuestosAdicionales: ImpuestosAdicional[];
    montoTotal: number;
    montoNoFacturable: number;
    valorPagar: number;
  }

  export interface ImpuestosAdicional {
    tipoImpuesto: string;
    tasaImpuestoAdicional: number;
    montoImpuestoSelectivoConsumoEspecifico: number;
    montoImpuestoSelectivoConsumoAdvalorem: number;
    otrosImpuestosAdicionales: number | null;
  }

  export interface Otramonedas {
    tipoMoneda: string;
    tipoCambio: number;
    montoGravadoTotalOtraMoneda: number;
    montoGravado1OtraMoneda: number;
    montoGravado2OtraMoneda: number;
    montoGravado3OtraMoneda: number;
    montoExentoOtraMoneda: number;
    totalITBISOtraMoneda: number;
    totalITBIS1OtraMoneda: number;
    totalITBIS2OtraMoneda: number;
    totalITBIS3OtraMoneda: number;
    montoImpuestoAdicionalOtraMoneda: number | null;
    impuestosAdicionalesOtraMoneda: impuestosAdicionalesOtraMoneda[];
    montoTotalOtraMoneda: number;
  }

  export interface impuestosAdicionalesOtraMoneda {
    tipoImpuestoOtraMoneda: string;
    tasaImpuestoAdicionalOtraMoneda: number;
    montoImpuestoAdicionalOtraMoneda: number;
    montoImpuestoSelectivoConsumoAvaloremOtraMoneda: number;
    otrosImpuestosAdicionalesOtraMoneda: number;
  }

  export interface TablaSubDescuento {
    tipoSubDescuento: tipoSubDescuento;
    subDescuentoPorcentaje: number;
    montoSubDescuento: number;
  }

  export interface TablaSubRecargo {
    tipoSubRecargo: tipoSubDescuento;
    subRecargoPorcentaje: number;
    montoSubRecargo: number;
  }

  export interface TablaImpuestoAdicional {
    tipoImpuesto: string;
  }

  export interface OtramonedasDetalles {
    precioOtraMoneda: number;
    descuentoOtraMoneda: number;
    recargoOtraMoneda: number;
    montoItemOtraMoneda: number;
  }

  export interface TablaSubcantidad {
    subcantidad: number;
    codigoSubcantidad: number;
  }

  export interface InformacionesAdicionales {
    numeroContenedor: string;
    numeroReferencia: string;
    fechaEmbarque: string;
    numeroEmbarque: string;
    nombrePuertoEmbarque: string;
    condicionesEntrega: string;
    totalFob: number;
    seguro: number;
    flete: number;
    totalCif: number;
    regimenAduanero: string;
    nombrePuertoSalida: string;
    nombrePuertoDesembarque: string;
    pesoBruto: number;
    pesoNeto: number;
    unidadPesoBruto: number;
    unidadPesoNeto: number;
    cantidadBulto: number;
    unidadBulto: number;
    volumenBulto: number;
    unidadVolumen: number;
  }

  export interface Transporte {
    viaTransporte: number;
    paisOrigen: string;
    direccionDestino: string;
    paisDestino: string;
    numeroAlbaran: string;
  }

  export interface TablaFormasPago {
    formaPago: number;
    montoPago: number;
  }

  export interface Subtotales {
    numeroSubTotal: number;
    descripcionSubtotal: string;
    orden: number;
    subTotalExento: number;
    montoSubTotal: number;
    lineas: number;
  }

  // =========================================================
  // ENUMS
  // =========================================================

  export enum tipoSubDescuento {
    Amount = 0,
    Percenet = 1,
  }
