import React from "react";
import { AuthForm } from "@/components/AuthForm";

const StudentLogin = () => {
  return <AuthForm defaultRole="student" portalRole="student" askRole={false} />;
};

export default StudentLogin;
