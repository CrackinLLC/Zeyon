/// <reference types="cypress" />

import { DriverElement, TestDriver } from './driver';

export const cypressDriver: TestDriver = {
  async goTo(url: string) {
    cy.visit(url);
  },

  async findByText(text: string) {
    return cy.contains(text) as unknown as DriverElement;
  },

  async click(el: DriverElement) {
    (el as unknown as Cypress.Chainable).click();
  },
};
