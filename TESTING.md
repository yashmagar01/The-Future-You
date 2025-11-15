# Cypress E2E Testing Guide

This project uses Cypress for end-to-end (E2E) testing to ensure the homepage and key user flows work correctly.

## 📋 Prerequisites

Before running Cypress tests, make sure you have:

1. Node.js installed (v18 or higher)
2. Dependencies installed: `npm install`
3. Development server available on `http://localhost:5173`

## 🚀 Quick Start

### Install Dependencies

First time setup - install Cypress and related dependencies:

```bash
npm install
```

This will install:
- `cypress` - E2E testing framework
- `start-server-and-test` - Utility to start dev server before tests

### Running Tests

#### Option 1: Headless Mode (CI/Local)

Run all tests in headless mode (faster, no GUI):

```bash
npm run cypress:run
```

Or run with dev server automatically started:

```bash
npm run test:e2e
```

#### Option 2: Interactive Mode (Development)

Open Cypress Test Runner GUI for debugging and development:

```bash
npm run cypress:open
```

Or with auto-start dev server:

```bash
npm run test:e2e:open
```

This will:
1. Start the Vite dev server on `http://localhost:5173`
2. Wait for server to be ready
3. Open Cypress Test Runner
4. You can select and run tests interactively

## 📁 Test Structure

```
cypress/
├── integration/
│   └── homepage.spec.js        # Homepage E2E tests
├── support/
│   ├── e2e.js                  # Test setup and global hooks
│   └── commands.js             # Custom Cypress commands
└── videos/                     # Test recordings (gitignored)
```

## 🧪 Test Coverage

### Homepage Tests (`cypress/integration/homepage.spec.js`)

#### 1. Hero Section and CTAs
- ✅ Loads hero heading with "Build Confidence Through Daily Reflections"
- ✅ Displays primary CTA with AB test variant (A or B)
- ✅ Displays secondary "View Dashboard" CTA
- ✅ Verifies touch target sizes (min 44px)
- ✅ Checks ARIA labels for accessibility
- ✅ Tracks analytics events on CTA clicks

#### 2. Video Embed - NotebookLM
- ✅ Displays video poster and play button
- ✅ Iframe does NOT load initially (lazy loading)
- ✅ Clicking play button inserts iframe with YouTube embed
- ✅ Supports keyboard navigation (Enter key)
- ✅ Tracks `video_played` analytics event
- ✅ Verifies iframe has proper attributes (allowfullscreen, loading=lazy)

#### 3. Upload Area - Record Page
- ✅ Displays "Upload Video" button with file input
- ✅ File input accepts `video/*` with `capture="user"` for mobile
- ✅ Accepts test video file and shows upload progress
- ✅ Large tappable area for mobile (44px+ touch target)
- ✅ Shows validation error for non-video files

#### 4. Tech Stack Cards - Expandable Details
- ✅ Displays 4 tech stack cards (Whisper, Hume AI, MediaPipe, LLM)
- ✅ Cards expand on click to show implementation details
- ✅ Cards collapse when clicked again
- ✅ Supports keyboard navigation (Enter key)
- ✅ Accordion behavior: only one card expanded at a time

#### 5. Responsive Design (Bonus)
- ✅ No horizontal scroll at mobile breakpoints (320px, 375px, 412px, 768px)
- ✅ Mobile-friendly CTAs with adequate touch targets
- ✅ Responsive layout adjustments verified

## 🎯 Custom Commands

Located in `cypress/support/commands.js`:

### `cy.isInViewport()`
Checks if an element is visible in the current viewport.

```javascript
cy.get('.hero').isInViewport()
```

### `cy.waitForStable()`
Waits for element animations to complete.

```javascript
cy.get('.card').waitForStable()
```

## 🔧 Configuration

Cypress configuration is in `cypress.config.js`:

- **Base URL**: `http://localhost:5173`
- **Viewport**: 1280x720 (desktop default)
- **Video Recording**: Disabled (set to `false` for faster runs)
- **Screenshots**: Enabled on failure

## 📊 Test Execution Flow

1. **Start Dev Server** (if using `test:e2e`)
   ```
   vite dev server starts on port 5173
   ```

2. **Wait for Server Ready**
   ```
   start-server-and-test polls http://localhost:5173
   ```

3. **Run Cypress Tests**
   ```
   cypress run (headless) or cypress open (GUI)
   ```

4. **Cleanup**
   ```
   Dev server automatically stops after tests
   ```

## 🐛 Debugging Tests

### View Test Results

When tests fail, Cypress automatically:
- Takes screenshots (saved to `cypress/screenshots/`)
- Shows detailed error messages in console

### Interactive Debugging

Use Cypress GUI for step-by-step debugging:

```bash
npm run test:e2e:open
```

Benefits:
- See tests run in real browser
- Time-travel debugging
- Inspect DOM at each step
- View network requests
- Console logs visible

### Common Issues

**Issue**: Tests fail with "Cannot connect to localhost:5173"
- **Fix**: Ensure dev server is running: `npm run dev`

**Issue**: "Element not found" errors
- **Fix**: Add waits or increase timeouts:
  ```javascript
  cy.get('.element', { timeout: 5000 })
  ```

**Issue**: Flaky tests (pass/fail randomly)
- **Fix**: Add explicit waits or use `cy.wait()`:
  ```javascript
  cy.wait(300) // Wait for animation
  ```

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Cypress tests
        run: npm run test:e2e
```

### GitLab CI Example

```yaml
e2e-tests:
  image: cypress/browsers:latest
  script:
    - npm ci
    - npm run test:e2e
  artifacts:
    when: on_failure
    paths:
      - cypress/screenshots/
```

## 📈 Best Practices

1. **Test User Flows, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state

2. **Use Data Attributes for Stable Selectors**
   - `data-testid="feature-card"`
   - Avoid CSS classes that may change

3. **Keep Tests Independent**
   - Each test should run in isolation
   - Use `beforeEach` for setup

4. **Use Proper Waits**
   - Avoid `cy.wait(1000)` for arbitrary times
   - Use assertions: `cy.should('be.visible')`

5. **Mock External APIs**
   - Use `cy.intercept()` for API calls
   - Avoid dependencies on external services

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Reference](https://docs.cypress.io/api/table-of-contents)
- [Cypress Examples](https://github.com/cypress-io/cypress-example-recipes)

## 💡 Tips

- Run specific test file: `npx cypress run --spec "cypress/integration/homepage.spec.js"`
- Run tests in specific browser: `npx cypress run --browser chrome`
- Record video: Change `video: true` in `cypress.config.js`
- Generate test coverage: Use `@cypress/code-coverage` plugin

## 🎬 Next Steps

1. **Install Cypress**: `npm install`
2. **Run tests**: `npm run test:e2e`
3. **Explore GUI**: `npm run test:e2e:open`
4. **Add more tests**: Create new `.spec.js` files in `cypress/integration/`

Happy testing! 🚀
