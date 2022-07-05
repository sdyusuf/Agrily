import {useNavigate, Outlet} from 'react-router-dom'
import {useUser} from './useUser'


export const PrivateRoute = children =>{
    const user = useUser();

    //console.log(user)
    
    const navigate = useNavigate()

    if(!user){
        navigate("/index")
        window.location = "/index"
    }else{
        return <Outlet/>
    }

    
}