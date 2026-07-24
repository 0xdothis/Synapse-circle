import Pill from "./ui/Pill";

import Button from "./ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Segment from "./Segment"
import Card from './Card'
import { FAQs, features, how_it_works } from '../data'
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router";
import { trackEvent } from "@/lib/mixpanelClient";

function Hero() {

  const navigate = useNavigate();

  return (
    <section id="home" className="mt-20 w-full flex flex-col space-y-4 scroll-mt-20 lg:scroll-mt-30">
      <div className="lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:gap-8 lg:justify-center lg:mt-24">
        <div className="space-y-4 lg:space-y-8 mt-4">
          <Pill text={"Campus safety, reimagined"} />
          <h2 className="text-3xl lg:text-[4rem] font-bold text-neutral-900">Stay Safe. <br /> Stay Connected.</h2>
          <p className="text-default lg:text-[1.25rem]">SafeWalk Campus instantly alerts your trusted contacts and campus security with your live location when you need help most.</p>
          <Button className=" lg:flex lg:w-fit hidden w-full gap-2" onClick={() => {
            trackEvent("signup_started")
            navigate("/signup")
          }}>Try SafeWalk Campus
            <HugeiconsIcon icon={ArrowRight01Icon} size={24} /></Button>
        </div>
        <div className="overflow-hidden items-center justify-center mt-12 mb-4 lg:mb-0">
          <picture className="object-center w-75 lg:w-150">
            <source type="image/avif" srcSet="
            /home/phone.avif 1x, /home/phone@2x.avif 2x, /home/phone@3x.avif 3x
            " />


            <source type="image/png" srcSet="
            /home/phone.png 1x, /home/phone@2x.png 2x, /home/phone@3x.png 3x
            " />
            <img src="/home/phone.png" alt="hand holding a phone with safewalk app in it" className="w-full h-full" />
          </picture>


        </div>
        <Button className="lg:hidden w-full gap-2" onClick={() => navigate("/signup")}>Try SafeWalk Campus
          <HugeiconsIcon icon={ArrowRight01Icon} size={24} /></Button>
      </div>
      <Segment id="features" title="Features" heading='Everything you need to stay safe' description="Essential tools designed to help you stay prepared, connected, and protected when it matters most." children={<Card data={features} className="lg:grid-cols-3 lg:grid-rows-2 lg:gap-4" />} />
      <Segment id="how-it-works" title="How it works" heading="Simple. Fast. Reliable." description='Four simple steps to help you stay connected and get help when you need it most.' children={<Card data={how_it_works} className="lg:grid-cols-4 lg:grid-rows-1 gap-4" />} />
      <Segment id="faq" title="FAQs" heading="Common questions" description="Everything you need to know before using SafeWalk." className="flex flex-col justify-center lg:w-full">
        <Accordion defaultValue={["item-1"]} className="space-y-2 lg:w-full">
          {FAQs?.map(({ value, answer, question }) => (
            <AccordionItem key={value} value={value} className="bg-white border border-neutral-100 rounded-xl">
              <AccordionTrigger className="text-neutral-900 font-semibold p-4 lg:w-full">{question}</AccordionTrigger>
              <AccordionContent className="text-default px-4">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Segment>

    </section>
  )

}

export default Hero;
