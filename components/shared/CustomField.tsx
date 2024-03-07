import React from "react";
import { Control } from "react-hook-form";
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { formSchema } from "./TransformationForm";

// types 

type CustomFieldProps = {
  control: Control<z.infer<typeof formSchema>> | undefined;
  render: (props: { field: any }) => React.ReactNode;
  name: keyof z.infer<typeof formSchema>;
  formLabel?: string;
  className?: string;
};
const CustomField = ({ control, render, name, formLabel, className }: CustomFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {formLabel && <FormLabel>{formLabel}</FormLabel>}
          <FormControl>{render({ field })}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CustomField;
