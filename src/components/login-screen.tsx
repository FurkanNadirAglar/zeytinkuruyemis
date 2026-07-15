import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function LoginScreen() {
  const { loginAsEmployee, role } = useAuth();
  const router = useRouter();

  const handleEmployeeLogin = () => {
    loginAsEmployee();
    router.replace('/employee-home');
  };

  useEffect(() => {
    if (role === 'employee') {
      router.replace('/employee-home');
    }
  }, [role, router]);

  const openManagerScreen = () => {
    router.push('/manager-login');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Image
          contentFit="fill"
          pointerEvents="none"
          source={require('@/assets/images/taban-ui.png')}
          style={styles.screenArtwork}
        />

        <View style={styles.heroWrap} />

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <BranchAccent direction="left" />
            <ThemedText style={styles.sectionTitle}>Giriş Yapın</ThemedText>
            <BranchAccent direction="right" />
          </View>

          <AuthOptionCard
            accessibilityLabel="Çalışan girişi"
            icon="employee"
            onPress={handleEmployeeLogin}
            subtitle="Sisteme çalışan olarak giriş yapmak"
            title="Çalışan Girişi"
          />

          <AuthOptionCard
            accessibilityLabel="Müdür girişi"
            icon="manager"
            onPress={openManagerScreen}
            subtitle="Yönetici paneline erişim sağlamak"
            title="Müdür Girişi"
          />
        </View>

        <View pointerEvents="none" style={styles.footerSection}>
          <Image
            contentFit="cover"
            source={require('@/assets/images/ui-alt.png')}
            style={styles.footerArtwork}
          />
          <View style={styles.footerCopy}>
            <ThemedText style={styles.footerText}>© 2026 Zeytin Kuruyemiş</ThemedText>
            <ThemedText style={styles.footerSubText}>Tüm hakları saklıdır.</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

export function ManagerLoginScreen() {
  const { loginAsManager, role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const closeManagerScreen = () => {
    router.replace('/login');
  };

  const handleManagerLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Lutfen mail ve sifrenizi girin.');
      return;
    }

    const result = loginAsManager(email, password);

    if (!result.success) {
      setError(result.error ?? 'Giris basarisiz.');
      return;
    }

    router.replace('/manager-home');
  };

  useEffect(() => {
    if (role === 'manager') {
      router.replace('/manager-home');
    }
  }, [role, router]);

  return (
    <ManagerLoginPage
      email={email}
      error={error}
      isPasswordVisible={isPasswordVisible}
      onBack={closeManagerScreen}
      onEmployeePress={closeManagerScreen}
      onLogin={handleManagerLogin}
      onPasswordChange={(value) => {
        setPassword(value);
        if (error) {
          setError('');
        }
      }}
      onTogglePasswordVisibility={() => setIsPasswordVisible((current) => !current)}
      onToggleRememberMe={() => setRememberMe((current) => !current)}
      onUsernameChange={(value) => {
        setEmail(value);
        if (error) {
          setError('');
        }
      }}
      password={password}
      rememberMe={rememberMe}
    />
  );
}

function ManagerLoginPage({
  email,
  password,
  error,
  rememberMe,
  isPasswordVisible,
  onBack,
  onEmployeePress,
  onLogin,
  onPasswordChange,
  onTogglePasswordVisibility,
  onToggleRememberMe,
  onUsernameChange,
}: {
  email: string;
  password: string;
  error: string;
  rememberMe: boolean;
  isPasswordVisible: boolean;
  onBack: () => void;
  onEmployeePress: () => void;
  onLogin: () => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onToggleRememberMe: () => void;
  onUsernameChange: (value: string) => void;
}) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Image
          contentFit="fill"
          source={require('@/assets/images/taban-ui.png')}
          style={styles.screenArtwork}
        />

        <Image
          contentFit="cover"
          source={require('@/assets/images/ui-alt.png')}
          style={styles.managerFooterArtwork}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.managerScreen}>
          <Pressable
            accessibilityLabel="Geri dön"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressedButton]}>
            <BackChevron />
          </Pressable>

          <View style={styles.managerCenterStage}>
            <View style={styles.managerCard}>
              <View style={styles.managerCardIcon}>
                <Image
                  contentFit="contain"
                  source={require('@/assets/images/manager-icon.png')}
                  style={styles.managerCardIconImage}
                />
              </View>

              <ThemedText style={styles.managerTitle}>Müdür Girişi</ThemedText>
              <ThemedText style={styles.managerSubtitle}>
                Yönetici paneline erişim sağlamak için giriş yapın
              </ThemedText>

              <View style={styles.managerForm}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>E-posta</ThemedText>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={onUsernameChange}
                    placeholder="E-posta adresinizi giriniz"
                    placeholderTextColor="#A99A89"
                    style={styles.input}
                    value={email}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Şifre</ThemedText>
                  <View style={styles.passwordField}>
                    <TextInput
                      onChangeText={onPasswordChange}
                      placeholder="Şifrenizi giriniz"
                      placeholderTextColor="#A99A89"
                      secureTextEntry={!isPasswordVisible}
                      style={styles.passwordInput}
                      value={password}
                    />
                    <Pressable
                      accessibilityLabel="Şifreyi göster veya gizle"
                      onPress={onTogglePasswordVisibility}
                      style={({ pressed }) => [
                        styles.passwordToggle,
                        pressed && styles.passwordTogglePressed,
                      ]}>
                      <ThemedText style={styles.passwordToggleText}>
                        {isPasswordVisible ? 'Gizle' : 'Göster'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.rowBetween}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                    onPress={onToggleRememberMe}
                    style={({ pressed }) => [styles.rememberMe, pressed && styles.pressedButton]}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe ? <View style={styles.checkboxTick} /> : null}
                    </View>
                    <ThemedText style={styles.rememberMeText}>Beni Hatırla</ThemedText>
                  </Pressable>

                  <Pressable style={({ pressed }) => pressed && styles.pressedButton}>
                    <ThemedText style={styles.forgotPasswordText}>Şifremi Unuttum?</ThemedText>
                  </Pressable>
                </View>

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                <Pressable
                  onPress={onLogin}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.managerPrimaryButton,
                    pressed && styles.pressedButton,
                  ]}>
                  <ThemedText style={styles.primaryButtonText}>Giriş Yap</ThemedText>
                  <BranchAccent direction="right" tone="light" />
                </Pressable>

                <TextDivider label="veya" />

                <Pressable
                  onPress={onEmployeePress}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    styles.managerSecondaryButton,
                    pressed && styles.pressedButton,
                  ]}>
                  <ThemedText style={styles.secondaryButtonText}>Çalışan Girişine Geç</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.managerFooterCopy}>
            <ThemedText style={styles.footerText}>© 2026 Zeytin Kuruyemiş</ThemedText>
            <ThemedText style={styles.footerSubText}>Tüm hakları saklıdır.</ThemedText>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function AuthOptionCard({
  title,
  subtitle,
  icon,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle: string;
  icon: 'employee' | 'manager';
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}>
      <View style={styles.optionBadge}>
        <View
          style={[
            styles.optionBadgeInner,
            (icon === 'employee' || icon === 'manager') && styles.optionBadgeInnerTransparent,
          ]}>
          {icon === 'employee' ? (
            <Image
              contentFit="contain"
              source={require('@/assets/images/emp-icon.png')}
              style={styles.employeeBadgeImage}
            />
          ) : icon === 'manager' ? (
            <Image
              contentFit="contain"
              source={require('@/assets/images/manager-icon.png')}
              style={styles.managerBadgeImage}
            />
          ) : (
            <View />
          )}
        </View>
      </View>

      <View style={styles.optionContent}>
        <ThemedText style={styles.optionTitle}>{title}</ThemedText>
        <ThemedText style={styles.optionSubtitle}>{subtitle}</ThemedText>
      </View>

      <View style={styles.optionChevronWrap}>
        <View style={[styles.chevronLine, styles.chevronLineTop]} />
        <View style={[styles.chevronLine, styles.chevronLineBottom]} />
      </View>
    </Pressable>
  );
}

function BranchAccent({
  direction,
  tone = 'gold',
}: {
  direction: 'left' | 'right';
  tone?: 'gold' | 'light';
}) {
  const isLeft = direction === 'left';
  const branchColor = tone === 'light' ? '#F6E9D8' : '#C89A52';

  return (
    <View style={[styles.branchAccent, !isLeft && styles.branchAccentRight]}>
      <View
        style={[styles.branchStem, { backgroundColor: branchColor }, !isLeft && styles.branchStemRight]}
      />
      <View
        style={[
          styles.branchLeaf,
          styles.branchLeafOne,
          { backgroundColor: branchColor },
          !isLeft && styles.branchLeafRight,
        ]}
      />
      <View
        style={[
          styles.branchLeaf,
          styles.branchLeafTwo,
          { backgroundColor: branchColor },
          !isLeft && styles.branchLeafRight,
        ]}
      />
      <View
        style={[
          styles.branchLeaf,
          styles.branchLeafThree,
          { backgroundColor: branchColor },
          !isLeft && styles.branchLeafRight,
        ]}
      />
    </View>
  );
}

function TextDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <ThemedText style={styles.dividerLabel}>{label}</ThemedText>
      <View style={styles.dividerLine} />
    </View>
  );
}

function BackChevron() {
  return (
    <View style={styles.backChevron}>
      <View style={[styles.backChevronLine, styles.backChevronTop]} />
      <View style={[styles.backChevronLine, styles.backChevronBottom]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  screenArtwork: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroWrap: {
    minHeight: 404,
  },
  managerScreen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  managerFooterArtwork: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 252,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 24,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(77, 52, 30, 0.88)',
  },
  backChevron: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  backChevronLine: {
    position: 'absolute',
    left: 2,
    width: 10,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: '#FFF9F0',
  },
  backChevronTop: {
    top: 4,
    transform: [{ rotate: '-45deg' }],
  },
  backChevronBottom: {
    top: 10,
    transform: [{ rotate: '45deg' }],
  },
  managerCenterStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 66,
    paddingBottom: 120,
  },
  contentSection: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 190,
    zIndex: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
  },
  branchAccent: {
    width: 32,
    height: 22,
    position: 'relative',
  },
  branchAccentRight: {
    transform: [{ scaleX: -1 }],
  },
  branchStem: {
    position: 'absolute',
    left: 13,
    top: 3,
    width: 2,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#C89A52',
    transform: [{ rotate: '-28deg' }],
  },
  branchStemRight: {
    transform: [{ rotate: '-28deg' }],
  },
  branchLeaf: {
    position: 'absolute',
    width: 9,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C89A52',
    transform: [{ rotate: '36deg' }],
  },
  branchLeafOne: {
    left: 11,
    top: 2,
  },
  branchLeafTwo: {
    left: 7,
    top: 8,
  },
  branchLeafThree: {
    left: 3,
    top: 14,
  },
  branchLeafRight: {
    transform: [{ rotate: '36deg' }],
  },
  sectionTitle: {
    color: '#D4A34D',
    fontSize: 17,
    fontWeight: 800,
  },
  optionCard: {
    minHeight: 120,
    borderRadius: 17,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F0E6',
    borderWidth: 1,
    borderColor: '#E4D4C2',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  optionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  optionBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  optionBadgeInner: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A311D',
  },
  optionBadgeInnerTransparent: {
    backgroundColor: 'transparent',
  },
  employeeBadgeImage: {
    width: 92,
    height: 92,
  },
  managerBadgeImage: {
    width: 92,
    height: 92,
  },
  optionContent: {
    flex: 1,
    gap: 4,
    paddingLeft: 16,
    paddingRight: 10,
  },
  optionTitle: {
    color: '#342116',
    fontSize: 17,
    fontWeight: 800,
  },
  optionSubtitle: {
    color: '#6B5547',
    fontSize: 13,
    lineHeight: 19,
  },
  optionChevronWrap: {
    width: 20,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronLine: {
    position: 'absolute',
    width: 12,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: '#6B472A',
  },
  chevronLineTop: {
    transform: [{ translateY: -4 }, { rotate: '45deg' }],
  },
  chevronLineBottom: {
    transform: [{ translateY: 4 }, { rotate: '-45deg' }],
  },
  footerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 228,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    zIndex: 1,
  },
  footerArtwork: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  footerCopy: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 2,
  },
  footerText: {
    color: '#D4A34D',
    fontSize: 13,
    textAlign: 'center',
  },
  footerSubText: {
    color: '#FFF8EF',
    fontSize: 13,
    textAlign: 'center',
  },
  managerCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: 'rgba(255, 251, 246, 0.96)',
    borderWidth: 1,
    borderColor: '#EFE1D1',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  managerCardIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7EFE5',
    marginBottom: 10,
  },
  managerCardIconImage: {
    width: 52,
    height: 52,
  },
  managerTitle: {
    color: '#342116',
    fontSize: 22,
    fontWeight: 800,
    textAlign: 'center',
  },
  managerSubtitle: {
    color: '#6F5A4B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  managerForm: {
    gap: 14,
    marginTop: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: '#4A372A',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#2F2118',
    borderColor: '#DDCCBA',
    backgroundColor: '#FFFDFC',
  },
  passwordField: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: '#DDCCBA',
    backgroundColor: '#FFFDFC',
    paddingLeft: 16,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 14,
    color: '#2F2118',
  },
  passwordToggle: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  passwordTogglePressed: {
    opacity: 0.68,
  },
  passwordToggleText: {
    color: '#6E563F',
    fontSize: 13,
    fontWeight: 700,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 4,
    borderColor: '#7C624B',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFB',
  },
  checkboxChecked: {
    backgroundColor: '#6B472A',
    borderColor: '#6B472A',
  },
  checkboxTick: {
    width: 8,
    height: 4,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFF8F1',
    transform: [{ rotate: '-45deg' }],
    marginBottom: 1,
  },
  rememberMeText: {
    color: '#5B4636',
    fontSize: 13,
  },
  forgotPasswordText: {
    color: '#5B4636',
    fontSize: 13,
    fontWeight: 600,
  },
  errorText: {
    color: '#D64545',
    fontWeight: 600,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#6B472A',
  },
  managerPrimaryButton: {
    borderRadius: 16,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 800,
    color: '#FFF8F1',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    borderColor: '#CDB295',
    backgroundColor: '#FFFDFB',
  },
  managerSecondaryButton: {
    marginTop: -2,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#5B4636',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDCCBA',
  },
  dividerLabel: {
    color: '#8A7768',
    fontSize: 14,
  },
  managerFooterCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pressedButton: {
    opacity: 0.86,
  },
});
