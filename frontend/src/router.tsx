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
const Start = lazy(() => import("./components/onboarding/start"))
import { FullSpinner } from "@/components/Loader"
import OnboardingLayout from "./layouts/OnboardingLayout";
import Loader from "./components/Loader"
import ErrorPage from "./pages/error";
import RegistrationLayout from "./layouts/RegistrationLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import UnderConstruction from "./pages/dashboard/UnderConstruction";
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));
const Contact = lazy(() => import("./pages/onboarding/Contact"));
const SchoolInfo = lazy(() => import("./pages/onboarding/SchoolInfo"));
const Location = lazy(() => import("./pages/onboarding/Location"))
const ContactForm = lazy(() => import("./pages/onboarding/ContactForm"))
const SchoolForm = lazy(() => import("./pages/onboarding/SchoolForm"))







export const router = createBrowserRouter([
  {

    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Suspense fallback={<Loader />}><Homepage /></Suspense> },
      { path: "auth/onboarding", element: <Suspense fallback={<FullSpinner />}><Start /></Suspense > }
    ]
  },
  {

    element: <RegistrationLayout />,
    children: [
      { path: "signup", element: <Suspense fallback={<FullSpinner />} ><SignupPage /></Suspense> },
      { path: "auth/login", element: <Suspense fallback={<FullSpinner />}><Signin /></Suspense> },
      { path: "auth/signup", element: <Suspense fallback={<FullSpinner />}><Signup /></Suspense> },
      { path: "auth/reset-password", element: <Suspense fallback={<FullSpinner />}><ForgotPassword /></Suspense> },
      { path: "auth/reset-check", element: <Suspense fallback={<FullSpinner />}><CheckYourEmail /></Suspense> },
      {
        path: "auth/verify-email", element: <Suspense fallback={<FullSpinner />} ><SignUpVerification /></Suspense>
      },
      { path: "auth/verified", element: <Suspense fallback={<FullSpinner />}><SignUpVerified /></Suspense> },
      { path: "auth/reset-email", element: <Suspense fallback={<FullSpinner />}><ChangeEmail /></Suspense> }]
  },
  {
    path: "/onboarding",
    element: <OnboardingLayout />,
    children: [
      { index: true, element: <Suspense fallback={<FullSpinner />}><Welcome /></Suspense> },
      { path: "location", element: <Suspense fallback={<FullSpinner />}><Location /></Suspense> },
      { path: "trusted-contact", element: <Suspense fallback={<FullSpinner />}><Contact /></Suspense> },
      { path: "contact-form", element: <Suspense fallback={<FullSpinner />}><ContactForm /></Suspense> },
      { path: "school-info", element: <Suspense fallback={<FullSpinner />}><SchoolInfo /></Suspense> },
      { path: "school-form", element: <Suspense fallback={<FullSpinner />}><SchoolForm /></Suspense> }


    ]

  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <UnderConstruction /> }
    ]
  }
])
