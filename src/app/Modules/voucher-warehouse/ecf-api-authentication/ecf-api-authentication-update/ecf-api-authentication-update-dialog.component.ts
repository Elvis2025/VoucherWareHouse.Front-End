import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { After } from "v8";
import { IbsModalHeaderComponent } from "../../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component";
import { IbsModalTopBarComponent } from "../../../../controls/ibs-modal/ibs-modal-top-bar/ibs-modal-top-bar.component";
import { IbsModalBodyComponent } from "../../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component";
import { IbsModalFooterComponent } from "../../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component";
import { IbsModalShellComponent } from "../../../../controls/ibs-modal/ibs-modal-shell.component";

@Component({
  selector: 'app-ecf-api-authentication-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IbsModalHeaderComponent,
    IbsModalTopBarComponent,
    IbsModalBodyComponent,
    IbsModalFooterComponent,
    IbsModalShellComponent,
  ],
  templateUrl: './ecf-api-authentication-update-dialog.component.html',
  styleUrls: ['./ecf-api-authentication-update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcfApiAuthenticationUpdateDialogComponent implements OnInit,AfterViewInit{

    @Input({required: true}) id!: number;

    ngAfterViewInit(): void {
        throw new Error("Method not implemented.");
    }
    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }

}