import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppRouteGuard } from '@shared/auth/auth-route-guard';
import { IbsLayoutComponent } from './layout/home-layout/ibs-layout.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: IbsLayoutComponent,
                children: [
                    {
                        path: 'home',
                        loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'about',
                        loadChildren: () => import('./about/about.module').then((m) => m.AboutModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'core-system/users',
                        loadChildren: () => import('./Modules/core-system/users/users.module').then((m) => m.UsersModule),
                        data: { permission: 'Pages.Users' },
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'core-system/roles',
                        loadChildren: () => import('./Modules/core-system/roles/roles.module').then((m) => m.RolesModule),
                        data: { permission: 'Pages.Roles' },
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'core-system/tenants',
                        loadChildren: () => import('./Modules/core-system/tenants/tenants.module').then((m) => m.TenantsModule),
                        data: { permission: 'Pages.Tenants' },
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'core-system/update-password',
                        loadChildren: () => import('./Modules/core-system/users/users.module').then((m) => m.UsersModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'voucher-warehouse/ecf-api-authentication',
                        loadChildren: () => import('./Modules/voucher-warehouse/ecf-api-authentication/ecf-api-authentication.module').then((m) => m.EcfApiAuthenticationModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'voucher-warehouse/tax-vouchers',
                        loadChildren: () => import('./Modules/voucher-warehouse/tax-voucher/tax-voucher.module').then((m) => m.TaxVoucherModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'voucher-warehouse/tax-vouchers-types',
                        loadChildren: () => import('./Modules/voucher-warehouse/tax-voucher-types/tax-voucher-types.module').then((m) => m.TaxVoucherTypeModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'voucher-warehouse/ecf-voucher-warehouse',
                        loadChildren: () => import('./Modules/voucher-warehouse/generate-ecf-voucher-warehouse/generate-ecf-voucher-warehouse.module').then((m) => m.GenerateEcfVoucherWarehouseModule),
                        canActivate: [AppRouteGuard],
                    },


                ],
            },
        ]),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
