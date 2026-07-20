import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NavBar from "@/components/navigation/Navbar";
import { useNavigation } from "react-router";


function Homepage() {

  return (
    <>
      <NavBar />
      <Hero />
      <Banner />
      <Footer />
    </>
  )
}

export default Homepage
