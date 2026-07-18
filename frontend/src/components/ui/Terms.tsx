
function Terms({ terms = false }: { terms?: boolean; }) {
  return (
    <>
      {terms ? <small className="text-xs text-neutral-600">By continuing you agree to our <a className="underline decoration-primary text-primary font-medium">Terms</a> and <a className="underline text-primary decoration-primary font-medium">Privacy Policy</a>.</small> : <span className="mt-9"></span>}
      <p className="text-neutral-600">Already have an account? <a className="underline text-primary font-semibold">Log in</a></p>

    </>
  )
}

export default Terms;
