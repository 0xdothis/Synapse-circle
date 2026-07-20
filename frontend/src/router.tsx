import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router";
import SignupPage from "@/pages/SignupPage";
import RootLayout from "@/layouts/RootLayout";
const Homepage = lazy(() => import("./pages/Homepage"));

const ChangeEmail = lazy(() => import("./components/signup/Verification").then(m => ({ default: m.ChangeEmail })));
const CheckYourEmail = lazy(() => import("./components/signup/Verification").then(m => ({ default: m.CheckYourEmail })));
const ForgotPassword = lazy(() => import("./components/signup/Verification").then(m => ({ default: m.ForgotPassword })));
const SignUpVerification = lazy(() => import("./components/signup/Verification").then(m => ({ default: m.SignUpVerification })));
const SignUpVerified = lazy(() => import("./components/signup/Verification").then(m => ({ default: m.SignUpVerified })));

const Signup = lazy(() => import("./components/auth/signup"));
const Signin = lazy(() => import("./components/auth/login"));
import Loader from "@/components/Loader"




export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Suspense fallback={<Loader />}><Homepage /></Suspense> },
      { path: "/signup", element: <Suspense fallback={<Loader />} ><SignupPage /></Suspense> },
      { path: "/auth/signup", element: <Suspense fallback={<Loader />}><Signup /></Suspense> },
      { path: "/login", element: <Suspense fallback={<Loader />}><Signin /></Suspense> },
      { path: "/auth/reset-password", element: <Suspense fallback={<Loader />}><ForgotPassword /></Suspense> },
      { path: "/auth/reset-check", element: <Suspense fallback={<Loader />}><CheckYourEmail /></Suspense> },
      {
        path: "/auth/verification", element: <Suspense fallback={<Loader />} ><SignUpVerification /></Suspense>
      },
      { path: "/auth/verified", element: <Suspense fallback={<Loader />}><SignUpVerified /></Suspense> },
      { path: "/auth/reset-email", element: <Suspense fallback={<Loader />}><ChangeEmail /></Suspense> }
    ]
  }
])
