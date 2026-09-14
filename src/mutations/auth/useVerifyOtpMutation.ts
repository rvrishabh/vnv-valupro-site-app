import { useMutation } from '@tanstack/react-query';
import { verifyLoginOtp } from '../../api/auth';
import { authStore } from '../../stores/authStore';
import { VerifyOtpPayload } from '../../types/auth.types';

export const verifyOtpAndStoreSession = async (payload: VerifyOtpPayload) => {
  const session = await verifyLoginOtp(payload);
  await authStore.setAuthenticated(session);
  return session;
};

export const useVerifyOtpMutation = () =>
  useMutation({
    mutationFn: verifyOtpAndStoreSession,
  });
