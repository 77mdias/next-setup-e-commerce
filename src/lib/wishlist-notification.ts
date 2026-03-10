const WISHLIST_NEW_ITEMS_STORAGE_KEY_PREFIX = "wishlist:new-items:";

export const WISHLIST_NEW_ITEMS_EVENT = "wishlist:new-items-change";

export type WishlistNewItemsEventDetail = {
  hasNewItems: boolean;
  userId: string;
};

export function getWishlistNewItemsStorageKey(userId: string): string {
  return `${WISHLIST_NEW_ITEMS_STORAGE_KEY_PREFIX}${userId}`;
}

function dispatchWishlistNewItemsEvent(
  userId: string,
  hasNewItems: boolean,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<WishlistNewItemsEventDetail>(WISHLIST_NEW_ITEMS_EVENT, {
      detail: { hasNewItems, userId },
    }),
  );
}

export function hasWishlistNewItems(userId?: string | null): boolean {
  if (!userId || typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(getWishlistNewItemsStorageKey(userId)) === "1"
  );
}

export function markWishlistNewItems(userId?: string | null): void {
  if (!userId || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getWishlistNewItemsStorageKey(userId), "1");
  dispatchWishlistNewItemsEvent(userId, true);
}

export function clearWishlistNewItems(userId?: string | null): void {
  if (!userId || typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getWishlistNewItemsStorageKey(userId));
  dispatchWishlistNewItemsEvent(userId, false);
}
