import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { generateRandom } from "../../commons/utils/random";
import { UserIdType } from "../../commons/types/user";
import { ApiauthType, PermissionType } from "../types/apiauth";

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
    permissionList: [{
      type: String,
      required: true,
    }],
    expiresAt: {
      type: Date,
      default: null,
      required: false
    }
  }, {
    timestamps:true
  })
);

export async function issueApiauth(userId:UserIdType, permissionList:PermissionType[]=[]){
  const apiauth = await ApiauthModel.create({userId, permissionList});
  return apiauth.toJSON();
}

export async function getInfoFromApiKey(apiKey:string):Promise<Pick<ApiauthType,"userId"|"permissionList"|"expiresAt">|null>{
  const apiauth = await ApiauthModel.findOne({apiKey, $or:[{expiresAt:null}, {expiresAt:{$gt:new Date()}}]});
  if(apiauth == null) return null;
  const { userId, permissionList, expiresAt } = apiauth.toJSON();
  return { userId, permissionList, expiresAt }
}

export async function getUserApiauths(userId:UserIdType){
  const apiauths = await ApiauthModel.find(
    { userId },
    { _id:0, apiauthId:1, apiKey:1, permissionList:1, expiresAt:1 }
  ).lean();
  return apiauths;
}