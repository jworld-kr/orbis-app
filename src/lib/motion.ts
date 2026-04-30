// Shared easing curve for the Orbis brand: slow start, gentle settle.
// `as const` so framer-motion accepts it as a tuple, not number[].
export const ORBIS_EASE = [0.16, 1, 0.3, 1] as const;
