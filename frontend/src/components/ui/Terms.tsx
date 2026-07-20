
function Terms({ terms = false, isSignup = false }: { terms?: boolean; isSignup?: boolean }) {
  return (
    <div className="flex-1">
      {terms ? <small className="text-xs text-center text-neutral-600">By continuing you agree to our <a className="underline decoration-primary text-primary font-medium">Terms</a> and <a className="underline text-primary decoration-primary font-medium">Privacy Policy</a>.</small> : <span className="mt-9"></span>}
      <p className="text-neutral-600 text-center">
        {isSignup ?
          <>Already have an account? {" "}
            <a href="/auth/login" className="underline text-primary font-semibold">Log in</a>

          </> :
          <>
            Don't have an account? {" "}
            <a href="/auth/signup" className="underline text-primary font-semibold">Create Account</a>
          </>}
      </p>

    </div>
  )
}

export default Terms;
