import { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createSlice,
  createSelector,
  PayloadAction,
  SliceCaseReducers,
  CreateSliceOptions,
  Selector,
  Slice,
} from '@reduxjs/toolkit';
import { AuthContext, IProfile } from '@adamldoyle/react-aws-auth-context';

/**
 * Session data containing Cognito session information as well as profile.
 */
export interface ISession {
  /**
   * Cognito access token jwt token
   */
  accessToken: string;
  /**
   * Cognito access token payload
   */
  accessPayload: { [key: string]: unknown };
  /**
   * Cognito id token jwt token
   */
  idToken: string;
  /**
   * Cognito id token payload
   */
  idPayload: { [key: string]: unknown };
  /**
   * User profile
   */
  profile: IProfile;
}

/**
 * Auth slice
 */
export interface IAuthState {
  session: ISession | null;
}

/**
 * Props for AuthInjector component
 */
export interface AuthInjectorProps {
  children: React.ReactNode;
}

export interface IAuthSliceUtils<
  IRootState,
  IState extends IAuthState = IAuthState
> {
  authSlice: Slice<IState>;
  authSelectors: {
    selectSlice: Selector<IRootState, IState>;
    selectSession: Selector<IRootState, ISession | null>;
    selectProfile: Selector<IRootState, IProfile | null>;
  };
  AuthInjector: React.ComponentType<AuthInjectorProps>;
}

/**
 * Build redux slice with auth injection functionality.
 * @param options Slice options that will be augmented with required state/reducers/selectors
 * @returns Auth slice
 */
export function buildAuthSlice<
  IRootState,
  IState extends IAuthState = IAuthState
>(
  options: Partial<CreateSliceOptions> = {}
): IAuthSliceUtils<IRootState, IState> {
  const sliceName = options.name ?? 'auth';
  const authSlice = createSlice<IState, SliceCaseReducers<IState>>({
    ...options,
    name: sliceName,
    initialState: {
      ...(options.initialState ?? {}),
      session: null,
    },
    reducers: {
      ...options.reducers,
      setSession: (state, action: PayloadAction<ISession>) => {
        state.session = action.payload;
      },
    },
  });

  /**
   * Select full slice
   */
  const selectSlice = createSelector<IRootState, IState, IState>(
    (state) => state[sliceName],
    (slice) => slice
  );

  /**
   * Select session from slice
   */
  const selectSession = createSelector<IRootState, IState, ISession | null>(
    selectSlice,
    (slice) => slice.session
  );

  /**
   * Select profile from session
   */
  const selectProfile = createSelector<
    IRootState,
    ISession | null,
    IProfile | null
  >(selectSession, (session) => session?.profile ?? null);

  /**
   * Takes profile/session from AuthContext and adds them to slice whenever they change
   * @param props Only accept children
   * @returns Null if session not in store yet, otherwise the children
   */
  function AuthInjector({ children }: AuthInjectorProps): JSX.Element | null {
    const dispatch = useDispatch();
    const { profile, session } = useContext(AuthContext);
    const reduxSession = useSelector(selectSession);

    useEffect(() => {
      const accessToken = session.getAccessToken();
      const idToken = session.getIdToken();
      dispatch(
        authSlice.actions.setSession({
          profile,
          accessToken: accessToken.getJwtToken(),
          accessPayload: accessToken.payload,
          idToken: idToken.getJwtToken(),
          idPayload: idToken.payload,
        })
      );
    }, [dispatch, session, profile]);

    if (!reduxSession) {
      return null;
    }

    return <>{children}</>;
  }

  const authSelectors = {
    selectSlice,
    selectSession,
    selectProfile,
  };
  return { authSlice, authSelectors, AuthInjector };
}
