import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { generateRandom } from "../commons/utils/random";

const States = ["waiting","running","done"] as const;
type StateType = typeof States[number];

type JobType = {
  jobId: string,
  key: string,
  state: StateType,
  priority: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  registerAt: Date,
  startAt?: Date,
  endAt?: Date
};

const JobModel = mongoose.model<JobType>("mwc_job", 
  new mongoose.Schema<JobType>({
    jobId: {
      type: String,
      required: true,
      unique: true,
      default: ()=>uuidv4()
    },
    key: {
      type: String,
      required: true
    },
    priority: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1
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
export async function registerJob(key:string, args:any, priority:number=0){
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  if(priority < 0 || priority > 1) throw new Error("priority must be in [0-1].");
  const job = (await new JobModel({ key, priority, args }).save()).toJSON();
  return job.jobId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getJob(key:string, query:{[key:string]:any}={}, sort:{[key:string]:any}={}){
  const job = (await JobModel.findOne({ key,...query }).sort({priority:-1, ...sort}).exec())?.toJSON();
  return job || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getJobs(key:string, query:{[key:string]:any}={}, sort:{[key:string]:any}={}){
  const jobs = await JobModel.find({ key,...query }).sort({priority:-1, ...sort}).lean();
  return jobs;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWaitingJob(key:string, query:{[key:string]:any}={}, sort:{[key:string]:any}={}){
  const job = (await JobModel.findOne({ key, state:"waiting", ...query }).sort({priority:-1, ...sort}).exec())?.toJSON();
  return job || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWaitingJobs(key:string, query:{[key:string]:any}={}, sort:{[key:string]:any}={}){
  const jobs = await JobModel.find({ key, state:"waiting", ...query }).sort({priority:-1, ...sort}).lean();
  return jobs;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRunningJob(key:string, query:{[key:string]:any}={}, sort:{[key:string]:any}={}){
  return await JobModel.findOne({ key, state:"running", ...query }).sort({priority:-1, ...sort}).exec();
}

export async function setStartJob(jobId:string){
  await JobModel.findOneAndUpdate({ jobId },{ state:"running", startAt:new Date() }).exec();
}

export async function setEndJob(jobId:string){
  await JobModel.findOneAndUpdate({ jobId },{ state:"done", endAt:new Date() }).exec();
}

export async function deleteCompletedJobs(key:string, query:{[key:string]:any}={}){
  await JobModel.deleteMany({ key, state:"done", ...query }).exec();
}