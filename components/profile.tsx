"use client";

import { useCurrentUser } from "@/hooks/useAuth";

const Profile = () => {
  const { data } = useCurrentUser();

  console.log("Current user: ", data);

  return <div>Profile</div>;
};

export default Profile;
