import { render, screen } from '@testing-library/react';
import { rest } from 'msw';
import { QueryClientProvider, setLogger } from 'react-query';
import { generateQueryClient } from 'react-query/queryClient';

import { server } from '../../../mocks/server';
import { renderWithQueryClient } from '../../../test-utils';
import { AllStaff } from '../AllStaff';

test('renders response from query', async () => {
  // write test here
  renderWithQueryClient(<AllStaff />);

  const staffNames = await screen.findAllByRole('heading', {
    name: /divya|sandra|michael|mateo/i,
  });

  expect(staffNames).toHaveLength(4);
});

test('handles query error', async () => {
  // (re)set handler to return a 500 error for staff
  server.resetHandlers(
    rest.get('http://localhost:3030/staff', (req, res, ctx) => {
      return res(ctx.status(500));
    }),
  );

  // OPTION TO NOT IMPORT FROM test-utils. Everything from scratch
  // supress errors
  setLogger({
    log: console.log,
    warn: console.warn,
    error: () => {
      // swallow errors without printing out
    },
  });

  // set up query client with retires set to false
  const queryClient = generateQueryClient();
  const options = queryClient.getDefaultOptions();
  // Keep all other options except for the retry options.
  options.queries = { ...options.queries, retry: false };
  queryClient.setDefaultOptions(options);

  // render wrapped with provider
  render(
    <QueryClientProvider client={queryClient}>
      <AllStaff />
    </QueryClientProvider>,
  );

  // check for toast alert
  const alertToast = await screen.findByRole('alert');
  expect(alertToast).toHaveTextContent('Request failed with status code 500');
});
