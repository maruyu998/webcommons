import express from "express";
import webpush from "web-push";
import mongoose from "mongoose";
import env from "maruyu-webcommons/node/env";
import { UnexpectedError } from "./errors";
import { z } from "zod";


export type PushSubscriptionType = {
  userId: string,
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  };
}

let PushSubscriptionModel:mongoose.Model<PushSubscriptionType>|null = null;

export function register(){
  // `npx web-push generate-vapid-keys`
  const publicVapidKey = env.get("PUBLIC_VAPID_KEY", z.string().nonempty());
  const privateVapidKey = env.get("PRIVATE_VAPID_KEY", z.string().nonempty());
  const vapidEmail = env.get("VAPID_EMAIL", z.string().nonempty());
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
  const publicVapidKey = env.get("PUBLIC_VAPID_KEY", z.string().nonempty());
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
    await sendPush(subscription, { title: "Push Notification Test", body: "Push Registered Successfully."});
    response.status(200).json({});
  }catch(error){
    console.error(error);
    response.status(500).json({});
  }
}

export async function unregisterSubscription(
  request:express.Request, 
  response:express.Response
){
  const { userId } = response.locals.currentUserInfo;
  if(!userId) return response.status(401).send("signin is required.");
  try{
    const subscription = request.body.subscription;
    const endpoint = subscription.endpoint;
    if(typeof endpoint != "string") return response.status(401).send("endpoint is not string.");
  
    if(PushSubscriptionModel == null) return response.status(500).send("push system is not started");
    const pushSubscription = await PushSubscriptionModel.findOneAndDelete({ userId, endpoint });
    if(pushSubscription == null) return response.status(404).send("subscription is not registered");
    response.status(200).json({});
  }catch(error){
    response.status(500).json({});
  }
}

export async function getSubscriptioins(userId:string){
  if(PushSubscriptionModel == null) throw new UnexpectedError("[Server Error] Push is not initialized.");
  const subscriptions = await PushSubscriptionModel.find({ userId }, { _id:0, endpoint:1, keys:1 }).lean();
  return subscriptions
}

export async function sendPush(
  subscription: webpush.PushSubscription,
  object: {
    tag?: string,
    title: string,
    body: string,
    actions?: {
      action: string,
      title: string
    }[]
  }
){
  if(PushSubscriptionModel == null) throw new UnexpectedError("[Server Error] Push is not initialized.");
  try{
    await webpush.sendNotification(subscription, JSON.stringify(object));
  } catch(error:any){
    if(error instanceof webpush.WebPushError){
      if(error.body == "push subscription has unsubscribed or expired.\n"){
        const { endpoint } = error;
        await PushSubscriptionModel.findOneAndDelete({ endpoint });
      }
    }
    throw error;
  }
}