import React from 'react';
import { render, screen } from '@testing-library/react';
import EthereaAgent from './EthereaAgent';

test('renders Etherea avatar svg', () => {
  render(<EthereaAgent expression="neutral" mouthOpen={0.2} isSpeaking={false} />);
  expect(screen.getByRole('img', { name: 'Etherea avatar' })).not.toBeNull();
});
