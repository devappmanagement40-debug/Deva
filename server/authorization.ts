type SupportAccessUser = {
  isAdmin: boolean;
  isSupportAgent: boolean;
};

export function hasSupportInboxAccess(
  user: SupportAccessUser | null | undefined,
): boolean {
  return user?.isAdmin === true || user?.isSupportAgent === true;
}

export function hasAdminPanelAccess(
  user: SupportAccessUser | null | undefined,
): boolean {
  return user?.isAdmin === true;
}
