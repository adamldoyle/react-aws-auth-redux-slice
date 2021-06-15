# react-aws-auth-redux-slice

Extension of [@adamldoyle/react-aws-auth-context](https://github.com/adamldoyle/react-aws-auth-context) that listens to Auth context changes and adds the session and profile to an authentication Redux slice.

## Features

1. Automatically detects profile/session changes and keeps them up-to-date in Redux
2. Provides several selectors to extract information

## Installation

1. `yarn add @adamldoyle/react-aws-auth-redux-slice`
2. Build auth slice using `buildAuthSlice` which returns `authSlice`, `authSelectors`, `AuthInjector`
3. Nest `AuthInjector` within `AuthContextProvider` (from [@adamldoyle/react-aws-auth-context](https://github.com/adamldoyle/react-aws-auth-context)) and containing the rest of your application component heirarchy
4. Use selectors provided by `authSelectors` to select session/profile information as necessary

## Examples

- https://adamldoyle-react-aws-auth-redux-slice-storybook.netlify.app/

OR

1. Create `.env` file in root based on `.env.sample`
2. `yarn storybook`

## Development

1. `yarn install`
2. `yarn build`

## Contributors

[Adam Doyle](https://github.com/adamldoyle)

## License

MIT
