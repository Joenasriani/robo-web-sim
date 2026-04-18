import fs from 'fs';
import path from 'path';

describe('Desktop right panel layout', () => {
  it('renders requested section order in simulator desktop sidebar', () => {
    const pagePath = path.join(process.cwd(), 'src/app/simulator/page.tsx');
    const pageSource = fs.readFileSync(pagePath, 'utf8');

    const orderedMarkers = [
      '<BlocklyPanel />',
      '<CommandQueue />',
      '<SimSettings />',
      'Play, Pause, Stop',
      '<QuickActions />',
      '<TelemetryPanel />',
      '<EventLog />',
      'Movement Controls',
    ];

    const positions = orderedMarkers.map((marker) => pageSource.indexOf(marker));

    positions.forEach((position, idx) => {
      expect(position).toBeGreaterThanOrEqual(0);
      if (idx > 0) {
        expect(position).toBeGreaterThan(positions[idx - 1]);
      }
    });
  });

  it('keeps Block Programming collapsed by default', () => {
    const blocklyPath = path.join(process.cwd(), 'src/components/BlocklyPanel.tsx');
    const blocklySource = fs.readFileSync(blocklyPath, 'utf8');

    expect(blocklySource).toContain('useState(false)');
  });
});
