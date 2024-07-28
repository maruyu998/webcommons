
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
      fetch('/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({subscription}),
      });
    }
  }else{
    console.log('Notification permission denied');
  }
}