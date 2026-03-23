import { TaxVoucherComponent } from './tax-voucher.component';
import { NgModule } from "@angular/core";
import { UsersRoutingModule } from "../../core-system/users/users-routing.module";
import { CommonModule } from "@angular/common";
import { TaxVoucherRoutingModule } from "./tax-voucher-routing.module";



@NgModule({
    imports: [
        TaxVoucherRoutingModule,
        UsersRoutingModule,
        CommonModule,
    ],
})
export class TaxVoucherModule {

}