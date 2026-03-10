export const SIZE_TYPES = {
  STANDARD: "Standard",
  SHOE: "ShoeSize",
  ONE_SIZE: "OneSize",
} as const;

export const SIZE_TEMPLATES = {
  [SIZE_TYPES.STANDARD]: [
    "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL",
  ],
  [SIZE_TYPES.SHOE]: [
    "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46",
    "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12",
    "US 5", "US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12", "US 13",
  ],
  [SIZE_TYPES.ONE_SIZE]: ["One Size"],
};
