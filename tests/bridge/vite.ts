import { screen } from '@testing-library/dom';
import { DriverElement, TestDriver } from './driver';
// Possibly your library's ability to goTo a route

export const viteTestDriver: TestDriver = {
  async goTo(url: string) {
    // In a mocked environment, "url" might just be a route or a function that re-renders the app
  },
  async findByText(text: string) {
    return screen.findByText(text) as unknown as DriverElement;
  },
  async click(el: DriverElement) {
    // Convert the returned element to a real DOM element and do .click()
    // e.g. (el as HTMLElement).click();
  },
};
