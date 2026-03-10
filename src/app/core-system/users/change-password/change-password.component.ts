import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  Output,
  computed,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';

import { AppComponentBase } from '@shared/app-component-base';
import {
  ChangePasswordDto,
  UserServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { AbpValidationError } from '@shared/components/validation/abp-validation.api';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

import { IbsInputComponent } from '../../../controls/ibs-input/ibs-input.component';
import { IbsModalShellComponent } from '../../../controls/ibs-modal/ibs-modal-shell.component';
import { IbsModalHeaderComponent } from '../../../controls/ibs-modal/ibs-modal-header/ibs-modal-header.component';
import { IbsModalBodyComponent } from '../../../controls/ibs-modal/ibs-modal-body/ibs-modal-body.component';
import { IbsModalFooterComponent } from '../../../controls/ibs-modal/ibs-modal-footer/ibs-modal-footer.component';

interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
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
export class ChangePasswordComponent extends AppComponentBase {
  @Output() onSave = new EventEmitter<void>();

  readonly saving = signal(false);

  readonly formState = signal<ChangePasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  readonly newPasswordValidationErrors: Partial<AbpValidationError>[] = [
    {
      name: 'pattern',
      localizationKey:
        'PasswordsMustBeAtLeast8CharactersContainLowercaseUppercaseNumber',
    },
  ];

  readonly confirmNewPasswordValidationErrors: Partial<AbpValidationError>[] = [
    {
      name: 'validateEqual',
      localizationKey: 'PasswordsDoNotMatch',
    },
  ];

  readonly canSubmit = computed(() => {
    const form = this.formState();

    return (
      form.currentPassword.trim().length > 0 &&
      form.newPassword.trim().length > 0 &&
      form.confirmNewPassword.trim().length > 0 &&
      form.newPassword === form.confirmNewPassword
    );
  });

  constructor(
    injector: Injector,
    private readonly userServiceProxy: UserServiceProxy,
    private readonly router: Router,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  close(): void {
    this.bsModalRef.hide();
  }

  updateCurrentPassword(value: string): void {
    this.formState.update((state) => ({
      ...state,
      currentPassword: value ?? '',
    }));
  }

  updateNewPassword(value: string): void {
    this.formState.update((state) => ({
      ...state,
      newPassword: value ?? '',
    }));
  }

  updateConfirmPassword(value: string): void {
    this.formState.update((state) => ({
      ...state,
      confirmNewPassword: value ?? '',
    }));
  }

  submit(): void {
    if (this.saving() || !this.canSubmit()) {
      return;
    }

    this.saving.set(true);

    const payload = this.buildPayload();

    this.userServiceProxy
      .changePassword(payload)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: (success) => {
          if (!success) {
            return;
          }

          abp.message.success(
            this.l('PasswordChangedSuccessfully'),
            this.l('Success')
          );

          this.close();
          this.onSave.emit();
          this.router.navigate(['/']);
        },
      });
  }

  private buildPayload(): ChangePasswordDto {
    const form = this.formState();
    const dto = new ChangePasswordDto();

    dto.currentPassword = form.currentPassword;
    dto.newPassword = form.newPassword;

    return dto;
  }
}