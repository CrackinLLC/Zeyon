import { screen } from '@testing-library/dom';
import { DriverElement, TestDriver } from './driver';

export const viteTestDriver: TestDriver = {
  async goTo(url: string) {
    // Possibly re-render or do nothing for a mock environment
  },

  async findByText(text: string) {
    const found = await screen.findByText(text);
    return found as unknown as DriverElement;
  },

  async click(el: DriverElement) {
    (el as HTMLElement).click();
  },
};
