import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BlocklyPanel from '@/components/BlocklyPanel';

describe('BlocklyPanel default state', () => {
  it('shows block programming coming soon content', () => {
    const html = renderToStaticMarkup(<BlocklyPanel />);

    expect(html).toContain('🧩 Block Programming');
    expect(html).toContain('Coming Soon');
    expect(html).toContain('Visual command builder powered by Blockly. Planned for a future release.');
  });
});
