export interface TestDriver {
  goTo(url: string): Promise<void>;
  findByText(text: string): Promise<DriverElement>;
  click(el: DriverElement): Promise<void>;
  // Add additional driver methods...
}

export interface DriverElement {
  // placeholder for element handling
}

export const getPrivate = (c: unknown, key: string) => (c as any)[key];

export const milliseconds = (ms: number) => new Promise((r) => setTimeout(r, ms));
