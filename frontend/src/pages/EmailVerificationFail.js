import React from 'react'
import {useNavigate} from 'react-router-dom'



function EmailVerificationFail() {
    const navigate = useNavigate()
    return (
        <div>
            <h1>Uh Oh!</h1>
            <p>
                Something went wrong while performing verification...
            </p>
            <button onClick={()=>navigate('/signup')}>Back to Sign up</button>
            
        </div>
    )
}

export default EmailVerificationFail;