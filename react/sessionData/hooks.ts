import { getPacket, patchPacket, deletePacket } from "../../commons/utils/fetch";
import { useSessionDataConfig } from "./provider";

// Hook版 - React コンポーネント内で使用
export function useSessionData() {
  const { sessionEndpoint } = useSessionDataConfig();
  
  const saveSessionData = async (key: string, data: any) => {
    return patchPacket({
      url: new URL(sessionEndpoint, window.location.href), 
      bodyData: { key, data }
    });
  };

  const getSessionData = async (key: string) => {
    return getPacket({
      url: new URL(sessionEndpoint, window.location.href), 
      queryData: { key }
    }).then((result: any) => result?.data);
  };

  const deleteSessionData = async (key: string) => {
    return deletePacket({
      url: new URL(sessionEndpoint, window.location.href), 
      queryData: { key }
    });
  };

  return { saveSessionData, getSessionData, deleteSessionData };
}

// 後方互換性のための従来の関数（エンドポイントを明示的に指定）
export async function saveSessionData(endpoint: string, key: string, data: any) {
  return patchPacket({url: new URL(endpoint, window.location.href), bodyData: { key, data }});
}

export async function getSessionData(endpoint: string, key: string) {
  return getPacket({url: new URL(`${endpoint}`, window.location.href), queryData: { key }}).then((result: any) => result?.data);
}