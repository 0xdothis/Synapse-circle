import AuthForm from "../AuthForm";

function Signup() {

  return <AuthForm title="Create Account" description="Create your SafeWalk Campus account to get started." isSignup={true} to="/auth/verification" CTA="Create Account" />
}

export default Signup
