import React, { useRef } from 'react';
import type {SwipePagerProps} from './SwipePager';
// Pointer events cover mouse drag and mobile browser swipe without hijacking
// vertical scrolling or a tap on a nutrition choice.
export function SwipePager({page,onChange,children}:SwipePagerProps) {
  const start=useRef<{x:number;y:number}|null>(null);
  const swiped=useRef(false);
  return <div style={{display:'flex',flex:1,minHeight:0,touchAction:'pan-y'}}
    onPointerDown={e=>{start.current={x:e.clientX,y:e.clientY};swiped.current=false;}}
    onPointerCancel={()=>{start.current=null;}}
    onPointerUp={e=>{
      const p=start.current; start.current=null;
      if(!p)return;
      const dx=e.clientX-p.x,dy=e.clientY-p.y;
      if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.5){swiped.current=true;onChange(Math.max(0,Math.min(children.length-1,page+(dx<0 ? 1 : -1))));}
    }} onClickCapture={e=>{if(swiped.current){e.preventDefault();e.stopPropagation();swiped.current=false;}}}>
    {children[page]}
  </div>;
}
