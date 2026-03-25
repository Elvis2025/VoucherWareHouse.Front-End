import { GenerateEcfVoucherWarehouseRoutingModule } from '../generate-ecf-voucher-warehouse/generate-ecf-voucher-warehouse-routing.module';
import { GenerateEcfVoucherWarehouseComponent } from '../generate-ecf-voucher-warehouse/generate-ecf-voucher-warehouse.component';
import { NgModule } from "@angular/core";
import { UsersRoutingModule } from "../../core-system/users/users-routing.module";
import { CommonModule } from "@angular/common";


@NgModule({
    imports: [
        GenerateEcfVoucherWarehouseRoutingModule,
        UsersRoutingModule,
        CommonModule,
        GenerateEcfVoucherWarehouseComponent,
    ],
})
export class GenerateEcfVoucherWarehouseModule {

}