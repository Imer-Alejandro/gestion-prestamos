import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import ValidarCorreoComponent from "../../components/login/ValidarCorreoComponent";

/**
 * Pantalla de Validación de Correo para Empleado
 * Similar a la validación de usuario pero específica para empleados
 * Valida el correo mediante código OTP de 6 dígitos
 */
export default function ValidarCorreoEmpleadoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Obtener parámetros de la navegación
  const email = params.email as string;
  const userId = params.userId ? parseInt(params.userId as string) : 0;
  const fullName = params.fullName as string;

  const handleSuccess = () => {
    // Redirigir a la siguiente pantalla de empleado
    router.replace("/login/completar-informacion");
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
  