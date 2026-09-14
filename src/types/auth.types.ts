/** Backend `AuthClient.SITE_ENGINEER_APP` — the server rejects accounts whose role is not SITE_ENGINEER. */
export const SITE_ENGINEER_CLIENT = 'site_engineer_app' as const;

export type AuthStatus = 'idle' | 'bootstrapping' | 'unauthenticated' | 'authenticated';

export type OtpChannel = 'email' | 'whatsapp';

/** `toUserResponse` on the backend — the User row minus secrets. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  roleId: string;
  isActive: boolean;
  isApproved: boolean;
  institutionId: string | null;
  branchId: string | null;
}

export interface SendOtpPayload {
  email: string;
  channel?: OtpChannel;
  mobile?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: AuthUser;
}
