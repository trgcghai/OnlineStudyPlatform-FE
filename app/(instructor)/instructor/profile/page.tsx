import PasswordForm from "@/components/profile/PasswordForm";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";

export default function InstructorProfilePage() {
  return (
    <section className="flex w-full max-w-xl flex-col gap-6">
      <ProfileAvatar />
      <ProfileInfoForm />
      <PasswordForm />
    </section>
  );
}
