import { useMutation } from '@tanstack/react-query';
import { verifyLoginOtp } from '../../api/auth';
import { isNetworkErrorMessage } from '../../services/api/client';
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
    // Same reasoning as send-otp: only retry when the request never reached
    // the server. A wrong/expired code comes back as a real rejection and
    // is left alone — retrying that would just burn the code's attempt count.
    retry: (failureCount, error) => isNetworkErrorMessage(error) && failureCount < 2,
    retryDelay: attempt => 1500 * (attempt + 1),
  });
