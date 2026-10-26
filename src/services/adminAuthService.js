const USERS_KEY='atithi_admin_users';
const SESSION_KEY='atithi_admin_session';
const USERS_EVENT='atithi:admin-users-changed';
const SUPER_ADMIN={id:'admin',password:'admin123',name:'Super Admin',email:'admin',role:'super_admin'};
const readUsers=()=>{try{const value=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}};
export function getAdminUsers(){return readUsers().map(({password,...user})=>user)}
function changed(){window.dispatchEvent(new Event(USERS_EVENT))}
export function createAdminUser({name,email,password}){const users=readUsers();if(users.some(user=>user.email.toLowerCase()===email.trim().toLowerCase()))throw new Error('An admin already uses this email.');const user={id:globalThis.crypto?.randomUUID?.()||`admin-${Date.now()}`,name:name.trim(),email:email.trim().toLowerCase(),password,createdAt:new Date().toISOString()};users.push(user);localStorage.setItem(USERS_KEY,JSON.stringify(users));changed();return user}
export function updateAdminUser(id,{name,password}){const users=readUsers(),i=users.findIndex(user=>user.id===id);if(i<0)throw new Error('Admin user not found.');users[i]={...users[i],name:name.trim(),...(password?{password}:{})};localStorage.setItem(USERS_KEY,JSON.stringify(users));changed();return users[i]}
export function deleteAdminUser(id){const users=readUsers().filter(user=>user.id!==id);localStorage.setItem(USERS_KEY,JSON.stringify(users));changed();return true}
export function authenticateAdmin(id,password){if(id==='admin'&&password===SUPER_ADMIN.password)return {name:SUPER_ADMIN.name,email:SUPER_ADMIN.email,role:SUPER_ADMIN.role};const user=readUsers().find(item=>item.email.toLowerCase()===id.trim().toLowerCase()&&item.password===password);return user?{name:user.name,email:user.email,role:'sub_admin'}:null}
export function getAdminSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
export function isAdminSessionValid(session){return session?.role==='super_admin'||(session?.role==='sub_admin'&&readUsers().some(user=>user.email.toLowerCase()===session.email?.toLowerCase()))}
export const adminUsersChangedEvent=USERS_EVENT;
export function setAdminSession(session){localStorage.setItem(SESSION_KEY,JSON.stringify(session));return session}
export function clearAdminSession(){localStorage.removeItem(SESSION_KEY)}
