import { ManagerSectionScreen } from '@/components/manager-section-screen';
import { useAuth } from '@/context/auth-context';

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <ManagerSectionScreen
      title="Ayarlar"
      subtitle="Mudur hesabina ait temel ayarlar ve guvenlik islemleri bu ekranda yer alacak."
      badgeLabel="Ayar"
      cardTitle="Hesap ve Sistem"
      cardDescription="Bildirimler, oturum ayarlari ve uygulama tercihleri bu bolumde duzenlenebilir."
      detailsTitle="Guvenlik"
      detailsDescription="Gerektiginde bu ekrandan oturumu kapatabilir ve yonetici tarafindaki ayarlari guncelleyebilirsin."
      actionLabel="Cikis Yap"
      onActionPress={logout}
    />
  );
}
