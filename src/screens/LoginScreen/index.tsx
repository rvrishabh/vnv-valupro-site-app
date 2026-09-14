import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton } from '../../components/AppButton';
import { FormTextInput } from '../../components/form/FormTextInput';
import { useSendOtpMutation } from '../../mutations/auth/useSendOtpMutation';
import { useVerifyOtpMutation } from '../../mutations/auth/useVerifyOtpMutation';
import { glassCardStyles } from '../../theme/glassSurface';
import { darkColors } from '../../theme/colors';
import { OtpChannel } from '../../types/auth.types';

interface LoginFormValues {
  email: string;
  mobile: string;
  otp: string;
}

const RESEND_SECONDS = 30;

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

export default function LoginScreen() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [resendIn, setResendIn] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtp = useSendOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const { control, handleSubmit, getValues, setError, clearErrors, resetField } =
    useForm<LoginFormValues>({
      mode: 'onSubmit',
      defaultValues: { email: '', mobile: '', otp: '' },
    });

  useEffect(
    () => () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    },
    [],
  );

  const startResendTimer = () => {
    setResendIn(RESEND_SECONDS);
    if (timer.current) {
      clearInterval(timer.current);
    }
    timer.current = setInterval(() => {
      setResendIn(seconds => {
        if (seconds <= 1 && timer.current) {
          clearInterval(timer.current);
        }
        return Math.max(0, seconds - 1);
      });
    }, 1000);
  };

  const requestOtp = async () => {
    const { email, mobile } = getValues();
    clearErrors();
    if (!isValidEmail(email)) {
      setError('email', { message: 'Enter your registered email' });
      return;
    }
    if (channel === 'whatsapp' && mobile && !/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('mobile', { message: 'Enter a valid 10 digit mobile number' });
      return;
    }

    sendOtp.mutate(
      {
        email: email.trim().toLowerCase(),
        channel,
        ...(channel === 'whatsapp' && mobile.trim() ? { mobile: mobile.trim() } : {}),
      },
      {
        onSuccess: () => {
          resetField('otp');
          setStep('otp');
          startResendTimer();
        },
      },
    );
  };

  const onVerify = ({ email, otp }: LoginFormValues) => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('otp', { message: 'Enter the 6 digit code' });
      return;
    }
    verifyOtp.mutate({ email: email.trim().toLowerCase(), otp: Number(otp.trim()) });
  };

  const apiError = step === 'email' ? sendOtp.error : verifyOtp.error ?? sendOtp.error;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../../assets/images/logo_full_light.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="VNV Engineers"
          />

          <Text style={styles.title}>
            {step === 'email' ? 'Site Engineer Login' : 'Enter verification code'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Sign in to see the site visits assigned to you'
              : channel === 'whatsapp'
              ? 'We sent a 6 digit code on WhatsApp'
              : `We sent a 6 digit code to ${getValues('email').trim()}`}
          </Text>

          {step === 'email' ? (
            <View>
              <FormTextInput
                control={control}
                name="email"
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={requestOtp}
                left={
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={darkColors.mutedForeground}
                  />
                }
              />

              <Text style={styles.channelLabel}>Send code via</Text>
              <View style={styles.channelRow}>
                {(['email', 'whatsapp'] as OtpChannel[]).map(option => {
                  const selected = option === channel;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setChannel(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      style={[
                        glassCardStyles.pill,
                        styles.channelChip,
                        selected && styles.channelChipSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={option === 'email' ? 'email-outline' : 'whatsapp'}
                        size={18}
                        color={selected ? darkColors.primarySoft : darkColors.mutedForeground}
                      />
                      <Text style={[styles.channelText, selected && styles.channelTextSelected]}>
                        {option === 'email' ? 'Email' : 'WhatsApp'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {channel === 'whatsapp' ? (
                <FormTextInput
                  control={control}
                  name="mobile"
                  label="WhatsApp number"
                  placeholder="Registered mobile (optional)"
                  keyboardType="number-pad"
                  maxLength={10}
                  helperText="Leave empty to use the number on your account"
                  left={<Text style={styles.prefix}>+91</Text>}
                />
              ) : null}

              {apiError ? <Text style={styles.apiError}>{apiError.message}</Text> : null}

              <AppButton
                label="Send code"
                onPress={requestOtp}
                loading={sendOtp.isPending}
                style={styles.cta}
              />
            </View>
          ) : (
            <View>
              <FormTextInput
                control={control}
                name="otp"
                label="Verification code"
                placeholder="• • • • • •"
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onVerify)}
              />

              {apiError ? <Text style={styles.apiError}>{apiError.message}</Text> : null}

              <AppButton
                label="Verify & sign in"
                onPress={handleSubmit(onVerify)}
                loading={verifyOtp.isPending}
                style={styles.cta}
              />

              <View style={styles.otpActions}>
                <Pressable
                  onPress={() => {
                    verifyOtp.reset();
                    setStep('email');
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.link}>Change email</Text>
                </Pressable>
                <Pressable onPress={requestOtp} disabled={resendIn > 0 || sendOtp.isPending} hitSlop={8}>
                  <Text style={[styles.link, resendIn > 0 && styles.linkDisabled]}>
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <Text style={styles.footer}>
            New engineer? Your account must be approved by the VNV office before you can sign in.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  logo: {
    width: 220,
    height: 104,
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    color: darkColors.foreground,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: darkColors.mutedForeground,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 30,
  },
  channelLabel: {
    color: darkColors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  channelChipSelected: {
    borderColor: 'rgba(201, 168, 76, 0.9)',
    backgroundColor: 'rgba(201, 168, 76, 0.16)',
  },
  channelText: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  channelTextSelected: {
    color: darkColors.primarySoft,
  },
  prefix: {
    color: darkColors.mutedForeground,
    fontSize: 16,
  },
  apiError: {
    color: darkColors.destructive,
    fontSize: 13,
    marginBottom: 4,
  },
  cta: {
    marginTop: 14,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  link: {
    color: darkColors.primarySoft,
    fontSize: 14,
    fontWeight: '600',
  },
  linkDisabled: {
    color: darkColors.mutedForeground,
  },
  footer: {
    color: darkColors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 36,
  },
});
