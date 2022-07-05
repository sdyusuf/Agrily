import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import { Button, Container } from 'react-bootstrap'
import farmer2 from '../images/farmer.jpg'
import {Link} from 'react-router-dom'

function NotFound() {
    return (
        <div>
            <NavBar/>
            <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>
            
            <Container className="text-center">
            <h3>404</h3>
            <h4>Page Not Found</h4>

            <p>To go back home </p>
            <Button style={{background:'#bc6c25'}}><Link to="/" style={{color:'#fff', textDecoration:'none'}}>Click Here</Link></Button>
            </Container>

            
            <Footer/>
        </div>
    )
}

export default NotFound
