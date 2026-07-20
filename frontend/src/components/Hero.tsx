import Pill from "./ui/Pill";
import phone from "../assets/home/phone.svg"
import Button from "./ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Segment from "./Segment"
import Card from './Card'
import { FAQs, features, how_it_works } from '../data'
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router";

function Hero() {

  const navigate = useNavigate();

  return (
    <section id="home" className="mt-20 space-y-4 scroll-mt-20">
      <div className="space-y-4 mt-4">
        <Pill text={"Campus safety, reimagined"} />
        <h2 className="text-3xl font-bold text-neutral-900">Stay Safe. <br /> Stay Connected.</h2>
        <p className="text-default">SafeWalk Campus instantly alerts your trusted contacts and campus security with your live location when you need help most.</p>
      </div>
      <div className=" overflow-hidden flex justify-center mt-12">
        <img src={phone} />
      </div>
      <Button className=" w-full gap-2" onClick={() => navigate("/signup")}>Try SafeWalk Campus
        <HugeiconsIcon icon={ArrowRight01Icon} size={24} /></Button>
      <Segment id="features" title="Features" heading='Everything you need to stay safe' description="Essential tools designed to help you stay prepared, connected, and protected when it matters most." children={<Card data={features} />} />
      <Segment id="how-it-works" title="How it works" heading="Simple. Fast. Reliable." description='Four simple steps to help you stay connected and get help when you need it most.' children={<Card data={how_it_works} />} />
      <Segment id="faq" title="FAQs" heading="Common questions" description="Everything you need to know before using SafeWalk." className="flex flex-col justify-center">
        <Accordion defaultValue={["item-1"]} className=" space-y-2">
          {FAQs?.map(({ value, answer, question }) => (
            <AccordionItem key={value} value={value} className="bg-white border border-neutral-100 rounded-xl">
              <AccordionTrigger className="text-neutral-900 font-semibold p-4">{question}</AccordionTrigger>
              <AccordionContent className="text-default px-4">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Segment>

    </section>
  )

}

export default Hero;
