import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
export type SwipePagerProps = {page:number;onChange:(page:number)=>void;children:React.ReactNode[]};
export function SwipePager({page,onChange,children}:SwipePagerProps) {
  const ref=useRef<ScrollView>(null);
  const [width,setWidth]=useState(0);
  const previous=useRef({page,width});
  useEffect(()=>{
    if(width) ref.current?.scrollTo({x:width*page,animated:previous.current.width===width});
    previous.current={page,width};
  },[page,width]);
  return <View style={{flex:1,minHeight:0}} onLayout={e=>setWidth(e.nativeEvent.layout.width)}>
    {width>0 && <ScrollView ref={ref} horizontal pagingEnabled directionalLockEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} style={{flex:1}} onMomentumScrollEnd={e=>onChange(Math.max(0,Math.min(children.length-1,Math.round(e.nativeEvent.contentOffset.x/width))))}>
      {children.map((child,i)=><View key={i} style={{width,flexShrink:0}}>{child}</View>)}
    </ScrollView>}
  </View>;
}
