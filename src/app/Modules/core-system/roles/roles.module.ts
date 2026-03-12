import { NgModule } from '@angular/core';
import { RolesRoutingModule } from './roles-routing.module';
import { RolesComponent } from './roles.component';
import { CreateRoleDialogComponent } from './create-role/create-role-dialog.component';
import { EditRoleDialogComponent } from './edit-role/edit-role-dialog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'primeng/api';

@NgModule({
    imports: [
        SharedModule,
        RolesRoutingModule,
        CommonModule,
        RolesComponent,
        CreateRoleDialogComponent,
        EditRoleDialogComponent,
    ],
})
export class RolesModule {}
