export interface BlueprintSection {
  id: string;
  title: string;
  variations: {
    professional: string;
    bold: string;
    friendly: string;
    minimal: string;
  };
}

export interface IndustryBlueprint {
  id: string;
  name: string;
  sections: BlueprintSection[];
}

export const blueprints: IndustryBlueprint[] = [
  {
    id: "web-development",
    name: "Web Development",
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        variations: {
          professional: "This proposal outlines a comprehensive strategy for {clientName} to establish a high-performance digital presence. Our approach focuses on technical excellence, user experience, and measurable business outcomes. We aim to deliver a solution that not only meets your current requirements but scales with your future growth.",
          bold: "We aren't just building a website for {clientName}; we're building a growth engine. In today's market, your digital presence is your strongest competitive advantage. Our mission is to transform your current platform into a state-of-the-art lead generation and conversion machine.",
          friendly: "We're so excited to partner with the team at {clientName}! Our goal is to create a digital home for your brand that feels as welcoming and innovative as you are. We've thought through every detail to make sure your new website is something both you and your customers will truly love.",
          minimal: "Project: Modern web solution for {clientName}. Focus: Performance, reliability, and clean aesthetics. Objective: Establish a professional digital foundation that supports primary business goals."
        }
      },
      {
        id: "problem-statement",
        title: "The Challenge",
        variations: {
          professional: "Through our discovery process, we've identified that {clientName} currently faces challenges with digital engagement and technical fragmentation. The existing infrastructure does not fully reflect the caliber of your brand, leading to missed opportunities in conversion and user retention within the {industry} space.",
          bold: "Let's be honest: {clientName}'s current digital presence is leaking revenue. In a world where first impressions are formed in milliseconds, your current platform is falling short of the modern standard expected in {industry}. You deserve a solution that matches your ambition.",
          friendly: "It sounds like {clientName} is ready for a fresh start! We understand the frustrations you've had with your current setup—it can be tough to grow when your technology is holding you back. We're here to clear those hurdles and make things simple again.",
          minimal: "Current Constraints: Technical debt, low conversion rates, and inconsistent branding. Analysis: The existing system is outdated and limits {clientName}'s ability to scale effectively."
        }
      },
      {
        id: "proposed-solution",
        title: "The Solution",
        variations: {
          professional: "Our proposed solution involves a full-stack architectural overhaul tailored to {clientName}'s specific needs. We will deploy a modern, responsive framework optimized for SEO and performance, ensuring that every user interaction is seamless and professional.",
          bold: "We're deploying a cutting-edge technical stack designed for speed and dominance. By leveraging the latest in cloud architecture and headless CMS technology, we will provide {clientName} with a platform that loads faster than the competition and converts better than ever.",
          friendly: "We've put together a plan to build you something truly special. We'll use the latest tools to make sure your site is fast, easy for you to manage, and a joy for your customers to browse. It’s all about making your digital life easier and your business more successful.",
          minimal: "Proposed: Custom full-stack development. Stack: Next.js, Tailwind CSS, and a robust Backend-as-a-Service model. Result: High-performance, SEO-optimized digital property."
        }
      }
    ]
  },
  {
    id: "branding",
    name: "Brand Identity",
    sections: [
      {
        id: "executive-summary",
        title: "Strategic Overview",
        variations: {
          professional: "This engagement focuses on developing a cohesive visual and strategic identity for {clientName}. Our process ensures that your brand values are translated into a compelling visual language that resonates with your target demographic and establishes long-term market authority.",
          bold: "Identity is everything. We are here to give {clientName} the visual punch it needs to disrupt the {industry} market. This isn't just about a logo; it's about creating an iconic brand that people recognize, trust, and remember.",
          friendly: "We can't wait to help {clientName} tell its story! Every great brand has a heart, and our job is to make sure yours shines through in everything you do. Let's create something beautiful together that truly represents who you are.",
          minimal: "Objective: Comprehensive brand identity development for {clientName}. Focus: Visual cohesion, strategic positioning, and scalable assets."
        }
      }
    ]
  }
];

export function getBlueprintById(id: string): IndustryBlueprint | undefined {
  return blueprints.find(b => b.id === id);
}

export function getBlueprintByIndustry(industry: string): IndustryBlueprint | undefined {
  // Try to find the closest match
  const normalized = industry.toLowerCase();
  if (normalized.includes("web") || normalized.includes("development") || normalized.includes("software")) {
    return blueprints.find(b => b.id === "web-development");
  }
  if (normalized.includes("brand") || normalized.includes("design") || normalized.includes("logo")) {
    return blueprints.find(b => b.id === "branding");
  }
  return blueprints[0]; // Default to first for now
}
