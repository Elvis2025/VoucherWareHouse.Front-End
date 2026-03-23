import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaxVoucherTypesComponent } from './tax-voucher-types.component';


const routes: Routes = [
    
    {
        path: '',
        component: TaxVoucherTypesComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TaxVoucherTypesRoutingModule {}
