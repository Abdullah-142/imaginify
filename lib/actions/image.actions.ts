"use server";
import Image from "@/lib/database/models/image.model";
import User from "@/lib/database/models/user.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { handleError } from "../utils";
import { v2 as cloudinary } from "cloudinary";

const populateUser = (query: any) =>
  query.populate({
    path: "author",
    model: User,
    select: "_id firstName lastName clerkId",
  });

// add image

export const addImage = async ({ image, userId, path }: AddImageParams) => {
  try {
    await connectToDatabase();
    const author = await User.findById(userId);
    if (!author) throw new Error("User not found");

    const addImage = await Image.create({ ...image, author: author._id });

    revalidatePath(path);
    return JSON.parse(JSON.stringify(addImage));
  } catch (error) {
    handleError(error);
  }
};

// update image

export const updateImage = async ({ image, userId, path }: UpdateImageParams) => {
  try {
    await connectToDatabase();
    const imageToUpdate = await Image.findById(image._id);

    if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId)
      throw new Error("Image not found or you are not authorized to update it");

    const updatedImage = await Image.findByIdAndUpdate(image._id, image, { new: true });
    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error);
  }
};

// delete image

export const imageDelete = async (imageId: string) => {
  try {
    await connectToDatabase();
    await Image.findByIdAndDelete(imageId);
  } catch (error) {
    handleError(error);
  } finally {
    redirect("/");
  }
};

// get image by id

export async function getImageById(imageId: string) {
  try {
    await connectToDatabase();

    const image = await populateUser(Image.findById(imageId));

    if (!image) throw new Error("Image not found");

    return JSON.parse(JSON.stringify(image));
  } catch (error) {
    handleError(error);
  }
}

// get all images

export async function getAllImages({
  limit = 9,
  page = 1,
  searchQuery = "",
}: {
  limit?: number;
  page: number;
  searchQuery?: string;
}) {
  try {
    await connectToDatabase();

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    let expression = "folder=imaginify";

    if (searchQuery) {
      expression += ` AND ${searchQuery}`;
    }
    const { resources } = await cloudinary.search.expression(expression).execute();

    const resourceIds = resources.map((resource: any) => resource.public_id);

    let query = {};

    if (searchQuery) {
      query = {
        publicId: {
          $in: resourceIds,
        },
      };
    }

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find(query))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find(query).countDocuments();
    const savedImages = await Image.find().countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPage: Math.ceil(totalImages / limit),
      savedImages,
    };
  } catch (error) {
    console.log(error);
  }
}

// GET IMAGES BY USER
export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: {
  limit?: number;
  page: number;
  userId: string;
}) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find({ author: userId }))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}
