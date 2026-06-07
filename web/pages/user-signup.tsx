"use client";

import { LoginPageGate } from "@/components/login/LoginPageGate";
import { UserAuthView } from "@/view/signUp";

const UserSignupPage = () => (
  <LoginPageGate
    portal="user"
    renderLogin={() => <UserAuthView defaultTab="signup" />}
  />
);

export default UserSignupPage;
