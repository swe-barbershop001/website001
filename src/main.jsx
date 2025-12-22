import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@material-tailwind/react'
import './index.css'
import App from './App.jsx'
import AOS from 'aos'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

function AppWithAOS() {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:12',message:'AppWithAOS useEffect entry',data:{windowSentry:typeof window!=='undefined'?!!window.Sentry:false,windowSentryType:typeof window!=='undefined'?typeof window.Sentry:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    const scripts=typeof document!=='undefined'?Array.from(document.querySelectorAll('script')).map(s=>({src:s.src,type:s.type,async:s.async,defer:s.defer})):[];
    const sentryScripts=scripts.filter(s=>s.src&&s.src.includes('sentry'));
    fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:15',message:'Script tags check',data:{scriptCount:scripts.length,scripts:sentryScripts},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-cubic',
      once: true,
      mirror: false,
      offset: 100,
    })
    
    // Refresh AOS on route changes
    return () => {
      AOS.refresh()
    }
  }, [])

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

// #region agent log
if(typeof window!=='undefined'){
  const checkSentry=()=>{
    const sentryExists=!!window.Sentry;
    const sentryInfo=sentryExists?{version:window.Sentry.SDK_VERSION||'unknown',dsn:window.Sentry.getCurrentHub?.()?.getClient?.()?.getDsn?.()?.toString()||'unknown'}:null;
    const logData={location:'main.jsx:33',message:'Sentry check before render',data:{sentryExists,sentryInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',logData);
    fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  };
  checkSentry();
  setTimeout(checkSentry,1000);
  setTimeout(checkSentry,3000);
}
// #endregion

// #region agent log
if(typeof window!=='undefined'&&window.fetch){
  const originalFetch=window.fetch;
  window.fetch=(...args)=>{
    const url=args[0]?.toString()||'';
    if(url.includes('sentry.io')){
      const logData={location:'main.jsx:45',message:'Sentry fetch intercepted',data:{url,method:args[1]?.method||'GET'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG] Sentry fetch intercepted:',logData);
      fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    }
    return originalFetch.apply(this,args);
  };
}
// #endregion

// #region agent log
if(typeof window!=='undefined'&&window.XMLHttpRequest){
  const OriginalXHR=window.XMLHttpRequest;
  window.XMLHttpRequest=function(...args){
    const xhr=new OriginalXHR(...args);
    const originalOpen=xhr.open;
    xhr.open=function(method,url,...rest){
      if(typeof url==='string'&&url.includes('sentry.io')){
        fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:56',message:'Sentry XHR intercepted',data:{method,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      return originalOpen.apply(this,[method,url,...rest]);
    };
    const originalSend=xhr.send;
    xhr.send=function(...args){
      xhr.addEventListener('error',function(){
        if(xhr.responseURL&&xhr.responseURL.includes('sentry.io')){
          fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:66',message:'Sentry XHR error',data:{url:xhr.responseURL,status:xhr.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        }
      });
      return originalSend.apply(this,args);
    };
    return xhr;
  };
}
// #endregion

// #region agent log
if(typeof window!=='undefined'){
  window.addEventListener('error',function(event){
    if(event.message&&event.message.includes('sentry')||event.filename&&event.filename.includes('sentry')){
      fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:80',message:'Global error with Sentry reference',data:{message:event.message,filename:event.filename,lineno:event.lineno},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
  },true);
  window.addEventListener('unhandledrejection',function(event){
    if(event.reason&&(event.reason.toString().includes('sentry')||event.reason.message&&event.reason.message.includes('sentry'))){
      fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:87',message:'Unhandled rejection with Sentry reference',data:{reason:event.reason?.toString()||String(event.reason)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
  });
}
// #endregion

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AppWithAOS />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
