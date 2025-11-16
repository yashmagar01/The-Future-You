/**
 * Product Roadmap Timeline Data
 * Easy to update and maintain all milestone information in one place
 */

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'scheduled' | 'future';
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
    title: 'MVP Launch',
    date: '19 April 2025',
    status: 'scheduled',
    color: {
      bg: 'bg-green-500/10',
      text: 'text-green-600',
      border: 'border-green-500/20',
      indicator: 'bg-green-500'
    },
    description: 'Core video analysis, scoring, posture detection, and dashboard',
    features: [
      'Daily video uploads',
      'Private AI analysis',
      'Speech clarity scoring',
      'Emotional tone detection',
      'Posture & gesture analysis',
      'Progress dashboard',
      'Personalized improvement tips'
    ]
  },
  {
    id: 'nvp',
    title: 'NVP Release',
    date: '20 July 2025',
    status: 'future',
    color: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/20',
      indicator: 'bg-blue-500'
    },
    description: 'Live roleplay sessions, gamification, enhanced emotional intelligence',
    features: [
      'Live roleplay with AI mentors',
      'Gamification & achievement badges',
      'Enhanced emotional intelligence tracking'
    ],
    accessButton: {
      admin: 'Get Early Access',
      user: 'Join Waitlist'
    }
  },
  {
    id: 'dream',
    title: 'Dream Project',
    date: 'End of 2026',
    status: 'future',
    color: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
      border: 'border-purple-500/20',
      indicator: 'bg-purple-500'
    },
    description: 'AI avatar mentor, long-term emotional intelligence tracking, and VR practice environments',
    features: [
      'AI avatar mentor',
      'Long-term emotional intelligence tracking',
      'VR practice hall environments'
    ]
  },
  {
    id: 'enterprise',
    title: 'Enterprise Version',
    date: '2030',
    status: 'future',
    color: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-600',
      border: 'border-orange-500/20',
      indicator: 'bg-orange-500'
    },
    description: 'Team analytics, organization-level insights, and enterprise coaching suite',
    features: [
      'Team analytics dashboard',
      'Organization-level insights',
      'Enterprise coaching suite',
      'Custom branding & SSO'
    ]
  }
];
