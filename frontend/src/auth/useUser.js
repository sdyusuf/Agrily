import { useState, useEffect } from "react";
import { useToken } from "./useToken";

//Return if user is set
export const useUser = () =>{
    const[token] = useToken();

    const getPayloadFromToken = token =>{
        try {
            const encodedPayload = token.split('.')[1]
            return JSON.parse(atob(encodedPayload))
        } catch (e) {
            return null
        }
    }

    const [user, setUser] = useState(()=>{
        if(!token) return null
        return getPayloadFromToken(token)
    })

  useEffect(()=>{
      if(!token) {
          setUser(null)
      } else{
          setUser(getPayloadFromToken(token))
      }
  }, [token])

  return user
}