import { useEffect, useRef } from 'react';
import { Check, Orbit } from 'lucide-react';
export function CameraModeButton({active,onChange,startLabel,finishLabel}: {active:boolean;onChange:(active:boolean)=>void;startLabel:string;finishLabel:string}) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if (!active) return;
    const escape = (event: KeyboardEvent)=>{
      if (event.key !== 'Escape') return;
      onChange(false);
      button.current?.focus();
    };
    window.addEventListener('keydown',escape);
    return ()=>window.removeEventListener('keydown',escape);
  },[active,onChange]);
  return <button ref={button} aria-pressed={active} onClick={()=>onChange(!active)}>{active ? <Check aria-hidden="true"/> : <Orbit aria-hidden="true"/>}{active ? finishLabel : startLabel}</button>;
}
