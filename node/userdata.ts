import mongoose, { Schema } from "mongoose";
import { UserIdType } from "../commons/types/user";

type UserDataType = {
  userId: UserIdType,
  uniqueKey: string,
  data: any,
  expiresAt?: Date
};

const UserDataModel = mongoose.model<UserDataType>("mwc_userdata", 
  (()=>{
    const schema = new mongoose.Schema<UserDataType>({
      userId: {
        type: String,
        required: true
      },
      uniqueKey: {
        type: String,
        required: true
      },
      data: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        optional: true
      },
      expiresAt: {
        type: Date,
        required: false
      }
    }, {
      timestamps:true
    })
    schema.index({ userId:1, uniqueKey: 1 }, { unique: true });
    return schema;
  })()
);

export async function saveUserData(userId:UserIdType,uniqueKey:string,data:any,expiresAt?:Date){
  const updates = expiresAt ? { data, expiresAt } : { data }
  await UserDataModel.findOneAndUpdate({userId, uniqueKey}, updates, {upsert:true});
}

export async function getUserData(userId:UserIdType,uniqueKey:string){
  const query = {userId, uniqueKey, $or:[{expiresAt:{$gt:new Date()}}, {expiresAt:{$exists:false}}]};
  const userData = await UserDataModel.findOne(query).lean();
  UserDataModel.deleteMany({expiresAt: { $lte: new Date() }});
  if(!userData) return undefined;
  return userData.data;
}

export async function deleteUserData(userId:UserIdType,uniqueKey:string){
  await UserDataModel.findOneAndDelete({userId, uniqueKey});
}