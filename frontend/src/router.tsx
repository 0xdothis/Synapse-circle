import { createBrowserRouter } from "react-router";
import SignupPage from "@/pages/SignupPage";
import RootLayout from "@/layouts/RootLayout";
import Homepage from "./pages/Homepage";
import CreateAccount from "./components/CreateAccount";



export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Homepage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/signup/email", element: <CreateAccount /> }
    ]
  }
])
