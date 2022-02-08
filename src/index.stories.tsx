import React, { useContext } from 'react';
import { Story, Meta } from '@storybook/react';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Box, Button, Typography } from '@material-ui/core';
import { AuthContext } from '@adamldoyle/react-aws-auth-context-core';
import { AuthContextProvider } from '@adamldoyle/react-aws-auth-context-mui-formik';
import { buildAuthSlice } from '.';

const { authSlice, authSelectors, AuthInjector } = buildAuthSlice();
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

function SessionInfoComponent() {
  const session = useSelector(authSelectors.selectSession);
  const { signOut } = useContext(AuthContext);
  return (
    <Box>
      <Typography variant="h4">Authenticated</Typography>
      <Typography variant="h6">Profile</Typography>
      <p>{JSON.stringify(session.profile)}</p>
      <Typography variant="h6">ID payload</Typography>
      <ul>
        {Object.entries(session.idPayload).map((payloadEntry) => (
          <li key={payloadEntry[0]}>
            {payloadEntry[0]}: {JSON.stringify(payloadEntry[1])}
          </li>
        ))}
      </ul>
      <Typography variant="h6">Access payload</Typography>
      <ul>
        {Object.entries(session.accessPayload).map((payloadEntry) => (
          <li key={payloadEntry[0]}>
            {payloadEntry[0]}: {JSON.stringify(payloadEntry[1])}
          </li>
        ))}
      </ul>
      <Button variant="contained" color="primary" onClick={signOut}>
        Sign out
      </Button>
    </Box>
  );
}

export default {
  title: 'Examples',
  decorators: [
    (Story) => (
      <AuthContextProvider sessionPingDelay={45}>
        <Provider store={store}>
          <AuthInjector>
            <Story />
          </AuthInjector>
        </Provider>
      </AuthContextProvider>
    ),
  ],
} as Meta;

const Template: Story = () => <SessionInfoComponent />;

export const Default = Template.bind({});
Default.args = {};
