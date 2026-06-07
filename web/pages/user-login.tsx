"use client";

import { LoginPageGate } from "@/components/login/LoginPageGate";
import { UserAuthView } from "@/view/signUp";

const UserLoginPage = () => (
  <LoginPageGate
    portal="user"
    renderLogin={() => <UserAuthView defaultTab="login" />}
  />
);

export default UserLoginPage;
