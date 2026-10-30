import { projects } from "./projects.js";
import { certificates } from "./certificates.js";
import { skills } from "./skills.js";

export const profile = {
  name: "JeysiDev",
  role: "Front-End Developer",
  tagline: "I build interactive, responsive, and user-friendly digital experiences with modern technologies.",
  location: "Plaridel, Bulacan, Philippines",

  bio: [
    "I'm John Carlo Aquino, known online as JeysiDev. I'm a developer who enjoys turning ideas into functional applications and interactive, responsive web experiences.",

    "I'm passionate about exploring different technologies and turning my ideas into real projects. I enjoy developing web and mobile applications, experimenting with C# and .NET, and creating interactive experiences with Unity. I'm always learning new skills, improving my coding abilities, and challenging myself to build projects that solve problems and provide a great user experience.",
  ],

  avatar: "/profile/avatar.jpg",
  heroImage: "/profile/hero.png",

  resumeUrl: "/resume.pdf",
  resumeFileName: "John-Carlo-Aquino-Resume.pdf",
  email: "johncarloaquino205@gmail.com",

  // Counts are derived from the data files, so adding an entry to
  // projects.js, skills.js or certificates.js updates the stats automatically.
  stats: [
    { label: "Years building for the web", value: 2, suffix: "+" },
    { label: "Shipped projects", value: projects.length, suffix: "" },
    { label: "Languages & tools", value: skills.length, suffix: "" },
    { label: "Certifications earned", value: certificates.length, suffix: "" },
  ],

  socials: [
    { label: "GitHub", href: "https://github.com/Jeysixczs", icon: "github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/john-carlo-9a63b6195/", icon: "linkedin" },
    { label: "Instagram", href: "https://www.instagram.com/chogssss/", icon: "instagram" },
    { label: "Email", href: "mailto:johncarloaquino205@gmail.com", icon: "mail" },
  ],
};
