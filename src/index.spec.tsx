import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, PayloadAction } from '@reduxjs/toolkit';
import { AuthContext } from '@adamldoyle/react-aws-auth-context-core';
import { buildAuthSlice, IAuthState, ISession } from './';

const completedAuthContext = {
  session: {
    getIdToken: () => ({
      getJwtToken: () => 'idJwtToken',
      payload: 'idPayload',
    }),
    getAccessToken: () => ({
      getJwtToken: () => 'accessJwtToken',
      payload: 'accessPayload',
    }),
  },
  profile: {
    email: 'testEmail@gmail.com',
    firstName: 'Joe',
    lastName: 'Schmo',
    allowMarketing: true,
  },
};

const completedAuthStoreData: ISession = {
  accessToken: 'accessJwtToken',
  accessPayload: { accessKey: 'accessValue' },
  idToken: 'idJwtToken',
  idPayload: { idKey: 'idValue' },
  profile: completedAuthContext.profile,
};

describe('buildAuthSlice', () => {
  describe('authSlice', () => {
    it('supports setting the name', () => {
      const { authSlice } = buildAuthSlice({
        name: 'testAuth',
      });
      expect(authSlice.name).toEqual('testAuth');
    });

    it('defaults slice name to auth', () => {
      const { authSlice } = buildAuthSlice();
      expect(authSlice.name).toEqual('auth');
    });

    it('supports defining state to contain more than session', () => {
      interface FooAuthState extends IAuthState {
        foo: string;
      }
      const { authSlice } = buildAuthSlice<unknown, FooAuthState>({
        initialState: { foo: 'bar' },
      });
      const store = configureStore({
        reducer: {
          testAuth: authSlice.reducer,
        },
      });
      expect(store.getState().testAuth.foo).toEqual('bar');
    });

    it('defaults session state to null', () => {
      const { authSlice } = buildAuthSlice();
      const store = configureStore({
        reducer: {
          testAuth: authSlice.reducer,
        },
      });
      expect(store.getState().testAuth.session).toBeNull();
    });

    it('provides action to set session', () => {
      const { authSlice } = buildAuthSlice();
      const store = configureStore({
        reducer: {
          testAuth: authSlice.reducer,
        },
      });
      store.dispatch(authSlice.actions.setSession('newSession'));
      expect(store.getState().testAuth.session).toEqual('newSession');
    });

    it('supports defining extra actions', () => {
      interface FooAuthState extends IAuthState {
        foo: string;
      }
      const { authSlice } = buildAuthSlice<unknown, FooAuthState>({
        initialState: { foo: 'bar' },
        reducers: {
          setFoo: (state, action: PayloadAction<string>) => {
            state.foo = action.payload;
          },
        },
      });
      const store = configureStore({
        reducer: {
          testAuth: authSlice.reducer,
        },
      });
      store.dispatch(authSlice.actions.setFoo('newBar'));
      expect(store.getState().testAuth.foo).toEqual('newBar');
    });
  });

  describe('authSelectors', () => {
    it('selectSlice returns slice', () => {
      const { authSelectors } = buildAuthSlice({
        name: 'testAuth',
      });
      expect(
        authSelectors.selectSlice({
          testAuth: { session: completedAuthStoreData },
        })
      ).toEqual({ session: completedAuthStoreData });
    });

    it('selectSession returns session', () => {
      const { authSelectors } = buildAuthSlice({
        name: 'testAuth',
      });
      expect(
        authSelectors.selectSession({
          testAuth: { session: completedAuthStoreData },
        })
      ).toEqual(completedAuthStoreData);
    });

    it('selectProfile returns profile', () => {
      const { authSelectors } = buildAuthSlice({
        name: 'testAuth',
      });
      expect(
        authSelectors.selectProfile({
          testAuth: { session: completedAuthStoreData },
        })
      ).toEqual(completedAuthStoreData.profile);
    });

    it('selectProfile returns null for profile if session null', () => {
      const { authSelectors } = buildAuthSlice({
        name: 'testAuth',
      });
      expect(
        authSelectors.selectProfile({
          testAuth: { session: null },
        })
      ).toBeNull();
    });
  });

  describe('AuthInjector', () => {
    const renderInjector = (authContext) => {
      const authSliceUtils = buildAuthSlice({
        name: 'testAuth',
      });

      const renderedStore = configureStore({
        reducer: {
          testAuth: authSliceUtils.authSlice.reducer,
        },
      });

      const rendered = render(
        <AuthContext.Provider value={authContext as any}>
          <Provider store={renderedStore}>
            <authSliceUtils.AuthInjector>
              <>Authenticated</>
            </authSliceUtils.AuthInjector>
          </Provider>
        </AuthContext.Provider>
      );

      return { authSliceUtils, renderedStore, rendered };
    };

    it('adds profile and session to store', () => {
      const { renderedStore } = renderInjector(completedAuthContext);

      const storeSession = renderedStore.getState().testAuth.session;
      expect(storeSession.profile).toEqual(completedAuthContext.profile);
      expect(storeSession.accessToken).toEqual(
        completedAuthContext.session.getAccessToken().getJwtToken()
      );
      expect(storeSession.accessPayload).toEqual(
        completedAuthContext.session.getAccessToken().payload
      );
      expect(storeSession.idToken).toEqual(
        completedAuthContext.session.getIdToken().getJwtToken()
      );
      expect(storeSession.idPayload).toEqual(
        completedAuthContext.session.getIdToken().payload
      );
    });

    it('renders childen', () => {
      const { rendered } = renderInjector(completedAuthContext);
      expect(rendered.queryByText('Authenticated')).not.toBeNull();
    });

    it('updates profile and session when they change', () => {
      const { authSliceUtils, renderedStore, rendered } =
        renderInjector(completedAuthContext);
      const newAuthContext = {
        session: {
          getIdToken: () => ({
            getJwtToken: () => 'idJwtToken2',
            payload: 'idPayload2',
          }),
          getAccessToken: () => ({
            getJwtToken: () => 'accessJwtToken2',
            payload: 'accessPayload2',
          }),
        },
        profile: {
          email: 'newEmail@gmail.com',
          firstName: 'Joseph',
          lastName: 'Schmoseph',
          allowMarketing: false,
        },
      };
      rendered.rerender(
        <AuthContext.Provider value={newAuthContext as any}>
          <Provider store={renderedStore}>
            <authSliceUtils.AuthInjector>
              <>Authenticated</>
            </authSliceUtils.AuthInjector>
          </Provider>
        </AuthContext.Provider>
      );

      const storeSession = renderedStore.getState().testAuth.session;
      expect(storeSession.profile).toEqual(newAuthContext.profile);
      expect(storeSession.accessToken).toEqual(
        newAuthContext.session.getAccessToken().getJwtToken()
      );
      expect(storeSession.accessPayload).toEqual(
        newAuthContext.session.getAccessToken().payload
      );
      expect(storeSession.idToken).toEqual(
        newAuthContext.session.getIdToken().getJwtToken()
      );
      expect(storeSession.idPayload).toEqual(
        newAuthContext.session.getIdToken().payload
      );
    });
  });
});
