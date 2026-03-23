import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaxVoucherComponent } from './tax-voucher.component';


const routes: Routes = [
    
    {
        path: '',
        component: TaxVoucherComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TaxVoucherRoutingModule {}
