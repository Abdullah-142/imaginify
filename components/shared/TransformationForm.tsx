"use client";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from "@/constants";
import { updateCredits } from "@/lib/actions/user.actions";
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCldImageUrl } from "next-cloudinary";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import CustomField from "./CustomField";
import MediaUploader from "./MediaUploader";
import TransformedImage from "./TransformedImage";
import { addImage, updateImage } from "@/lib/actions/image.actions";
import { useRouter } from "next/navigation";
import { InsufficientCreditsModal } from "./InsufficientCreditsModal";

export const formSchema = z.object({
  title: z.string(),
  aspectRatio: z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
});

function TransformationForm({
  action,
  data = null,
  type,
  userId,
  creditBalance,
  config = null,
}: TransformationFormProps) {
  // useState  hooks

  const router = useRouter();
  const transformationType = transformationTypes[type];
  const [image, setImage] = useState(data);
  const [newTransformation, setNewTransformation] = useState<Transformations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationConfig, setTransformationConfig] = useState(config);
  const [ispending, startTransition] = useTransition();

  // 1. Initialize the form with default values.

  const initialValues =
    data && action === "Update"
      ? {
          title: data.title,
          aspectRatio: data.aspectRatio,
          color: data.color,
          prompt: data.prompt,
          publicId: data.publicId,
        }
      : defaultValues;

  // assign default values to form

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (data || image) {
      const transformationUrl = getCldImageUrl({
        src: image?.publicId,
        width: image?.width,
        height: image?.height,
        ...transformationConfig,
      });

      const inputData = {
        title: values.title,
        publicId: image?.publicId,
        transformationType: type,
        width: image?.width,
        height: image?.height,
        config: transformationConfig,
        secureURL: image?.secureURL,
        transformationURL: transformationUrl,
        aspectRatio: values.aspectRatio,
        prompt: values.prompt,
        color: values.color,
      };
      if (action === "Add") {
        try {
          const newImage = await addImage({
            image: inputData,
            userId,
            path: "/",
          });

          if (newImage) {
            form.reset();
            setImage(null);
            router.push(`/transformations/${newImage._id}`);
          }
        } catch (error) {
          console.log(error);
        }
      }
      if (action === "Update") {
        try {
          const updatedImage = await updateImage({
            image: { ...inputData, _id: data._id },
            userId,
            path: `/transformations${data._id}`,
          });

          if (updatedImage) {
            router.push(`/images/${updatedImage._id}`);
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    setIsSubmitting(false);
  }

  // onSelectfieldHandler

  const onSelectfieldHandler = (value: string, onChangeField: (value: string) => void) => {
    const imageSize = aspectRatioOptions[value as AspectRatioKey];
    setImage((prevState: any) => ({
      ...prevState,
      aspectRatio: imageSize.aspectRatio,
      width: imageSize.width,
      height: imageSize.height,
    }));
    setNewTransformation(transformationType.config);

    return onChangeField(value);
  };

  // onInputChangeHandler

  const onInputChangeHandler = (
    fieldName: string,
    value: string,
    type: string,
    onChangeField: (value: string) => void
  ) => {
    debounce(() => {
      setNewTransformation((prevState: any) => ({
        ...prevState,
        [type]: {
          ...prevState?.[type],
          [fieldName === "prompt" ? "prompt" : "to"]: value,
        },
      }));
    }, 1000)();

    return onChangeField(value);
  };

  // Todo Still want to do this  onTransformationHandler
  const onTransformHandler = async () => {
    setIsTransforming(true);

    setTransformationConfig(deepMergeObjects(newTransformation, transformationConfig));

    setNewTransformation(null);

    startTransition(async () => {
      await updateCredits(userId, creditFee);
    });
  };

  useEffect(() => {
    if (image && (type === "restore" || type === "removeBackground")) {
      setNewTransformation(transformationType.config);
    }
  }, [image, transformationType.config, type]);

  // 3. Render the form with the `Form` component and the `Input` component.

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal />}
        <CustomField
          control={form.control}
          name="title"
          formLabel="Image Title"
          className="w-full"
          render={({ field }) => <Input {...field} placeholder="Title" className="input-field" />}
        />

        {/* On fill  */}

        {type === "fill" && (
          <CustomField
            control={form.control}
            name="aspectRatio"
            formLabel="Aspect Ratio"
            className="w-full"
            render={({ field }) => (
              <Select onValueChange={(value) => onSelectfieldHandler(value, field.onChange)}>
                <SelectTrigger className="select-field">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(aspectRatioOptions).map((key) => (
                    <SelectItem key={key} value={key} className="select-item">
                      {aspectRatioOptions[key as AspectRatioKey].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}

        {/* On remove or recolor */}

        {(type === "remove" || type === "recolor") && (
          <div className="prompt-field">
            <CustomField
              control={form.control}
              name="prompt"
              className="w-full"
              formLabel={type === "remove" ? "Object to remove" : "Object to recolor"}
              render={({ field }) => (
                <Input
                  value={field.value}
                  className="input-field"
                  onChange={(e) => onInputChangeHandler("prompt", e.target.value, type, field.onChange)}
                />
              )}
            />
            {type === "recolor" && (
              <CustomField
                control={form.control}
                name="color"
                formLabel="Replacement Color"
                className="w-full"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    className="input-field"
                    onChange={(e) => onInputChangeHandler("color", e.target.value, "recolor", field.onChange)}
                  />
                )}
              />
            )}
          </div>
        )}

        <div className="media-uploader-field">
          <CustomField
            control={form.control}
            name="publicId"
            className="flex size-full flex-col"
            render={({ field }) => (
              <MediaUploader
                onValueChange={field.onChange}
                setImage={setImage}
                publicId={field.value}
                image={image}
                type={type}
              />
            )}
          />
          <TransformedImage
            image={image}
            type={type}
            title={form.getValues().title}
            isTransforming={isTransforming}
            setIsTransforming={setIsTransforming}
            transformationConfig={transformationConfig}
          />
        </div>

        {/* button */}

        <div className="flex flex-col gap-4">
          <Button
            type="button"
            className="submit-button capitalize"
            disabled={isTransforming || newTransformation === null}
            onClick={onTransformHandler}
          >
            {isTransforming ? "Transforming..." : "Apply Transformation"}
          </Button>
          <Button
            type="submit"
            className="submit-button capitalize"
            disabled={isSubmitting || isTransforming}
          >
            {isSubmitting ? "Submitting..." : "save image"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default TransformationForm;
