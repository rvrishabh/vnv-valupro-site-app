import { authlessClient, getApiErrorMessage } from '../services/api/client';
import {
  AuthResponse,
  SendOtpPayload,
  SITE_ENGINEER_CLIENT,
  VerifyOtpPayload,
} from '../types/auth.types';
import { ApiEnvelope } from '../types/common.types';

export const sendLoginOtp = async (
  payload: SendOtpPayload,
): Promise<{ message: string }> => {
  try {
    const { data } = await authlessClient.post<ApiEnvelope<{ message: string }>>(
      '/auth/mobile/login/send-otp',
      { ...payload, client: SITE_ENGINEER_CLIENT },
    );
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not send the OTP'));
  }
};

export const verifyLoginOtp = async (
  payload: VerifyOtpPayload,
): Promise<AuthResponse> => {
  try {
    const { data } = await authlessClient.post<ApiEnvelope<AuthResponse>>(
      '/auth/mobile/login/verify-otp',
      { ...payload, client: SITE_ENGINEER_CLIENT },
    );
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not verify the OTP'));
  }
};
