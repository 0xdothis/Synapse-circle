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
import Emergency from "./pages/dashboard/Emergency";
import { protectedLoader, publicOnlyLoader, verifiedOnlyLoader } from "./utils/authLoader";
import HospitalDetails from "./pages/dashboard/HospitalDetails";
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));
const Contact = lazy(() => import("./pages/onboarding/Contact"));
const SchoolInfo = lazy(() => import("./pages/onboarding/SchoolInfo"));
const Location = lazy(() => import("./pages/onboarding/Location"))
const ContactForm = lazy(() => import("./pages/onboarding/ContactForm"))
const SchoolForm = lazy(() => import("./pages/onboarding/SchoolForm"));
const DashboardHome = lazy(() => import("@/components/dashboard/Home"))
const EmergencyCountDown = lazy(() => import("./pages/dashboard/CountDown"))
const FalseAlarm = lazy(() => import("./pages/dashboard/FalseAlarm"))
const EmergencyEnded = lazy(() => import("./pages/dashboard/EmergencyEnded"))
const EmergencyCancelled = lazy(() => import("./pages/dashboard/EmergencyCancelled"))
const HospitalDirectory = lazy(() => import("./pages/dashboard/Directory"))
const Alert = lazy(() => import("./pages/dashboard/Alert"))
const AlertDetail = lazy(() => import("./pages/dashboard/AlertDetail"))
const Profile = lazy(() => import("./pages/dashboard/Profile"))


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
      { path: "signup", loader: publicOnlyLoader(), element: <Suspense fallback={<FullSpinner />} ><SignupPage /></Suspense> },
      { path: "auth/login", loader: publicOnlyLoader(), element: <Suspense fallback={<FullSpinner />}><Signin /></Suspense> },
      { path: "auth/signup", loader: publicOnlyLoader(), element: <Suspense fallback={<FullSpinner />}><Signup /></Suspense> },
      { path: "auth/reset-password", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><ForgotPassword /></Suspense> },
      { path: "auth/reset-check", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><CheckYourEmail /></Suspense> },
      {
        path: "auth/verify-email", loader: verifiedOnlyLoader(), element: <Suspense fallback={<FullSpinner />} ><SignUpVerification /></Suspense>
      },
      { path: "auth/verified", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><SignUpVerified /></Suspense> },
      { path: "auth/reset-email", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><ChangeEmail /></Suspense> }]
  },
  {
    path: "/onboarding",
    loader: protectedLoader(),
    element: <OnboardingLayout />,
    children: [
      { index: true, loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><Welcome /></Suspense> },
      { path: "location", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><Location /></Suspense> },
      { path: "trusted-contact", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><Contact /></Suspense> },
      { path: "contact-form", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><ContactForm /></Suspense> },
      { path: "school-info", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><SchoolInfo /></Suspense> },
      { path: "school-form", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><SchoolForm /></Suspense> }


    ]

  },
  {
    path: "/dashboard",
    loader: protectedLoader(),
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Suspense fallback={<FullSpinner />}><DashboardHome /></Suspense> },
      { path: "countdown", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><EmergencyCountDown /></Suspense> },
      { path: "emergency", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><Emergency /></Suspense> },
      {
        path: "false-alarm", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><FalseAlarm /></Suspense>
      },
      { path: "emergency-ended", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><EmergencyEnded /></Suspense> },
      { path: "emergency-cancelled", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><EmergencyCancelled /></Suspense> },
      { path: "directory", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><HospitalDirectory /></Suspense> },
      { path: "history", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><Alert /></Suspense> },
      { path: "history/:id", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><AlertDetail /></Suspense> },
      { path: "profile", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><Profile /></Suspense> },
      { path: "directory/:id", loader: protectedLoader(), element: <Suspense fallback={<FullSpinner />}><HospitalDetails /></Suspense> }
    ]
  }
])
