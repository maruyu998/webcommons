import mongoose from "mongoose";
import { generateRandom } from "../commons/utils/random";

const States = ["waiting","running","done"] as const;
type StateType = typeof States[number];

type JobType = {
  jobId: string,
  key: string,
  state: StateType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  registerAt: Date,
  startAt?: Date,
  endAt?: Date
};

const JobModel = mongoose.model<JobType>("Job", 
  new mongoose.Schema<JobType>({
    jobId: {
      type: String,
      required: true,
      unique: true,
      default: ()=>generateRandom(20)
    },
    key: {
      type: String,
      required: true
    },
    state: {
      type: String,
      enum: States,
      required: true,
      default: "waiting"
    },
    args: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    registerAt: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    startAt: {
      type: Date
    },
    endAt: {
      type: Date
    }
  }, {
    timestamps:true
  })
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerJob(key:string, args:any){
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const job = (await new JobModel({ key, args }).save()).toJSON();
  return job.jobId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getJob(key:string, query:{[key:string]:any}={}){
  const job = (await JobModel.findOne({ key,...query }).exec())?.toJSON();
  return job || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWaitingJob(key:string, query:{[key:string]:any}={}){
  const job = (await JobModel.findOne({ key, state:"waiting", ...query }).exec())?.toJSON();
  return job || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRunningJob(key:string, query:{[key:string]:any}={}){
  return await JobModel.findOne({ key, state:"running", ...query }).exec();
}

export async function setStartJob(jobId:string){
  await JobModel.findOneAndUpdate({ jobId },{ state:"running", startAt:new Date() }).exec();
}

export async function setEndJob(jobId:string){
  await JobModel.findOneAndUpdate({ jobId },{ state:"done", endAt:new Date() }).exec();
}

export async function deleteCompletedJobs(key:string, query:{[key:string]:any}){
  await JobModel.deleteMany({ key, state:"done", ...query }).exec();
}