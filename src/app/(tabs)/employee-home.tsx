import { EmployeeSectionScreen } from '@/components/employee-section-screen';
import { useAuth } from '@/context/auth-context';

export default function EmployeeHomeScreen() {
  const { logout } = useAuth();

  return (
    <EmployeeSectionScreen
      title="Ana Sayfa"
      subtitle="Calisan girisi ile kendi operasyon ekranina geldiniz."
      badgeLabel="Calisan"
      cardTitle="Gunluk Is Akisi"
      cardDescription="Sayim, urun kontrolu ve saha icindeki temel islemler bu ekrandan yonetilecek."
      detailsTitle="Kisa Yol"
      detailsDescription="Alt menuden sayim ekranina gecebilir veya profil sekmesinden oturumu yonetebilirsin."
      actionLabel="Cikis Yap"
      onActionPress={logout}
    />
  );
}
