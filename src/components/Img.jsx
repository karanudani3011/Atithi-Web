import {useState} from 'react';import {BedDouble} from 'lucide-react';
export default function Img({src,alt='',className=''}){const [failed,setFailed]=useState(false);return failed?<div className={`img-fallback ${className}`} role="img" aria-label={alt}><BedDouble size={36}/><span>Atithi</span></div>:<img loading="lazy" src={src} alt={alt} className={className} onError={()=>setFailed(true)}/>}
