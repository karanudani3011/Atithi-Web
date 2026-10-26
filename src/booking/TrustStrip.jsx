import { BadgeCheck, CreditCard, Headset, Sparkles } from 'lucide-react';
const items=[[CreditCard,'Secure Payment'],[Headset,'24/7 Support'],[Sparkles,'Best Rates'],[BadgeCheck,'Trusted by Millions']];
export default function TrustStrip(){return <div className="booking-trust-strip">{items.map(([Icon,text])=><span key={text}><Icon/>{text}</span>)}</div>}
