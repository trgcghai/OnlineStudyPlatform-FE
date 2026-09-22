import PasswordForm from "@/components/profile/PasswordForm";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";

export default function LearnerProfilePage() {
  return (
    <section className="w-full space-y-6">
      <ProfileAvatar />
      <ProfileInfoForm />
      <PasswordForm />
    </section>
  );
}
