import { useMutation } from '@tanstack/react-query';
import { sendLoginOtp } from '../../api/auth';
import { isNetworkErrorMessage } from '../../services/api/client';

export const useSendOtpMutation = () =>
  useMutation({
    mutationFn: sendLoginOtp,
    // Retry only a cold-start network failure — sending an OTP is safe to
    // repeat (worst case, an extra text), but a real rejection (bad email,
    // rate limit) shouldn't be retried.
    retry: (failureCount, error) => isNetworkErrorMessage(error) && failureCount < 2,
    retryDelay: attempt => 1500 * (attempt + 1),
  });
