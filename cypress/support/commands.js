// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Custom command to check if element is visible in viewport
 */
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const rect = subject[0].getBoundingClientRect();
  
  expect(rect.top).to.be.lessThan(window.innerHeight);
  expect(rect.bottom).to.be.greaterThan(0);
  expect(rect.left).to.be.lessThan(window.innerWidth);
  expect(rect.right).to.be.greaterThan(0);
  
  return subject;
});

/**
 * Custom command to wait for element to be stable (no animations)
 */
Cypress.Commands.add('waitForStable', { prevSubject: true }, (subject, timeout = 1000) => {
  return cy.wrap(subject).should('not.have.css', 'transform', 'none', { timeout });
});
