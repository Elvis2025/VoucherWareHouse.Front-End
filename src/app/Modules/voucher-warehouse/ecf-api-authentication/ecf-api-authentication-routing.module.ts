import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EcfApiAuthenticationComponent } from './ecf-api-authentication.component';


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
export class EcfApiAuthenticationRoutingModule {}
