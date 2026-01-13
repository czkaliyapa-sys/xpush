import { people01, people02, people03, facebook, instagram, linkedin, tiktok, airbnb, binance, coinbase, dropbox, send, shield, star  } from "../assets";

export const navLinks = [
  {
    id: "home",
    title: "Home",
    url: "/",
  },
  {
    id: "gadgets",
    title: "Gadgets",
    url: "/gadgets",
  },
  {
    id: "trade-in",
    title: "Trade-In",
    url: "/trade-in",
  },
  {
    id: "find-us",
    title: "Find Us",
    url: "/find-us",
  },
  {
    id: "contact",
    title: "Contact",
    url: "/contact",
  },
  {
    id: "more",
    title: "More",
    submenu: [
      {
        id: "about-us",
        title: "About Us",
        url: "/about",
      },
      {
        id: "terms-and-conditions",
        title: "Terms & Conditions",
        url: "/terms-and-conditions",
      },
      {
        id: "help",
        title: "Help",
        url: "/help",
      },
      {
        id: "installment-policy",
        title: "Installment Policy",
        url: "/installment-policy",
      },
    ],
  },
];

// Flattened navigation for mobile menu
export const mobileNavLinks = [
  {
    id: "home",
    title: "Home",
    url: "/",
  },
  {
    id: "gadgets",
    title: "Gadgets",
    url: "/gadgets",
  },
  {
    id: "find-us",
    title: "Find Us",
    url: "/find-us",
  },
  {
    id: "contact",
    title: "Contact",
    url: "/contact",
  },
  {
    id: "trade-in",
    title: "Trade-In",
    url: "/trade-in",
  },
  {
    id: "about-us",
    title: "About Us",
    url: "/about",
  },
  {
    id: "terms-and-conditions",
    title: "Terms & Conditions",
    url: "/terms-and-conditions",
  },
  {
    id: "help",
    title: "Help",
    url: "/help",
  },
  {
    id: "installment-policy",
    title: "Installment Policy",
    url: "/installment-policy",
  },
];

export const features = [
  {
    id: "feature-1",
    icon: star,
    title: "Top Quality",
    content:
    "You access the mid-range to latest tech\n\n" +
    "approved, ready for usage",
  },
  {
    id: "feature-2",
    icon: shield,
    title: "Secured",
    content:
      "We take proactive steps make sure your information and transactions are secure.",
  },
  {
    id: "feature-3",
    icon: send,
    title: "Always On Available",
    content:
      "We are always there for any time you need us, our customers are the first priority",
  },
];

export const feedback = [
  {
    id: "feedback-1",
    content:
      "Our mission is to empower individuals and organizations by giving them flexible, affordable access to the technology they need to grow, create, and thrive.",
    name: "",
    title: "",
  },
  {
    id: "feedback-2",
    content:
      "Your store, your rules, your way. You decide what you want. We’ll help you get there.",
    name: "",
    title: "",

  },
  {
    id: "feedback-3",
    content:
      "Empowerment, not just ownership. Access, not limitation. That’s the Xtrapush vision",
    name: "",
    title: "",
  },
];

export const stats = [
  {
    id: "stats-1",
    title: "Active Users",
    value: "50+",
  },
  {
    id: "stats-2",
    title: "Trusted by Elyon HealthCare and XtraHealth Care",
    value: "2+",
  },
  {
    id: "stats-3",
    title: "Transactions",
  value: "MWK 6000+ ",
  },
];

export const footerLinks = [
  {
    title: "Shop",
    links: [
      {
        name: "Gadgets",
        link: "/gadgets",
      },
      {
        name: "Trade-In",
        link: "/trade-in",
      },
    ],
  },
  {
    title: "Support",
    links: [
      {
        name: "Help Center",
        link: "/help",
      },
      {
        name: "Terms & Conditions",
        link: "/terms-and-conditions",
      },
      {
        name: "Contact Us",
        link: "/contact",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        name: "Instalment Policy",
        link: "/installment-policy",
      },
    ],
  },
];

export const socialMedia = [
  {
    id: "social-media-1",
    icon: instagram,
    link: "https://www.instagram.com/itsxtrapush?igsh=MXRyZm5kYXI0bWRiMQ==",
  },
  {
    id: "social-media-2",
    icon: facebook,
    link: "https://www.facebook.com/share/17D5SQVKc6/?mibextid=wwXIfr",
  },
  {
    id: "social-media-3",
    icon: tiktok,
    link: "https://www.tiktok.com/@xtrapushgadgets?_t=ZN-90UIHKB2IYo&_r=1",
  },
  {
    id: "social-media-4",
    icon: linkedin,
    link: "https://www.linkedin.com/company/coders4u/",
  },
];

export const clients = [
  {
    id: "client-1",
    logo: airbnb,
  },
  {
    id: "client-2",
    logo: binance,
  },
  {
    id: "client-3",
    logo: coinbase,
  },
  {
    id: "client-4",
    logo: dropbox,
  },
];
