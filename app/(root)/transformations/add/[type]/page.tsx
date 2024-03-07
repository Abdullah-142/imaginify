import Header from "@/components/shared/Header";
import TransformationForm from "@/components/shared/TransformationForm";
import { transformationTypes } from "@/constants";
import { getUserById } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs";
import React from "react";
import { redirect } from "next/navigation";

const AddTransformationTypePage = async ({ params: { type } }: SearchParamProps) => {
  const { userId } = auth();
  const transformation = transformationTypes[type];
  if (!userId) redirect("/sign-in");
  console.log(userId);
  const user = await getUserById(userId);
  return (
    <>
      <Header title={transformation.title} lable={transformation.subTitle} />

      <section className="mt-10">
        <TransformationForm
          userId={user._id}
          action="Add"
          type={transformation.type as TransformationTypeKey}
          creditBalance={user.creditBalance}
        />
      </section>
    </>
  );
};

export default AddTransformationTypePage;
