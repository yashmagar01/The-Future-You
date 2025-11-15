/**
 * Product Roadmap Timeline Data
 * Easy to update and maintain all milestone information in one place
 */

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'scheduled' | 'future';
  color: {
    bg: string;
    text: string;
    border: string;
    indicator: string;
  };
  features: string[];
  description: string;
  accessButton?: {
    admin: string;
    user: string;
  };
}

export const timelineData: Milestone[] = [
  {
    id: 'mvp',
    title: 'MVP Launched',
    date: '19 April 2025',
    status: 'completed',
    color: {
      bg: 'bg-green-500/10',
      text: 'text-green-600',
      border: 'border-green-500/20',
      indicator: 'bg-green-500'
    },
    description: 'Core features for daily video reflection practice and AI-powered feedback',
    features: [
      'Daily uploads',
      'Private AI analysis',
      'Speech clarity',
      'Tone snapshot',
      'Posture analysis',
      'Dashboard',
      'Personalized tips'
    ]
  },
  {
    id: 'nvp',
    title: 'NVP Launch',
    date: '20 July 2025',
    status: 'scheduled',
    color: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-600',
      border: 'border-orange-500/20',
      indicator: 'bg-orange-500'
    },
    description: 'Next Version Product with social features and gamification',
    features: [
      'Live roleplay sessions',
      'Gamification & badges'
    ],
    accessButton: {
      admin: 'Get Early Access',
      user: 'Join Waitlist'
    }
  },
  {
    id: 'dream',
    title: 'Dream Version',
    date: '2026+',
    status: 'future',
    color: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/20',
      indicator: 'bg-blue-500'
    },
    description: 'Revolutionary features with AI avatars and immersive experiences',
    features: [
      'Avatar mentor',
      'Fully intelligent conversation engine',
      'VR practice hall'
    ]
  }
];
