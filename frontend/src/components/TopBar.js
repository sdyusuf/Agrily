import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
//import NavDropdown from 'react-bootstrap/NavDropdown'
import Button from 'react-bootstrap/Button'
import {Link} from 'react-router-dom'
import {useUser} from '../auth/useUser'

function TopBar(props){    

  const user = useUser()

  const {firstName, lastName, id, email, isVerified} = user

  const initials = firstName.charAt(0) + lastName.charAt(0)

  //console.log(user)

return (

    <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
    <Container>
    <Link to="/" style={{textDecoration:'none'}}>
      <Navbar.Brand style={{fontWeight:'bold', color:'#bc6c25', textDecoration:'none'}}>Agrily</Navbar.Brand>
    </Link>

    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
    <Navbar.Collapse id="responsive-navbar-nav">
      <Nav className="me-auto">
        {/* <Nav.Link href="#features">About Us</Nav.Link>
        <Nav.Link href="#pricing">Contact Us</Nav.Link> */}
        {/*<NavDropdown title="Dropdown" id="collasible-nav-dropdown">
          <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
        </NavDropdown>*/}
      </Nav>
      <Nav >
        
         
          <div style={{margin:'5px 15px'}} onClick={props.logout}> 
          <Link style={{textDecoration:'none', color:'#000'}} to="#">Logout </Link> 
          </div> 
        

        
        <div > 
            <div style={{fontSize:22, border:'1px solid black', 
                        borderRadius:'100%', padding:'3px', 
                        width:'30px', height:'30px',
                        display:'flex', justifyContent:'center', alignItems:'center',
                        backgroundColor:'#000', color:'#fff'}}> {initials} </div>
        </div>
        

      </Nav>
    </Navbar.Collapse>
    </Container>
  </Navbar>


)

}

export default TopBar