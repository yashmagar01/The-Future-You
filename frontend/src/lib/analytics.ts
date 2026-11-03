// Analytics Event Tracking
// Client-side event logging to events_analytics table

import { supabase } from './api';

// Event Types Schema
export enum AnalyticsEvent {
    // Onboarding Events
    ONBOARD_STARTED = 'onboard_started',
    ONBOARD_STEP_COMPLETED = 'onboard_step_completed',
    ONBOARD_COMPLETED = 'onboard_completed',
    ONBOARD_ABANDONED = 'onboard_abandoned',

    // Prompt Events
    PROMPT_VIEWED = 'prompt_viewed',
    PROMPT_GENERATED = 'prompt_generated',
    PROMPT_REFRESHED = 'prompt_refreshed',

    // Recording Events
    RECORD_STARTED = 'record_started',
    RECORD_PAUSED = 'record_paused',
    RECORD_RESUMED = 'record_resumed',
    RECORD_COMPLETED = 'record_completed',
    RECORD_DISCARDED = 'record_discarded',

    // Upload Events
    UPLOAD_STARTED = 'upload_started',
    UPLOAD_COMPLETED = 'upload_completed',
    UPLOAD_FAILED = 'upload_failed',

    // Review Events
    REVIEW_VIEWED = 'review_viewed',
    FEEDBACK_CLICKED = 'feedback_clicked',

    // Engagement Events
    PAGE_VIEW = 'page_view',
    SESSION_START = 'session_start',
    SESSION_END = 'session_end',

    // Play Mode Events
    PLAY_STARTED = 'play_started',
    PLAY_COMPLETED = 'play_completed',
    LEVEL_UNLOCKED = 'level_unlocked',
}

interface AnalyticsPayload {
    [key: string]: any;
}

class Analytics {
    private sessionId: string;
    private userId: string | null = null;

    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.initUserId();
    }

    private getOrCreateSessionId(): string {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    private async initUserId() {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;
    }

    /**
     * Track an analytics event
     */
    async track(eventType: AnalyticsEvent, payload: AnalyticsPayload = {}) {
        try {
            // Ensure we have latest user ID
            if (!this.userId) {
                const { data: { user } } = await supabase.auth.getUser();
                this.userId = user?.id || null;
            }

            // If no user, store in localStorage for later (post-signup attribution)
            if (!this.userId) {
                this.storeAnonymousEvent(eventType, payload);
                return;
            }

            // Add session metadata
            const enrichedPayload = {
                ...payload,
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                referrer: document.referrer,
            };

            // Insert into events_analytics table
            const { error } = await supabase
                .from('events_analytics')
                .insert({
                    user_id: this.userId,
                    event_type: eventType,
                    payload: enrichedPayload,
                });

            if (error) {
                console.error('Analytics tracking error:', error);
            } else {
                console.log(`[Analytics] ${eventType}`, payload);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    /**
     * Store anonymous events (before user signs up)
     */
    private storeAnonymousEvent(eventType: AnalyticsEvent, payload: AnalyticsPayload) {
        const anonymousEvents = JSON.parse(localStorage.getItem('anonymous_events') || '[]');
        anonymousEvents.push({
            event_type: eventType,
            payload: {
                ...payload,
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
            },
        });
        localStorage.setItem('anonymous_events', JSON.stringify(anonymousEvents));
    }

    /**
     * Flush anonymous events after user signs up
     */
    async flushAnonymousEvents(userId: string) {
        this.userId = userId;
        const anonymousEvents = JSON.parse(localStorage.getItem('anonymous_events') || '[]');

        if (anonymousEvents.length > 0) {
            const eventsWithUserId = anonymousEvents.map((event: any) => ({
                user_id: userId,
                event_type: event.event_type,
                payload: event.payload,
            }));

            await supabase.from('events_analytics').insert(eventsWithUserId);
            localStorage.removeItem('anonymous_events');
            console.log(`[Analytics] Flushed ${anonymousEvents.length} anonymous events`);
        }
    }

    /**
     * Helper: Track onboarding step
     */
    async trackOnboardingStep(stepNumber: number, stepName: string, data?: any) {
        await this.track(AnalyticsEvent.ONBOARD_STEP_COMPLETED, {
            step_number: stepNumber,
            step_name: stepName,
            ...data,
        });
    }

    /**
     * Helper: Track recording duration
     */
    async trackRecordingCompleted(durationSeconds: number, fileSize: number) {
        await this.track(AnalyticsEvent.RECORD_COMPLETED, {
            duration_seconds: durationSeconds,
            file_size_bytes: fileSize,
        });
    }

    /**
     * Helper: Track page view
     */
    async trackPageView(pageName: string, path: string) {
        await this.track(AnalyticsEvent.PAGE_VIEW, {
            page_name: pageName,
            path,
        });
    }

    /**
     * Helper: Track play level start
     */
    async trackPlayStarted(levelId: string, levelNumber: number) {
        await this.track(AnalyticsEvent.PLAY_STARTED, {
            level_id: levelId,
            level_number: levelNumber,
        });
    }

    /**
     * Helper: Track play level completion
     */
    async trackPlayCompleted(levelId: string, levelNumber: number, score: number, stars: number) {
        await this.track(AnalyticsEvent.PLAY_COMPLETED, {
            level_id: levelId,
            level_number: levelNumber,
            score,
            stars,
        });
    }

    /**
     * Helper: Track level unlock
     */
    async trackLevelUnlocked(levelNumber: number) {
        await this.track(AnalyticsEvent.LEVEL_UNLOCKED, {
            level_number: levelNumber,
        });
    }
}

// Export singleton instance
export const analytics = new Analytics();

// Usage examples:
/*
import { analytics, AnalyticsEvent } from '@/lib/analytics';

// In onboarding wizard
analytics.trackOnboardingStep(1, 'name', { full_name: 'John' });

// In video recorder
analytics.track(AnalyticsEvent.RECORD_STARTED);
analytics.trackRecordingCompleted(60, 5242880);

// In page component
useEffect(() => {
  analytics.trackPageView('Dashboard', '/dashboard');
}, []);

// After user signs up
analytics.flushAnonymousEvents(user.id);
*/
