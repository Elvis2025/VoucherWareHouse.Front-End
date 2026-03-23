import { TaxVoucherComponent } from '../tax-voucher/tax-voucher.component';
import { NgModule } from "@angular/core";
import { UsersRoutingModule } from "../../core-system/users/users-routing.module";
import { CommonModule } from "@angular/common";
import { EcfApiAuthenticationComponent } from "./ecf-api-authentication.component";
import { EcfApiAuthenticationRoutingModule } from "./ecf-api-authentication-routing.module";
import { EcfApiAuthenticationCreateDialogComponent } from './ecf-api-authentication-create/ecf-api-authentication-create-dialog.component';
import { EcfApiAuthenticationUpdateDialogComponent } from './ecf-api-authentication-update/ecf-api-authentication-update-dialog.component';


@NgModule({
    imports: [
        EcfApiAuthenticationRoutingModule,
        UsersRoutingModule,
        CommonModule,
        EcfApiAuthenticationComponent,
        EcfApiAuthenticationCreateDialogComponent,
        EcfApiAuthenticationUpdateDialogComponent
    ],
})
export class EcfApiAuthenticationModule {

}