import React from "react";
import { View, Text, Pressable } from "react-native";
import { C, s, Icon } from "./ui";
import { nutritionInterests } from "../lib/nutrition-interests";
export function NutritionChoices({selected,onChange,compact=false}:{selected:string[];onChange:(values:string[])=>void;compact?:boolean}) {
  return <View style={{flexDirection:"row",flexWrap:"wrap",gap:compact ? 8 : 10}}>{nutritionInterests.map(n=>{
    const checked = selected.includes(n.key);
    return <Pressable key={n.key} accessibilityRole="checkbox" accessibilityLabel={n.label} accessibilityState={{checked}} onPress={()=>onChange(checked ? selected.filter(k=>k!==n.key) : [...selected,n.key])} style={[s.row,{width:"47%",minHeight:compact ? 44 : 51,padding:compact ? 10 : 12,borderWidth:1,borderColor:checked ? "#B5D665" : C.line,borderRadius:14,backgroundColor:checked ? C.lime : C.paper,gap:7}]}><Icon name={checked ? "check" : n.icon} size={17}/><Text style={{fontSize:12,fontWeight:"600",color:C.ink}}>{n.label}</Text></Pressable>;
  })}</View>;
}
