// Redirect URL for auth failure
export const UNAUTHORISED_REDIRECT_URL = "/login";

/**
 * Returns a variation of /login URL with query params
 * @param from - page the user is coming from
 * @param error - error type
 * @returns
 */
export const getFallbackURL = (from: string, error: string) => {
  return `${UNAUTHORISED_REDIRECT_URL}?from=${from}&error=${error}`;
};

// Error message upon auth failure
export const ERROR_TYPE_MAP = {
  UNAUTHORISED: "unauthorised",
  SESSION_EXPIRED: "session-expired",
  DEFAULT: "default",
  KYC_INCOMPLETE: "kyc-incomplete",
  NEW_USER: "new-user",
} as const;

export const getLoginErrorMsg = (
  from: string,
  authorisationError: string
): string => {
  const error_msg_map: Record<string, string> = {
    [ERROR_TYPE_MAP.UNAUTHORISED]: `Please sign in to access ${from}, err: ${authorisationError}.`,
    [ERROR_TYPE_MAP.DEFAULT]: `Unexpected error: ${authorisationError} from ${from}. Try again`,
    [ERROR_TYPE_MAP.KYC_INCOMPLETE]: `You have to complete KYC registration to access ${from}: ${authorisationError}.`,
    [ERROR_TYPE_MAP.NEW_USER]: `Welcome new user! Please login and complete the compliance process to access our ${from}.`,
    [ERROR_TYPE_MAP.SESSION_EXPIRED]: `Your session has expired while accessing ${from}. Please login again.`,
  };

  return (
    error_msg_map[authorisationError] ?? error_msg_map[ERROR_TYPE_MAP.DEFAULT]
  );
};
