import { DetailsRounded } from "@mui/icons-material";
import { macbookm4, iphone16, iphone16max, s24, s24ul, s25, s25ul, tuf1 } from "./assets/index.js";


const gadgets = [
  {
    id: 1,
    title: "MacBook Pro M4",
    date: "January 20, 2024",
    image: macbookm4,
    more_img: [macbookm4],
    number: 2,
    description: "A powerful laptop for developers and creatives.",
    price: "1400"
  },
  {
    id: 2,
    title: "iPhone 16 Pro Max",
    date: "February 5, 2025",
    image: iphone16max,
    number: 0,
    more_img: [iphone16max],
    description: "The latest smartphone with an advanced camera system.",
    price: "950"
  },
  {
    id: 3,
    title: "iPhone 16",
    date: "March 10, 2025",
    image: iphone16,
    more_img: [iphone16],
    number: 0,
    description: "Small Size, Intelligent Smartphone.",
    price: "700"
  },
  {
    id: 4,
    title: "Samsung S25 Ultra",
    date: "March 3, 2025",
    image: s25ul,
    more_img: [s25ul],
    number: 0,
    description: "Camera at its peak",
    price: "900"
  },
  {
    id: 5,
    title: "Samsung S25",
    date: "March 3, 2025",
    image: s25,
    more_img: [s25],
    number: 0,
    description: "Camera at its peak in small hands",
    price: "700"
  },
  {
    id: 6,
    title: "Samsung S24",
    date: "March 1, 2024",
    image: s24,
    more_img: [s24],
    number: 0,
    description: "Camera at its peak in small hands",
    price: "600"
  },
  {
    id: 7,
    title: "Samsung S24 Ultra",
    date: "March 1, 2024",
    image: s24ul,
    more_img: [s24ul],
    number: 0,
    description: "Beyond the limits",
    price: "800"
  },
  {
    id: 8,
    title: "ASUS TUF F15",
    date: "March 1, 2024",
    more_img: [tuf1],
    image: tuf1,
    number: 1,
    description: "Enjoy Gaming beyond reality, comes with DS5 conotroller",
    price: "490"
  },
];

export default gadgets;