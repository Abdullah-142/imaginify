"use server";

import User from "@/lib/database/models/user.model";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";

// createuser

export const createUser = async (user: CreateUserParams) => {
  try {
    await connectToDatabase();

    const newUser = await User.create(user);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
};

// getUserById

export const getUserById = async (userid: string) => {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userid });
    if (!user) throw new Error("User not found");

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
};

// updateUser

export const updateUser = async (userid: string, user: UpdateUserParams) => {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate({ clerkId: userid }, user, {
      new: true,
    });
    if (!updatedUser) throw new Error("User could not be updated.");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
};

//Delete user

export const deleteUser = async (clerkId: string) => {
  try {
    await connectToDatabase();
    const userToDelete = await User.findOne({ clerkId });
    if (!userToDelete) throw new Error("User not found");

    const deletedUser = await User.findOneAndDelete(userToDelete._id);

    if (!deletedUser) throw new Error("User could not be deleted.");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
};

export const updateCredits = async (userId: string, creditfee: number) => {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { creditBalance: creditfee } },
      { new: true }
    );
    if (!updatedUser) throw new Error("User credit could not be updated.");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
};
