import { NgModule } from "@angular/core";
import { UsersRoutingModule } from "../core-system/users/users-routing.module";
import { CommonModule } from "@angular/common";
import { EcfApiAuthenticationComponent } from "./ecf-api-authentication/ecf-api-authentication.component";
import { SharedModule } from "@shared/shared.module";
import { VoucherWarehouseRoutingModule } from "./voucher-warehouse-routing.module";


@NgModule({
    imports: [
        SharedModule,
        VoucherWarehouseRoutingModule,
        UsersRoutingModule,
        CommonModule,
        EcfApiAuthenticationComponent,
    ],
})
export class VoucherWarehouseModule {

}