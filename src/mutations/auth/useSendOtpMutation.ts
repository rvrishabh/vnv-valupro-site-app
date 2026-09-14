import { useMutation } from '@tanstack/react-query';
import { sendLoginOtp } from '../../api/auth';

export const useSendOtpMutation = () =>
  useMutation({
    mutationFn: sendLoginOtp,
  });
