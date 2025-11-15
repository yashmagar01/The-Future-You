/**
 * Homepage E2E Tests
 * 
 * Tests cover:
 * 1. Hero section and CTAs load correctly
 * 2. Video embed play button triggers iframe insertion
 * 3. Upload area accepts files and shows progress
 * 4. Tech card expansion shows additional details
 */

describe('Homepage', () => {
  beforeEach(() => {
    // Visit homepage before each test
    cy.visit('/')
  })

  /**
   * Test 1: Hero Section and CTAs
   * Verifies that the hero section loads with heading, description, and CTA buttons
   */
  describe('Hero Section and CTAs', () => {
    it('should load hero section with heading and CTAs', () => {
      // Check hero heading is visible
      cy.contains('h1', 'Build Confidence Through')
        .should('be.visible')
        .and('contain', 'Daily Reflections')

      // Check hero description
      cy.contains('Transform your communication skills with AI-powered video feedback')
        .should('be.visible')

      // Check primary CTA button exists and is clickable
      cy.contains('button', /Start Recording|Get Started Free/)
        .should('be.visible')
        .and('have.attr', 'data-cta-variant')
        .and('match', /A|B/)

      // Check secondary CTA button
      cy.contains('button', 'View Dashboard')
        .should('be.visible')

      // Verify CTAs have proper touch targets (min 44px height)
      cy.contains('button', /Start Recording|Get Started Free/)
        .should('have.css', 'min-height')
        .and('match', /44px|48px|56px/)

      // Check trust indicator text
      cy.contains('No credit card required')
        .should('be.visible')
    })

    it('should have accessible hero CTAs with ARIA labels', () => {
      // Check primary CTA has aria-label
      cy.contains('button', /Start Recording|Get Started Free/)
        .should('have.attr', 'aria-label')
        .and('not.be.empty')

      // Check secondary CTA has aria-label
      cy.contains('button', 'View Dashboard')
        .should('have.attr', 'aria-label')
        .and('contain', 'dashboard')
    })

    it('should track analytics events on CTA clicks', () => {
      // Spy on console.log to verify analytics events
      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog')
      })

      // Click primary CTA
      cy.contains('button', /Start Recording|Get Started Free/)
        .click()

      // Verify analytics event was logged
      cy.get('@consoleLog').should('be.calledWith', 
        Cypress.sinon.match('📊 Analytics Event:'),
        'hero_cta_click'
      )
    })
  })

  /**
   * Test 2: Video Embed Play Button
   * Verifies that clicking play on the NotebookLM video embed triggers iframe insertion
   */
  describe('Video Embed - NotebookLM', () => {
    it('should display video embed with poster and play button', () => {
      // Scroll to video section
      cy.contains('h2', 'See How It Works')
        .scrollIntoView()
        .should('be.visible')

      // Check video embed container exists
      cy.get('[role="button"][aria-label*="Play video"]')
        .should('be.visible')
        .and('have.attr', 'tabindex', '0')

      // Verify play button is visible
      cy.get('[role="button"][aria-label*="Play video"]')
        .find('svg')
        .should('exist')

      // Check that iframe does NOT exist yet (lazy loading)
      cy.get('iframe[title*="NotebookLM"]')
        .should('not.exist')
    })

    it('should insert iframe when play button is clicked', () => {
      // Scroll to video section
      cy.contains('h2', 'See How It Works')
        .scrollIntoView()

      // Click play button
      cy.get('[role="button"][aria-label*="Play video"]')
        .click()

      // Wait for iframe to be inserted
      cy.get('iframe', { timeout: 3000 })
        .should('exist')
        .and('have.attr', 'src')
        .and('include', 'youtube')

      // Verify play button overlay is gone
      cy.get('[role="button"][aria-label*="Play video"]')
        .should('not.exist')

      // Verify iframe has proper attributes
      cy.get('iframe')
        .should('have.attr', 'allowfullscreen')
        .and('have.attr', 'loading', 'lazy')
    })

    it('should support keyboard navigation (Enter key)', () => {
      // Scroll to video section
      cy.contains('h2', 'See How It Works')
        .scrollIntoView()

      // Focus on play button
      cy.get('[role="button"][aria-label*="Play video"]')
        .focus()
        .should('have.focus')

      // Press Enter key
      cy.get('[role="button"][aria-label*="Play video"]')
        .type('{enter}')

      // Verify iframe was inserted
      cy.get('iframe', { timeout: 3000 })
        .should('exist')
    })

    it('should track video_played analytics event', () => {
      // Spy on console.log
      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog')
      })

      // Scroll to video and click play
      cy.contains('h2', 'See How It Works')
        .scrollIntoView()

      cy.get('[role="button"][aria-label*="Play video"]')
        .click()

      // Verify analytics event
      cy.get('@consoleLog').should('be.calledWith',
        Cypress.sinon.match('📊 Analytics Event:'),
        'video_played'
      )
    })
  })

  /**
   * Test 3: Upload Area and File Input
   * Tests the video upload functionality on the Record page
   */
  describe('Upload Area - Record Page', () => {
    beforeEach(() => {
      // Navigate to Record page
      cy.visit('/record')
    })

    it('should display upload button and accept file input', () => {
      // Check for upload button
      cy.contains('button', 'Upload Video')
        .should('be.visible')
        .and('not.be.disabled')

      // Verify file input exists and has correct attributes
      cy.get('input[type="file"]')
        .should('exist')
        .and('have.attr', 'accept', 'video/*')
        .and('have.attr', 'capture', 'user')

      // Check for Record button as alternative
      cy.contains('button', /Start Recording|Stop Recording/)
        .should('be.visible')
    })

    it('should accept a test video file and show upload progress', () => {
      // Create a mock video file
      const fileName = 'test-video.mp4'
      
      // Intercept the file upload to avoid actual upload
      cy.intercept('POST', '**/storage/v1/object/**', {
        statusCode: 200,
        body: { path: '/test-path/test-video.mp4' }
      }).as('uploadFile')

      // Select file via file input
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('fake video content'),
        fileName: fileName,
        mimeType: 'video/mp4',
        lastModified: Date.now(),
      }, { force: true })

      // Verify upload progress UI appears
      cy.contains('Uploading your video', { timeout: 2000 })
        .should('be.visible')

      // Check for progress bar
      cy.get('[role="progressbar"], .animate-spin')
        .should('exist')
    })

    it('should have large tappable upload area for mobile', () => {
      // Check upload button has adequate touch target
      cy.contains('button', 'Upload Video')
        .should('have.css', 'min-height')
        .and('match', /44px|48px|56px/)

      // Check touch-manipulation class
      cy.contains('button', 'Upload Video')
        .should('have.class', 'touch-manipulation')
    })

    it('should show validation error for non-video files', () => {
      // Try to upload a non-video file
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('fake text content'),
        fileName: 'test.txt',
        mimeType: 'text/plain',
      }, { force: true })

      // Should show error message
      cy.contains(/invalid file|please upload a video/i, { timeout: 2000 })
        .should('be.visible')
    })
  })

  /**
   * Test 4: Tech Card Expansion
   * Tests the expandable tech stack cards with accordion functionality
   */
  describe('Tech Stack Cards - Expandable Details', () => {
    it('should display tech stack cards', () => {
      // Scroll to tech stack section
      cy.contains('h2', 'Technology Stack')
        .scrollIntoView({ offset: { top: -100 } })
        .should('be.visible')

      // Check that tech cards are visible
      cy.contains('Whisper')
        .should('be.visible')

      cy.contains('Hume AI')
        .should('be.visible')

      cy.contains('MediaPipe')
        .should('be.visible')

      cy.contains('LLM')
        .should('be.visible')
    })

    it('should expand tech card to show implementation details', () => {
      // Scroll to tech stack section
      cy.contains('h2', 'Technology Stack')
        .scrollIntoView({ offset: { top: -100 } })

      // Find first expandable tech card (Whisper)
      cy.contains('Whisper')
        .parents('[role="button"], button')
        .first()
        .as('whisperCard')

      // Verify card is collapsed initially
      cy.get('@whisperCard')
        .parent()
        .find('[data-state="closed"]')
        .should('exist')

      // Click to expand
      cy.get('@whisperCard')
        .click()

      // Wait for expansion animation
      cy.wait(300)

      // Verify content is now visible
      cy.contains(/OpenAI.*Whisper|speech-to-text|transcription/i, { timeout: 2000 })
        .should('be.visible')

      // Check for implementation details
      cy.contains(/API|implementation|cost|documentation/i)
        .should('be.visible')
    })

    it('should collapse tech card when clicked again', () => {
      // Scroll to tech stack
      cy.contains('h2', 'Technology Stack')
        .scrollIntoView({ offset: { top: -100 } })

      // Find and expand Hume AI card
      cy.contains('Hume AI')
        .parents('[role="button"], button')
        .first()
        .as('humeCard')

      // Expand
      cy.get('@humeCard').click()
      cy.wait(300)

      // Verify expanded
      cy.contains(/emotion|voice|facial/i, { timeout: 2000 })
        .should('be.visible')

      // Collapse
      cy.get('@humeCard').click()
      cy.wait(300)

      // Verify collapsed (content should not be visible or have height 0)
      cy.get('@humeCard')
        .parent()
        .find('[data-state="closed"]')
        .should('exist')
    })

    it('should support keyboard navigation for tech cards', () => {
      // Scroll to tech stack
      cy.contains('h2', 'Technology Stack')
        .scrollIntoView({ offset: { top: -100 } })

      // Tab to first tech card
      cy.contains('Whisper')
        .parents('[role="button"], button')
        .first()
        .focus()
        .should('have.focus')

      // Press Enter to expand
      cy.focused()
        .type('{enter}')

      cy.wait(300)

      // Verify content is visible
      cy.contains(/OpenAI.*Whisper|speech-to-text/i)
        .should('be.visible')
    })

    it('should only allow one card expanded at a time (accordion behavior)', () => {
      // Scroll to tech stack
      cy.contains('h2', 'Technology Stack')
        .scrollIntoView({ offset: { top: -100 } })

      // Expand first card (Whisper)
      cy.contains('Whisper')
        .parents('[role="button"], button')
        .first()
        .click()

      cy.wait(300)

      // Verify Whisper content is visible
      cy.contains(/OpenAI.*Whisper|speech-to-text/i)
        .should('be.visible')

      // Expand second card (Hume AI)
      cy.contains('Hume AI')
        .parents('[role="button"], button')
        .first()
        .click()

      cy.wait(300)

      // Verify Hume content is visible
      cy.contains(/emotion|voice|facial/i)
        .should('be.visible')

      // Verify Whisper content is no longer visible (collapsed)
      cy.contains(/OpenAI.*Whisper|speech-to-text/i)
        .should('not.be.visible')
    })
  })

  /**
   * Bonus Test: Responsive Behavior
   * Verifies mobile breakpoints work correctly
   */
  describe('Responsive Design', () => {
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 412, height: 915, name: 'Android' },
      { width: 768, height: 1024, name: 'iPad' },
    ]

    viewports.forEach(viewport => {
      it(`should not have horizontal scroll at ${viewport.name} (${viewport.width}px)`, () => {
        // Set viewport
        cy.viewport(viewport.width, viewport.height)

        // Visit homepage
        cy.visit('/')

        // Check no horizontal scroll
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth).to.equal(viewport.width)
        })

        // Scroll to bottom to check all sections
        cy.scrollTo('bottom', { duration: 1000 })

        // Check again
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth).to.equal(viewport.width)
        })
      })
    })

    it('should display mobile-friendly CTAs with adequate touch targets', () => {
      // Set mobile viewport
      cy.viewport(375, 667)

      // Check hero CTAs
      cy.contains('button', /Start Recording|Get Started Free/)
        .should('be.visible')
        .invoke('outerHeight')
        .should('be.gte', 44) // Minimum 44px touch target

      // Check buttons are full width on mobile
      cy.contains('button', /Start Recording|Get Started Free/)
        .parent()
        .should('have.class', 'flex-col')
    })
  })
})
