import { useState, useEffect } from "react";
import { useToken } from "./useToken";

//Return if user is set
export const useUser = () =>{
    const[token] = useToken();

    const getPayloadFromToken = token =>{
        const encodedPayload = token.split('.')[1]
        //console.log(atob(encodedPayload))
        return JSON.parse(atob(encodedPayload))
    }

    const [user, setUser] = useState(()=>{
        if(!token) return null
        return getPayloadFromToken(token)
    })

  useEffect(()=>{
      if(!token) {
          setUser(null)
      } else{
          getPayloadFromToken(token)
      }
  }, [token])

  return user
}