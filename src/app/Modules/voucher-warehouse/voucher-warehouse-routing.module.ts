import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VoucherWarehouseModule } from './voucher-warehouse.module';
import { EcfApiAuthenticationComponent } from './ecf-api-authentication/ecf-api-authentication.component';


const routes: Routes = [
    {
        path: '',
        component: EcfApiAuthenticationComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class VoucherWarehouseRoutingModule {}
