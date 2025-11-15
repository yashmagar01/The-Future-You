/**
 * Analytics Utility Module
 * 
 * Lightweight analytics event tracking system with no vendor lock-in.
 * Currently logs to console but can be easily swapped for any analytics provider
 * (Google Analytics, Mixpanel, Amplitude, PostHog, etc.)
 * 
 * @example
 * ```typescript
 * import { logEvent } from '@/utils/analytics';
 * 
 * // Log a simple event
 * logEvent('button_click');
 * 
 * // Log an event with custom properties
 * logEvent('video_played', {
 *   video_title: 'Tutorial Video',
 *   duration: 120,
 *   source: 'homepage'
 * });
 * ```
 */

export interface AnalyticsEvent {
  /** Event name (use snake_case convention) */
  name: string;
  /** Event properties/payload */
  properties?: Record<string, string | number | boolean | null | undefined>;
  /** Timestamp when event occurred */
  timestamp: string;
  /** User session info (can be added later) */
  sessionId?: string;
}

/**
 * Log an analytics event
 * 
 * @param eventName - Name of the event (e.g., 'hero_cta_click', 'video_played')
 * @param properties - Additional event properties/payload
 * 
 * @example
 * ```typescript
 * logEvent('hero_cta_click', {
 *   variant: 'A',
 *   location: 'hero',
 *   cta_text: 'Start Recording — Free'
 * });
 * ```
 */
export const logEvent = (eventName: string, properties?: Record<string, string | number | boolean | null | undefined>): void => {
  const event: AnalyticsEvent = {
    name: eventName,
    properties: properties || {},
    timestamp: new Date().toISOString(),
  };

  // Current implementation: Console logging for development
  // This can be easily swapped for any analytics provider
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event.name, event.properties);
  }

  // TODO: Replace with your analytics provider
  // Example integrations:
  
  // Google Analytics 4
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', eventName, properties);
  // }
  
  // Mixpanel
  // if (typeof window !== 'undefined' && window.mixpanel) {
  //   window.mixpanel.track(eventName, properties);
  // }
  
  // Amplitude
  // if (typeof window !== 'undefined' && window.amplitude) {
  //   window.amplitude.track(eventName, properties);
  // }
  
  // PostHog
  // if (typeof window !== 'undefined' && window.posthog) {
  //   window.posthog.capture(eventName, properties);
  // }
  
  // Vercel Analytics (already installed)
  // import { track } from '@vercel/analytics';
  // track(eventName, properties);
  
  // Custom API endpoint
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event)
  // });
};

/**
 * Log a page view event
 * 
 * @param pageName - Name of the page
 * @param properties - Additional page properties
 * 
 * @example
 * ```typescript
 * logPageView('/home', { referrer: document.referrer });
 * ```
 */
export const logPageView = (pageName: string, properties?: Record<string, string | number | boolean | null | undefined>): void => {
  logEvent('page_view', {
    page: pageName,
    ...properties,
  });
};

/**
 * Log a user interaction event
 * 
 * @param elementType - Type of element (button, link, card, etc.)
 * @param elementName - Name/identifier of the element
 * @param properties - Additional interaction properties
 * 
 * @example
 * ```typescript
 * logInteraction('button', 'primary_cta', { location: 'hero' });
 * ```
 */
export const logInteraction = (
  elementType: string,
  elementName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void => {
  logEvent('interaction', {
    element_type: elementType,
    element_name: elementName,
    ...properties,
  });
};

/**
 * Standard event names for consistency across the app
 * Use these constants to avoid typos and maintain consistency
 */
export const ANALYTICS_EVENTS = {
  // Homepage events
  HERO_CTA_CLICK: 'hero_cta_click',
  VIDEO_PLAYED: 'video_played',
  FEATURE_CARD_CLICK: 'feature_card_click',
  ROADMAP_MILESTONE_OPEN: 'roadmap_milestone_open',
  FOOTER_CTA_CLICK: 'footer_cta_click',
  
  // Navigation events
  NAV_LINK_CLICK: 'nav_link_click',
  FOOTER_LINK_CLICK: 'footer_link_click',
  
  // Recording events
  RECORDING_STARTED: 'recording_started',
  RECORDING_STOPPED: 'recording_stopped',
  VIDEO_UPLOADED: 'video_uploaded',
  
  // Auth events
  SIGNUP_INITIATED: 'signup_initiated',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_INITIATED: 'login_initiated',
  LOGIN_COMPLETED: 'login_completed',
  
  // Dashboard events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  VIDEO_VIEWED: 'video_viewed',
  FEEDBACK_VIEWED: 'feedback_viewed',
} as const;

/**
 * Type for analytics event names
 */
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
