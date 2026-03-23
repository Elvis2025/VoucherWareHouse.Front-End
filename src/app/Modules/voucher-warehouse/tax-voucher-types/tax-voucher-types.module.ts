import { TaxVoucherTypesUpdateComponent } from './tax-voucher-types-update/tax-voucher-types-update.component';
import { TaxVoucherTypesCreateComponent } from './tax-voucher-types-create/tax-voucher-types-create.component';
import { NgModule } from "@angular/core";
import { UsersRoutingModule } from "../../core-system/users/users-routing.module";
import { CommonModule } from "@angular/common";
import { TaxVoucherTypesRoutingModule } from "./tax-voucher-types-routing.module";



@NgModule({
    imports: [
        TaxVoucherTypesRoutingModule,
        UsersRoutingModule,
        CommonModule,
        TaxVoucherTypesUpdateComponent,
        TaxVoucherTypesCreateComponent
    ],
})
export class TaxVoucherTypeModule {

}