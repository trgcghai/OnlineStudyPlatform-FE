import PasswordForm from "@/components/profile/PasswordForm";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";

export default function InstructorProfilePage() {
  return (
    <section className="w-full flex items-center justify-center">
      <div className="flex flex-col w-xl gap-6">
        <ProfileAvatar />
        <ProfileInfoForm />
        <PasswordForm />
      </div>
    </section>
  );
}
