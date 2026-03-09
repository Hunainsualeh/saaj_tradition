import { z } from "zod";

// Delivery Details Schema
export const deliveryDetailsSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Valid ZIP code required"),
    country: z.string().min(1, "Country is required"),

    useSameBillingAddress: z.boolean(),

    billingAddress: z.string().optional(),
    billingCity: z.string().optional(),
    billingState: z.string().optional(),
    billingZipCode: z.string().optional(),
    billingCountry: z.string().optional(),

    orderNote: z.string().max(500, "Note must be under 500 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.useSameBillingAddress) return;

    if (!data.billingAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["billingAddress"],
        message: "Billing street address is required",
      });
    }

    if (!data.billingCity) {
      ctx.addIssue({
        code: "custom",
        path: ["billingCity"],
        message: "Billing city is required",
      });
    }

    if (!data.billingState) {
      ctx.addIssue({
        code: "custom",
        path: ["billingState"],
        message: "Billing state is required",
      });
    }

    if (!data.billingZipCode) {
      ctx.addIssue({
        code: "custom",
        path: ["billingZipCode"],
        message: "Billing ZIP code is required",
      });
    }

    if (!data.billingCountry) {
      ctx.addIssue({
        code: "custom",
        path: ["billingCountry"],
        message: "Billing country is required",
      });
    }
  });

// Payment Schema
export const paymentSchema = z.object({
  paymentMethod: z.enum(["PAYFAST", "COD"]),
});

// Combined Checkout Form Schema
export const checkoutFormSchema = deliveryDetailsSchema.and(paymentSchema);

// TypeScript Types
export type DeliveryDetailsData = z.infer<typeof deliveryDetailsSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
