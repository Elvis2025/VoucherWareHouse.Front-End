import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';

import { AppComponentBase } from '@shared/app-component-base';
import {
  ResetPasswordDto,
  UserServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { IbsInputComponent } from '../../../controls/ibs-input/ibs-input.component';
import { IbsModalShellComponent } from '../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';

interface ResetPasswordFormState {
  adminPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LocalizePipe,
    IbsInputComponent,
    IbsModalShellComponent,
    IbsModalHeaderComponent,
    IbsModalBodyComponent,
    IbsModalFooterComponent,
  ],
})
export class ResetPasswordDialogComponent extends AppComponentBase implements OnInit {
  id!: number;

  readonly isLoading = signal(false);

  readonly formState = signal<ResetPasswordFormState>({
    adminPassword: '',
    newPassword: '',
  });

  readonly canSubmit = computed(() => {
    return this.formState().adminPassword.trim().length > 0;
  });

  constructor(
    injector: Injector,
    private readonly userService: UserServiceProxy,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  close(): void {
    this.bsModalRef.hide();
  }

  updateAdminPassword(value: string): void {
    this.formState.update(state => ({
      ...state,
      adminPassword: value ?? '',
    }));
  }

  submit(): void {
    if (this.isLoading() || !this.canSubmit()) {
      return;
    }

    this.isLoading.set(true);

    const payload = this.buildPayload();

    this.userService
      .resetPassword(payload)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.notify.info(this.l('PasswordReset'));
          this.close();
        },
      });
  }

  private initializeForm(): void {
    this.formState.set({
      adminPassword: '',
      newPassword: this.generatePassword(),
    });
  }

  private buildPayload(): ResetPasswordDto {
    const form = this.formState();
    const dto = new ResetPasswordDto();

    dto.userId = this.id;
    dto.adminPassword = form.adminPassword;
    dto.newPassword = form.newPassword;

    return dto;
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(2, 12);
  }
}