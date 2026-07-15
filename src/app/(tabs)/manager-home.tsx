import { ManagerSectionScreen } from '@/components/manager-section-screen';
import { useAuth } from '@/context/auth-context';

export default function ManagerHomeScreen() {
  const { logout } = useAuth();

  return (
    <ManagerSectionScreen
      title="Dashboard"
      subtitle="Mudur girisi ile yonetici paneline geldiniz."
      badgeLabel="Mudur"
      cardTitle="Genel Bakis"
      cardDescription="Raporlama, urun yonetimi ve sube islemleri bu akista yonetilecek."
      detailsTitle="Mudur Tarafi"
      detailsDescription="Alt navigasyon ile dashboard, raporlar, urunler, subeler ve ayarlar alanlari birbirinden ayrildi."
      actionLabel="Cikis Yap"
      onActionPress={logout}
    />
  );
}
