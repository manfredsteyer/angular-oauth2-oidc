import { SamplePage } from './app.po';

describe('sample App', () => {
  let page: SamplePage;

  beforeEach(() => {
    page = new SamplePage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
