import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import ValidarCorreoComponent from "../../components/login/ValidarCorreoComponent";

/**
 * Pantalla de Validación de Correo para Organización
 * Pantalla final del registro de organización
 * Valida el correo mediante código OTP de 6 dígitos
 */
export default function ValidarCorreoOrganizacionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Obtener parámetros de la navegación
  const email = params.email as string;
  const userId = params.userId ? parseInt(params.userId as string) : 0;
  const fullName = params.fullName as string;

  const handleSuccess = () => {
    // Redirigir al home después de validar correo
    router.replace("/home");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      <ValidarCorreoComponent
        email={email}
        userId={userId}
        fullName={fullName}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </View>
  );
}
