import React from "react";
const AVATAR1_SRC = "/assets/images/testimonial-person1.png";
const AVATAR2_SRC = "/assets/images/testimonial-person2.png";
const AVATAR3_SRC = "/assets/images/testimonial-person3.png";
const LEFT_ICON_SRC = "/assets/icons/left.svg";
const RIGHT_ICON_SRC = "/assets/icons/right.svg";

type Testimonial = {
  name: string;
  title: string;
  text: string;
  avatar: string;
};

function AvatarRow({
  src,
  name,
  title,
}: {
  src: string;
  name: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <img
        alt={`${name} avatar`}
        className="w-[42px] h-[42px] rounded-full"
        src={src}
        loading="lazy"
        width={42}
        height={42}
      />
      <div className="flex flex-col">
        <p className="font-semibold text-[15px] text-white">{name}</p>
        <p className="text-white text-[12px]">{title}</p>
      </div>
    </div>
  );
}

function TestimonialCard({
  avatar,
  name,
  title,
  text,
}: {
  avatar: string;
  name: string;
  title: string;
  text: string;
}) {
  return (
    <article
      className="relative rounded-[14px]
    p-6 sm:p-7 md:p-8
    w-full
    border-2 border-[#2a1550]
    bg-[radial-gradient(120%_120%_at_50%_50%,#25144a_0%,#1a0b2e_45%,#0e0618_100%)]
    shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_0_20px_rgba(0,0,0,0.55)]"
    >
      <div className="p-6 flex flex-col gap-6 h-full justify-between">
        <p
          className="text-[#ADADAD] text-[16px] font-medium leading-[24px]"
          style={{ fontFamily: "'Monsiret', sans-serif" }}
        >
          {text}
        </p>

        <div className="pt-4">
          <AvatarRow src={avatar} name={name} title={title} />
        </div>
      </div>
    </article>
  );
}

const testimonials: Testimonial[] = [
  {
    avatar: AVATAR3_SRC,
    name: "Mrs. Vanita",
    title: "Clinic Operations Lead",
    text:
      "We used to have one person juggling walk‑ins, phones, and follow‑ups. InstaFlow quietly took over the phone chaos, and now my team can actually look patients in the eye instead of staring at a ringing line.",
  },
  {
    avatar: AVATAR1_SRC,
    name: "Ms. Kitty",
    title: "Practice Manager",
    text:
      "Our callers kept telling us they hated voicemail. With InstaFlow, someone “picks up” every time, even after hours. The tone feels warm and human, and our team just confirms the appointments in the morning.",
  },
  {
    avatar: AVATAR2_SRC,
    name: "Mr Eugene",
    title: "Founder Nanny Training",
    text:
      "I was skeptical an AI voice could sound this natural. Parents explain what they need, Instaflow gathers the details, and I get a clean summary with calls already booked into my calendar.",
  },
];

function Heading() {
  return (
    <div className="text-center pt-4 uppercase w-full">
      <p
        className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa] text-[28px] lg:text-[40px] leading-[46.555px]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Trusted by Growing 
      </p>
      <p
        className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa] text-[28px] lg:text-[40.75px] leading-[46.555px]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Businesses Worldwide
      </p>
    </div>
  );
}

export const Testimonial = () => {
  return (
    <section
      className="relative overflow-hidden py-28
          bg-[#0c0616]
          shadow-[inset_0_0_80px_0_rgba(141,35,255,0.12)]

          before:content-['']
          before:absolute before:top-0 before:left-0
          before:w-full before:h-[1px]
          before:bg-gradient-to-r
          before:from-transparent
          before:via-purple-400
          before:to-transparent

          after:content-['']
          after:absolute after:bottom-0 after:left-0
          after:w-full after:h-[1px]
          after:bg-gradient-to-r
          after:from-transparent
          after:via-purple-400
          after:to-transparent"
      aria-label="Testimonials"
    >
      <div className="pb-20">
        <div className="flex justify-center items-center gap-3">
          <img src={LEFT_ICON_SRC} alt="" className="h-[30px] w-[80px] md:w-[100px] lg:w-[135px]" />
          <p className="text-white uppercase tracking-[2px] text-[16px]">
            Testimonial
          </p>
          <img src={RIGHT_ICON_SRC} alt="" className="h-[30px] w-[80px] md:w-[100px] lg:w-[135px]" />
        </div>
        <Heading />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, index) => (
            <TestimonialCard
              key={`${t.name}-${index}`}
              avatar={t.avatar}
              name={t.name}
              title={t.title}
              text={t.text}
            />
          ))}
        </div>
      </div>
    </section>
  );
}