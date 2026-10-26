export function demoAuth(payload){localStorage.setItem('atithi_user',JSON.stringify({name:payload.name||payload.email.split('@')[0],email:payload.email}));return true;}
