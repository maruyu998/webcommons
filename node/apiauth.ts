import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { generateRandom } from "../commons/utils/random";

type ApiauthType = {
  apiauthId: string,
  apiKey: string,
  userId: string,
  expiredAt?: Date
};

const ApiauthModel = mongoose.model<ApiauthType>("mwc_apiauth", 
  new mongoose.Schema<ApiauthType>({
    apiauthId: {
      type: String,
      required: true,
      unique: true,
      default: ()=>uuidv4()
    },
    userId: {
      type: String,
      required: true
    },
    apiKey: {
      type: String,
      required: true,
      default: ()=>generateRandom(50)
    },
    expiredAt: {
      type: Date,
      required: false
    }
  }, {
    timestamps:true
  })
);

export async function issueApiKey(userId:string){
  const apiauth = await ApiauthModel.create({userId});
  return apiauth.toJSON();
}

export async function getUserIdByApiKey(apiKey:string){
  const apiauth = await ApiauthModel.findOne({apiKey, $or:[{expiredAt:null}, {expiredAt:{$gt:new Date()}}]});
  if(apiauth == null) return null;
  return apiauth.toJSON().userId;
}

export async function getUserApiauths(userId: string){
  const apiauths = await ApiauthModel.find(
    { userId },
    { _id:0, apiauthId:1, apiKey:1, expiredAt:1 }
  ).lean();
  return apiauths;
}