import express from "express";
import webpush from "web-push";
import mongoose from "mongoose";
import mconfig from "maruyu-webcommons/node/mconfig";
import { UnexpectedError } from "./errors";


type PushSubscriptionType = {
  userId: string,
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  };
}

let PushSubscriptionModel:mongoose.Model<PushSubscriptionType>|null = null;

export function register(){
  const publicVapidKey = mconfig.get("publicVapidKey");
  const privateVapidKey = mconfig.get("privateVapidKey");
  const vapidEmail = mconfig.get("vapidEmail");
  webpush.setVapidDetails(`mailto:${vapidEmail}`, publicVapidKey, privateVapidKey);
  PushSubscriptionModel = mongoose.model<PushSubscriptionType>("mwc_pushsubscription", 
    new mongoose.Schema<PushSubscriptionType>({
      userId: {
        type: String,
        required: true
      },
      endpoint: {
        type: String,
        required: true,
        unique: true,
      },
      keys: {
        p256dh: {
          type: String,
          required: true
        },
        auth: {
          type: String,
          required: true
        },
      }
    }, {
      timestamps:true
    })
  );
}

export function sendPublicVapidKey(
  request:express.Request, 
  response:express.Response
){
  const publicVapidKey = mconfig.get("publicVapidKey");
  response.send(publicVapidKey);
}

export async function registerSubscription(
  request:express.Request, 
  response:express.Response
){
  const { userId } = response.locals.currentUserInfo;
  if(!userId) return response.status(401).json({});
  try{
    const subscription = request.body.subscription;
    const endpoint = subscription.endpoint;
    if(typeof endpoint != "string") return response.status(401).json({});
    const p256dh = subscription.keys?.p256dh;
    if(typeof p256dh != "string") return response.status(401).json({});
    const auth = subscription.keys?.auth;
    if(typeof auth != "string") return response.status(401).json({});
  
    if(PushSubscriptionModel == null) return response.status(500).json({});
    await PushSubscriptionModel.create({ userId, endpoint, keys: { p256dh, auth } });
    response.status(201).json({});
  }catch(error){
    response.status(401).json({});
  }
}

export async function getSubscriptioins(userId:string){
  if(PushSubscriptionModel == null) throw new UnexpectedError("[Server Error] Push is not initialized.");
  const subscriptions = await PushSubscriptionModel.find({ userId }, { _id:0, endpoint:1, keys:1 }).lean();
  return subscriptions
}