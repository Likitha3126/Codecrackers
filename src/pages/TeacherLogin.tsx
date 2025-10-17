import React from "react";
import { AuthForm } from "@/components/AuthForm";

const TeacherLogin = () => {
  return <AuthForm defaultRole="teacher" portalRole="teacher" askRole={false} />;
};

export default TeacherLogin;
