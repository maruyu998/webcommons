
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkIsNotificationPermitted(){
  const permission = await (Notification as any).requestPermission();
  if(permission == "granted") return true;
  return false;
}

export async function checkIsPushSubscriptionRegistered(){
  const registration = await (navigator as any).serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if(subscription) return true;
  return false;
}

export async function registerNotification(){
  const permission = await (Notification as any).requestPermission();
  if(permission === 'granted'){
    const registration = await (navigator as any).serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if(!subscription){
      const publicVapidKey = await fetch("/push").then(res=>res.text());
      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      await fetch('/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({subscription}),
      });
    }
    return true;
  }else{
    console.log('Notification permission denied');
    return false;
  }
}

export async function unregisterNotification(){
  const registration = await (navigator as any).serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if(subscription){
    const success = await fetch('/push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({subscription}),
    }).then(res=>{
      if(res.status != 200 && res.status != 404) {
        throw new Error(`${res.status}`);
      }
      return subscription.unsubscribe()
    })
    .then(successful=>{
      console.log('通知のサブスクリプションを解除しました。');
      return true;
    })
    .catch(error=>{
      console.error('サブスクリプションの解除に失敗しました:', error);
      return false;
    });
    return success;
  }else{
    console.log('通知のサブスクリプションは存在しません。');
    return true;
  }
}