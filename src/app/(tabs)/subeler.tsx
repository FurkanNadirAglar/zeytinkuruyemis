import { useEffect, useMemo, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Branch, createBranch, deleteBranch, subscribeBranches, updateBranch } from '@/lib/branches';

type BranchFormState = {
  name: string;
};

const initialFormState = (): BranchFormState => ({
  name: '',
});

export default function BranchesScreen() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [screenError, setScreenError] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<BranchFormState>(initialFormState);

  useEffect(() => {
    const unsubscribe = subscribeBranches(
      (items) => {
        setBranches(items);
        setScreenError('');
        setIsLoading(false);
      },
      (loadError) => {
        setScreenError(loadError.message || 'Şubeler alınırken bir hata oluştu.');
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const filteredBranches = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR');

    if (!normalizedSearch) {
      return branches;
    }

    return branches.filter((branch) =>
      branch.name.toLocaleLowerCase('tr-TR').includes(normalizedSearch),
    );
  }, [branches, searchQuery]);

  const resetForm = () => {
    setForm(initialFormState());
    setError('');
  };

  const closeCreateModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsCreateModalVisible(false);
    setEditingBranch(null);
    resetForm();
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    resetForm();
    setIsCreateModalVisible(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
    });
    setError('');
    setIsCreateModalVisible(true);
  };

  const updateForm = (field: keyof BranchFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (error) {
      setError('');
    }
  };

  const handleSubmitBranch = async () => {
    if (!form.name.trim()) {
      setError('Şube adı zorunludur.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        name: form.name,
      };

      if (editingBranch) {
        await updateBranch(editingBranch.id, payload);
      } else {
        await createBranch(payload);
      }

      setIsCreateModalVisible(false);
      setEditingBranch(null);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Şube kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = (branch: Branch) => {
    Alert.alert('Şubeyi sil', `"${branch.name}" şubesini silmek istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBranch(branch.id);
          } catch (deleteError) {
            Alert.alert(
              'Silme başarısız',
              deleteError instanceof Error ? deleteError.message : 'Şube silinemedi.',
            );
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.page}>
          <View style={styles.headerBanner}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Geri"
                style={({ pressed }) => [styles.topBarIconButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back' }}
                  size={18}
                  tintColor="#FFF7EE"
                />
              </Pressable>
              <ThemedText type="subtitle" style={styles.topBarTitle}>
                Şubeler
              </ThemedText>
              <Pressable
                accessibilityLabel="Bildirimler"
                style={({ pressed }) => [styles.topBarIconButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'bell', android: 'notifications_none', web: 'notifications' }}
                  size={18}
                  tintColor="#FFF7EE"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.toolbarRow}>
            <ThemedView type="backgroundElement" style={styles.searchCard}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={18}
                tintColor="#B19981"
              />
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Şube ara..."
                placeholderTextColor="#B19981"
                style={styles.searchInput}
                value={searchQuery}
              />
            </ThemedView>

            <Pressable
              accessibilityLabel="Yeni şube ekle"
              onPress={openCreateModal}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton]}>
              <ThemedText style={styles.addButtonText}>+</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={styles.tableCard}>
              {isLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color="#D9911A" />
                  <ThemedText themeColor="textSecondary">Şubeler yükleniyor...</ThemedText>
                </View>
              ) : screenError ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold" style={styles.errorText}>
                    Şubeler yüklenemedi
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    {screenError}
                  </ThemedText>
                </View>
              ) : filteredBranches.length === 0 ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold">Henüz şube bulunmuyor.</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    İlk şubeyi eklemek için sağ üstteki artı butonunu kullanın.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.listCard}>
                  <View style={styles.listHeader}>
                    <ThemedText type="smallBold" style={styles.listHeaderText}>
                      Şube Adı
                    </ThemedText>
                  </View>

                  {filteredBranches.map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() => openEditModal(item)}
                      style={({ pressed }) => [
                        styles.listRow,
                        index % 2 === 1 && styles.listRowAlt,
                        pressed && styles.listRowPressed,
                      ]}>
                      <View style={[styles.branchAvatar, { backgroundColor: getAvatarColor(item.name) }]}>
                        <ThemedText style={styles.branchAvatarText}>
                          {item.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
                        </ThemedText>
                      </View>
                      <ThemedText type="smallBold" style={styles.branchName} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </ThemedView>
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        animationType="slide"
        onRequestClose={closeCreateModal}
        transparent
        visible={isCreateModalVisible}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}>
            <ThemedView style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    {editingBranch ? 'Şubeyi Düzenle' : 'Yeni Şube'}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    {editingBranch
                      ? 'Şube bilgisini Firebase&apos;de güncelle'
                      : 'Yeni şubeyi Firebase&apos;e kaydet'}
                  </ThemedText>
                </View>

                <Pressable onPress={closeCreateModal} style={styles.closeButton}>
                  <ThemedText style={styles.closeButtonText}>Kapat</ThemedText>
                </Pressable>
              </View>

              <View style={styles.formFields}>
                <FormField
                  label="Şube Adı"
                  onChangeText={(value) => updateForm('name', value)}
                  placeholder="Örn. Merkez Şube"
                  value={form.name}
                />

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
              </View>

              <Pressable
                disabled={isSubmitting}
                onPress={handleSubmitBranch}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isSubmitting) && styles.pressedButton,
                ]}>
                <ThemedText style={styles.primaryButtonText}>
                  {isSubmitting
                    ? 'Kaydediliyor...'
                    : editingBranch
                      ? 'Değişiklikleri Kaydet'
                      : 'Şubeyi Kaydet'}
                </ThemedText>
              </Pressable>

              {editingBranch ? (
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => {
                    closeCreateModal();
                    handleDeleteBranch(editingBranch);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryDangerButton,
                    (pressed || isSubmitting) && styles.pressedButton,
                  ]}>
                  <ThemedText style={styles.secondaryDangerButtonText}>Şubeyi Sil</ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View>
      <ThemedText type="smallBold" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A78F79"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function getAvatarColor(name: string) {
  const palette = ['#7B5734', '#A96B1C', '#B8842A', '#886143', '#D19A2A'];
  const total = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return palette[total % palette.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 0,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  headerBanner: {
    marginHorizontal: -Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    marginBottom: Spacing.two,
    backgroundColor: '#2F1D0E',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  topBarTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: '#FFF7EE',
  },
  topBarIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 248, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.18)',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  searchCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#F1E3D4',
    backgroundColor: '#FFFCF9',
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    fontSize: 15,
    color: '#2E2117',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#D9911A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 26,
  },
  tableCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
  },
  listCard: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3E7DA',
    backgroundColor: '#FFFDFB',
  },
  listHeader: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FCF3E8',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E1D0',
  },
  listHeaderText: {
    fontSize: 12,
    color: '#7C644C',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EADF',
    backgroundColor: '#FFFFFF',
  },
  listRowAlt: {
    backgroundColor: '#FFFCF8',
  },
  listRowPressed: {
    backgroundColor: '#F8EFE4',
  },
  branchAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchAvatarText: {
    color: '#FFFFFF',
    fontWeight: 800,
    fontSize: 14,
  },
  branchName: {
    flex: 1,
    fontSize: 14,
    color: '#2E2117',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'flex-end',
  },
  modalKeyboardWrap: {
    width: '100%',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Platform.select({ ios: 36, android: 28, default: 28 }),
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  closeButtonText: {
    color: '#7B6049',
    fontWeight: 700,
  },
  formFields: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  fieldLabel: {
    marginBottom: 8,
    color: '#5D4737',
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6D6C5',
    backgroundColor: '#FCF8F3',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#2E2117',
  },
  errorText: {
    color: '#C83D3D',
    fontWeight: 700,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#D9911A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 800,
  },
  secondaryDangerButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0C9C9',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  secondaryDangerButtonText: {
    color: '#C23B3B',
    fontSize: 15,
    fontWeight: 800,
  },
  pressedButton: {
    opacity: 0.82,
  },
});
