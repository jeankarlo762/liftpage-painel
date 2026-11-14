import { requireUser } from "@/lib/auth";
import { PasswordForm, ProfileForm } from "./Forms";

export default async function PerfilPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <h1 className="h1">Perfil</h1>
      <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone, company: user.company, document: user.document }} />
      <PasswordForm />
    </div>
  );
}
