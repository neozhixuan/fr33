// Redirect URL for auth failure
export const UNAUTHORISED_REDIRECT_URL = "/login";

export const getFallbackURL = (from: string, error: string) => {
  return `${UNAUTHORISED_REDIRECT_URL}?from=${from}&error=${error}`;
};

// Error message upon auth failure
export const ERROR_TYPE_MAP = {
  UNAUTHORISED: "unauthorised",
  DEFAULT: "default",
  WRONG_STEP_ERROR: "wrong-step-error",
} as const;

export const getLoginErrorMsg = (
  from: string,
  authorisationError: string
): string => {
  const error_msg_map: Record<string, string> = {
    [ERROR_TYPE_MAP.UNAUTHORISED]: `Please sign in to access ${from}, err: ${authorisationError}.`,
    [ERROR_TYPE_MAP.DEFAULT]: `Unexpected error: ${authorisationError} from ${from}. Try again`,
    [ERROR_TYPE_MAP.WRONG_STEP_ERROR]: `You are not at the right registration step to access ${from}: ${authorisationError}.`,
  };

  return (
    error_msg_map[authorisationError] ?? error_msg_map[ERROR_TYPE_MAP.DEFAULT]
  );
};
