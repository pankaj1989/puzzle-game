export const BRAND = {
  name: "Puzzle Game",
  subtitle: "Premium Puzzles",
};

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-to-play", label: "How to Play" },
  { href: "#pricing", label: "Pricing" },
];

export const HEADER_CTA = { href: "#pricing", label: "Start Playing" };

export const HERO = {
  titleLines: ["Crack the", "license plate"],
  titleAccent: "mystery",
  descPart1:
    "A sophisticated word puzzle game where you decode vanity license plates.",
  descPart2: "Letters reveal every 3 seconds.",
  descPart3: "Can you solve it before time runs out?",
  primaryCta: { href: "#pricing", label: "Try for Free" },
};

export const HERO_HIGHLIGHTS = [
  { value: "500", label: "Unique Puzzles", valueSuffix: "+" },
  { value: "8", label: "Categories" },
  { value: "100K", label: "Active Players", valueSuffix: "+" },
];

export const HERO_IMAGE = {
  src: "/landing/hero-img.png",
  width: 760,
  height: 540,
};

export const COMMUNITY_STATS_HEADING =
  "Trusted by puzzle enthusiasts worldwide";

export const COMMUNITY_STATS = [
  { value: "1M", label: "Puzzles Solved", valueSuffix: "+" },
  { value: "50K", label: "Daily Players", valueSuffix: "+" },
  { value: "4.9", label: "App Store Rating", valueSuffix: "★" },
  {
    value: "95",
    valueSuffix: "%",
    label: "Satisfaction Rate",
  },
];

export const SECTION_TITLES = {
  features: "Everything you need to master the game",
  howItWorks: "Simple to learn, challenging to master",
};

export const FEATURES_SECTION = {
  badge: "Features",
  subheading:
    "A complete puzzle experience designed for modern word game enthusiasts",
};

export const HOW_SECTION = {
  badge: "How it works",
  subheading: "Follow these steps to start solving license plate puzzles",
};

export const FEATURES = [
  {
    title: "Dynamic Letter Reveals",
    body: "Watch as letters appear every 3 seconds. Use quick thinking and pattern recognition to solve puzzles faster.",
    bg: "bg-card-yellow",
    imageSrc: "/landing/feature1.png",
  },
  {
    title: "Eight Categories",
    body: "From blockbuster movies to chart-topping music, sports legends to tech innovations. Premium unlocks them all.",
    bg: "bg-card-lavender",
    imageSrc: "/landing/feature2.png",
  },
  {
    title: "Premium Experience",
    body: "Enjoy ad-free gameplay, choose any category, access exclusive puzzles, and compete on leaderboards.",
    bg: "bg-white",
    cardClassName: "border border-navy/[0.06]",
    imageSrc: "/landing/feature3.png",
  },
];

export const HOW_STEPS = [
  {
    num: "01",
    titleLines: ["Choose Category"],
    body: "Select from 8 categories or let us pick randomly for free users.",
    bg: "bg-card-yellow",
  },
  {
    num: "02",
    titleLines: ["Watch Letters", "Reveal"],
    body: "Letters appear every 3 seconds. Use the visual clue to help you decode.",
    bg: "bg-card-yellow",
  },
  {
    num: "03",
    titleLines: ["Solve the Puzzle"],
    body: "Type your answer before the timer runs out. Think fast, think smart.",
    bg: "bg-card-lavender",
  },
  {
    num: "04",
    titleLines: ["Earn Points"],
    body: "Faster solves mean more points. Compete on leaderboards.",
    bg: "bg-card-blue",
  },
];

export const PRICING = {
  title: "Choose your plan",
  badge: "Pricing",
  subheading: "Start free, upgrade anytime to unlock the full experience",
  free: {
    tier: "Free",
    price: 0,
    periodLabel: "forever",
    description: "Perfect for casual players who want to try the game",
    cta: { href: "#hero", label: "Start Playing Free" },
    features: [
      "Random category selection",
      "Limited puzzle access",
      "Ad-supported gameplay",
      "Basic timer challenges",
    ],
  },
  premium: {
    tier: "Premium",
    badge: "Popular",
    price: 9,
    period: "month",
    description: "For dedicated puzzlers who want the ultimate experience",
    cta: { href: "#hero", label: "Upgrade to Premium" },
    features: [
      "Choose any category",
      "500+ exclusive puzzles",
      "Ad-free experience",
      "Advanced leaderboards",
      "Priority support",
      "Early access to new categories",
    ],
  },
};

export const CTA = {
  heading: "Ready to play?",
  subheading:
    "Join thousands of players solving puzzles every day. Start free, no credit card required.",
  cta: { href: "#pricing", label: "Start Playing Free" },
  backgroundImageSrc: "/landing/cta-bg.png",
};

export const FOOTER = {
  description:
    "Challenge your mind with handcrafted puzzles designed for curious thinkers. Every category, every level — unlocked for you.",
  watermark: "Bumper Stumpers",
  newsletter: {
    title: "Stay in the loop",
    placeholder: "your@email.com",
    buttonLabel: "Subscribe",
  },
  columns: [
    {
      title: "Play",
      links: [
        { href: "#features", label: "All Categories" },
        { href: "#hero", label: "Daily Puzzle" },
        { href: "#hero", label: "Leaderboard" },
        { href: "#hero", label: "My Progress" },
        { href: "#pricing", label: "Premium Access" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "#features", label: "Features" },
        { href: "#how-to-play", label: "How to Play" },
        { href: "#pricing", label: "Pricing" },
        { href: "#hero", label: "About Us" },
        { href: "#hero", label: "Blog" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "#hero", label: "Help Center" },
        { href: "#hero", label: "Contact Us" },
        { href: "#hero", label: "Privacy Policy" },
        { href: "#hero", label: "Terms of Use" },
        { href: "#hero", label: "Cookie Settings" },
      ],
    },
  ],
  social: [],
};
