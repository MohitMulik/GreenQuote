import mongoose from "mongoose";
import { config } from "./config";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: Promise<typeof mongoose> | null;
}

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(config.mongoUri, {
      bufferCommands: false,
    });
  }

  try {
    await global.mongooseConnection;
    return mongoose;
  } catch (error) {
    global.mongooseConnection = null;
    throw error;
  }
}

export const connectDatabase = connectDb;

