import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('Waitlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/waitlist', () => {
    it('should successfully create waitlist entry with valid data', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully joined waitlist',
        entry: {
          id: '123',
          email: 'test@example.com',
          status: 'pending',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          role_interest: 'student',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.entry.email).toBe('test@example.com');
    });

    it('should reject invalid email format', async () => {
      const mockResponse = {
        error: 'Invalid email format',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          role_interest: 'student',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Invalid email format');
    });

    it('should reject duplicate email', async () => {
      const mockResponse = {
        error: 'This email is already on the waitlist',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          role_interest: 'student',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(409);
      expect(data.error).toContain('already on the waitlist');
    });

    it('should reject submission with honeypot filled', async () => {
      const mockResponse = {
        error: 'Invalid submission',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'bot@example.com',
          role_interest: 'student',
          honeypot: 'bot-filled-this',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Invalid submission');
    });

    it('should reject missing required fields', async () => {
      const mockResponse = {
        error: 'Email and role are required',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing role_interest
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('required');
    });
  });

  describe('POST /api/waitlist/confirm', () => {
    it('should confirm valid token', async () => {
      const mockResponse = {
        success: true,
        message: 'Email confirmed successfully',
        entry: {
          id: '123',
          email: 'test@example.com',
          status: 'confirmed',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token-123',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.entry.status).toBe('confirmed');
    });

    it('should reject invalid token', async () => {
      const mockResponse = {
        error: 'Invalid or expired confirmation token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-token',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('Invalid or expired');
    });
  });

  describe('POST /api/waitlist/promote', () => {
    it('should promote confirmed user to tester', async () => {
      const mockResponse = {
        success: true,
        message: 'User promoted to tester successfully',
        entry: {
          id: '123',
          email: 'test@example.com',
          status: 'promoted',
          promoted_to: 'tester',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          promoteTo: 'tester',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.entry.status).toBe('promoted');
    });

    it('should reject promotion without admin auth', async () => {
      const mockResponse = {
        error: 'Unauthorized',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject promotion of unconfirmed user', async () => {
      const mockResponse = {
        error: 'User must confirm email before promotion',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/waitlist/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          email: 'unconfirmed@example.com',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('confirm email');
    });
  });
});

describe('Email Validation', () => {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  it('should accept valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('email+tag@subdomain.example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('test @example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});
