"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { DeliveryDetailsData, deliveryDetailsSchema } from "./schema";
import { Button, Checkbox, Input } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { ProvinceSelect } from "./ProvinceSelect";

type DeliveryDetailsStepProps = {
  completed: boolean;
  onEditDelivery: () => void;
  onContinueToPayment: (deliveryData: DeliveryDetailsData) => void;
};

export function DeliveryDetailsStep(props: DeliveryDetailsStepProps) {
  // === PROPS ===
  const { completed, onEditDelivery, onContinueToPayment } = props;

  // === CLASSES ===
  const labelClass = "block text-sm font-medium text-neutral-11 mb-2";

  // === FORM SETUP ===
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(deliveryDetailsSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      useSameBillingAddress: true,
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      billingCountry: "",
      orderNote: "",
    },
  });

  // === WATCHER ===
  // eslint-disable-next-line react-hooks/incompatible-library
  const deliveryData = completed ? watch() : null;
  const billingSameAsDelivery = watch("useSameBillingAddress");

  return (
    <>
      {/* Delivery Summary */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: completed ? 1 : 0,
          height: completed ? "auto" : 0,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-neutral-02 overflow-hidden flex border border-neutral-5 rounded-md justify-between items-start"
      >
        <div className="space-y-1 text-sm text-neutral-10 p-4">
          <p className="font-medium text-neutral-12 mb-2">Delivery Address</p>
          <p>{deliveryData?.fullName}</p>
          <p>{deliveryData?.email}</p>
          <p>{deliveryData?.phone}</p>
          <p>{deliveryData?.address}</p>
          <p>
            {deliveryData?.city}, {deliveryData?.state} {deliveryData?.zipCode}
          </p>
          <p>{deliveryData?.country}</p>

          {!billingSameAsDelivery && deliveryData?.billingAddress && (
            <>
              <p className="font-medium text-neutral-12 mt-4 mb-2">
                Billing Address
              </p>
              <p>{deliveryData?.billingAddress}</p>
              <p>
                {deliveryData?.billingCity}, {deliveryData?.billingState}{" "}
                {deliveryData?.billingZipCode}
              </p>
              <p>{deliveryData?.billingCountry}</p>
            </>
          )}

          {deliveryData?.orderNote && (
            <>
              <p className="font-medium text-neutral-12 mt-4 mb-2">
                Order Note
              </p>
              <p className="text-neutral-10 italic">{deliveryData.orderNote}</p>
            </>
          )}
        </div>
        <button
          onClick={onEditDelivery}
          className="text-sm p-4 text-neutral-12 cursor-pointer font-medium underline"
        >
          Edit
        </button>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit(onContinueToPayment)}
        animate={{
          opacity: completed ? 0 : 1,
          height: completed ? 0 : "auto",
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "space-y-6 overflow-hidden",
          completed ? "pointer-events-none" : "pointer-events-auto",
        )}
      >
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Full Name
          </label>
          <Input
            className="w-full"
            id="fullName"
            variant="light"
            placeholder="Amelia Clarke"
            autoComplete="name"
            isError={!!errors.fullName}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <Input
            className="w-full"
            id="email"
            type="email"
            variant="light"
            placeholder="info@saajtradition.com"
            autoComplete="email"
            isError={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>
          <Input
            className="w-full"
            id="phone"
            type="tel"
            variant="light"
            placeholder="020 7946 0958"
            autoComplete="tel"
            isError={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Delivery Address Section */}
        <div className="pt-4">
          <h3 className="text-lg font-medium text-neutral-12 mb-4">
            Delivery Address
          </h3>

          {/* Address */}
          <div className="mb-6">
            <label htmlFor="address" className={labelClass}>
              Street Address
            </label>
            <Input
              className="w-full"
              id="address"
              variant="light"
              placeholder="123 Main Street"
              autoComplete="street-address"
              isError={!!errors.address}
              {...register("address")}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="city" className={labelClass}>
                City
              </label>
              <Input
                className="w-full"
                id="city"
                variant="light"
                placeholder="London"
                autoComplete="address-level2"
                isError={!!errors.city}
                {...register("city")}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="state" className={labelClass}>
                Province
              </label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <ProvinceSelect
                    id="state"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isError={!!errors.state}
                  />
                )}
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          {/* ZIP Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="zipCode" className={labelClass}>
                ZIP Code
              </label>
              <Input
                className="w-full"
                id="zipCode"
                variant="light"
                placeholder="SW1A 1AA"
                autoComplete="postal-code"
                isError={!!errors.zipCode}
                {...register("zipCode")}
              />
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.zipCode.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="country" className={labelClass}>
                Country
              </label>
              <Input
                className="w-full"
                id="country"
                variant="light"
                placeholder="United Kingdom"
                autoComplete="country"
                isError={!!errors.country}
                {...register("country")}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billing Checkbox */}
        <div className="pt-4 ps-2 mb-0">
          <Controller
            name="useSameBillingAddress"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="billing-as-delivery"
                checked={field.value}
                onCheckedChange={field.onChange}
                label="My billing address is the same as my delivery address"
                variant="light"
              />
            )}
          />
        </div>

        {/* Billing Address Section */}
        <motion.div
          animate={{
            opacity: billingSameAsDelivery ? 0 : 1,
            height: billingSameAsDelivery ? 0 : "auto",
          }}
          initial={{ opacity: 0, height: 0, paddingTop: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "space-y-6 pt-6 overflow-hidden",
            billingSameAsDelivery
              ? "pointer-events-none"
              : "pointer-events-auto",
          )}
        >
          <h3 className="text-lg mt-8 font-medium text-neutral-12">
            Billing Address
          </h3>
          {/* Billing Address */}
          <div>
            <label htmlFor="billingAddress" className={labelClass}>
              Street Address
            </label>
            <Input
              className="w-full"
              id="billingAddress"
              variant="light"
              placeholder="123 Main Street"
              autoComplete="billing street-address"
              isError={!!errors.billingAddress}
              {...register("billingAddress")}
            />
            {errors.billingAddress && (
              <p className="mt-1 text-sm text-red-600">
                {errors.billingAddress.message}
              </p>
            )}
          </div>
          {/* Billing City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="billingCity" className={labelClass}>
                City
              </label>
              <Input
                className="w-full"
                id="billingCity"
                variant="light"
                placeholder="London"
                autoComplete="billing address-level2"
                isError={!!errors.billingCity}
                {...register("billingCity")}
              />
              {errors.billingCity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.billingCity.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="billingState" className={labelClass}>
                Province
              </label>
              <Controller
                name="billingState"
                control={control}
                render={({ field }) => (
                  <ProvinceSelect
                    id="billingState"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isError={!!errors.billingState}
                  />
                )}
              />
              {errors.billingState && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.billingState.message}
                </p>
              )}
            </div>
          </div>
          {/* Billing ZIP Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="billingZipCode" className={labelClass}>
                ZIP Code
              </label>
              <Input
                className="w-full"
                id="billingZipCode"
                variant="light"
                placeholder="SW1A 1AA"
                autoComplete="billing postal-code"
                isError={!!errors.billingZipCode}
                {...register("billingZipCode")}
              />
              {errors.billingZipCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.billingZipCode.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="billingCountry" className={labelClass}>
                Country
              </label>
              <Input
                className="w-full"
                id="billingCountry"
                variant="light"
                placeholder="United Kingdom"
                autoComplete="billing country"
                isError={!!errors.billingCountry}
                {...register("billingCountry")}
              />
              {errors.billingCountry && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.billingCountry.message}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Order Note */}
        <div className="pt-4">
          <label htmlFor="orderNote" className={labelClass}>
            Order Note{" "}
            <span className="text-neutral-08 font-normal">(optional)</span>
          </label>
          <textarea
            id="orderNote"
            rows={3}
            className="w-full rounded-md border border-neutral-05 bg-white px-3 py-2 text-sm text-neutral-11 placeholder:text-neutral-08 focus:outline-none focus:ring-2 focus:ring-neutral-07 resize-none"
            placeholder="Add any special instructions or notes for your order..."
            {...register("orderNote")}
          />
          {errors.orderNote && (
            <p className="mt-1 text-sm text-red-600">
              {errors.orderNote.message}
            </p>
          )}
        </div>

        <div>
          <Button
            type="submit"
            variant="dark"
            text="Continue to Payment"
            className="w-full"
          />
        </div>
      </motion.form>
    </>
  );
}
