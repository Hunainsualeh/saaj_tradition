import { EmailIcon, HomeIcon, PhoneIcon } from "@/components";
import { STORE_EMAIL } from "./store-information";

export const supportContactInfo = [
  {
    title: "Visit Us",
    description: "1/2 km KLP Road, near Hotel Pearl Resort, Ahmedpur East, District Bahawalpur, Pakistan 63350",
    icon: <HomeIcon />,
  },
  {
    title: "Call Us",
    description: "+923106040861",
    href: "tel:+923106040861",
    icon: <PhoneIcon />,
  },
  { 
    title: "Email Us",
    description: STORE_EMAIL,
    href: `mailto:${STORE_EMAIL}`,
    icon: <EmailIcon />,
  },
];
