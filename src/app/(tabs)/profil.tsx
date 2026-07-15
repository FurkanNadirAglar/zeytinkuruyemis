import { EmployeeSectionScreen } from '@/components/employee-section-screen';
import { useAuth } from '@/context/auth-context';

export default function ProfilScreen() {
  const { logout } = useAuth();

  return (
    <EmployeeSectionScreen
      title="Profil"
      subtitle="Calisan hesabina ait temel bilgiler ve oturum islemleri bu alanda olacak."
      badgeLabel="Profil"
      cardTitle="Hesabim"
      cardDescription="Kullanici bilgileri, vardiya ozetleri ve temel hesap ayarlari bu ekranda gosterilebilir."
      detailsTitle="Oturum"
      detailsDescription="Bu sekmeden cikis yapabilir ve ileride hesap bilgilerini duzenleyebilirsin."
      actionLabel="Cikis Yap"
      onActionPress={logout}
    />
  );
}
