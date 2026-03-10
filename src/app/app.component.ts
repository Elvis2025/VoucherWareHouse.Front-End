import { AppTenantBrandingService } from '../shared/TenantBranding/app-tenant-branding.service';
import { IbsLayoutComponent } from './layout/home-layout/ibs-layout.component';
import { Component, Injector, OnInit, Renderer2 } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { SignalRAspNetCoreHelper } from '@shared/helpers/SignalRAspNetCoreHelper';
import { LayoutStoreService } from '@shared/layout/layout-store.service';


@Component({
    templateUrl: './app.component.html',
    standalone: true,
    imports: [IbsLayoutComponent],
})
export class AppComponent extends AppComponentBase implements OnInit {
    sidebarExpanded: boolean;
    logoUrl$ = this._appTenantBrandingService.logoUrl$;
    
    constructor(
        injector: Injector,
        private renderer: Renderer2,
        private _layoutStore: LayoutStoreService,
        private _appTenantBrandingService: AppTenantBrandingService 
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.renderer.addClass(document.body, 'sidebar-mini');

        SignalRAspNetCoreHelper.initSignalR();

        abp.event.on('abp.notifications.received', (userNotification) => {
            abp.notifications.showUiNotifyForUserNotification(userNotification);

            // Desktop notification
            Push.create('AbpZeroTemplate', {
                body: userNotification.notification.data.message,
                icon: abp.appPath + 'assets/app-logo-small.png',
                timeout: 6000,
                onClick: function () {
                    window.focus();
                    this.close();
                },
            });
        });

        this._layoutStore.sidebarExpanded.subscribe((value) => {
            this.sidebarExpanded = value;
        });
        
        this._appTenantBrandingService.loadCurrentTenantLogo().subscribe({
                next: (result) => {
                    console.log('Branding cargado:', result);
                },
                error: (error) => {
                    console.error('Error cargando branding:', error);
                }
            });
        console.log('AppComponent initialized',this.logoUrl$);
    }

    toggleSidebar(): void {
        this._layoutStore.setSidebarExpanded(!this.sidebarExpanded);
    }
}
