const MESSAGES = {
  PLAN_REQUIRED: 'Premium is required to play from that category. Upgrade or pick a free random game.',
  NO_PUZZLE_IN_CATEGORY: 'No puzzle is available in that category right now. Try another category.',
  CATEGORY_NOT_FOUND: 'That category was not found. Refresh the list and try again.',
  SESSION_COMPLETED: 'This game is already finished. Start a new round from home.',
  NO_PUZZLE_AVAILABLE: 'No puzzle is available right now. Try again in a moment.',
  NO_MORE_HINTS: 'You have used every hint for this puzzle.',
  FORBIDDEN: 'You do not have access to that session.',
  NOT_FOUND: 'We could not find that item.',
  INVALID_ID: 'That link is not valid.',
};

export function getUserFriendlyApiMessage(err, fallback = 'Something went wrong. Please try again.') {
  const code = err?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return err?.message || fallback;
}
