import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
//import NavDropdown from 'react-bootstrap/NavDropdown'
import Button from 'react-bootstrap/Button'
import {Link} from 'react-router-dom'

function NavBar(){

    

return (

    <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
    <Container>
    <Link to="/index" style={{textDecoration:'none'}}>
      <Navbar.Brand style={{fontWeight:'bold', color:'#bc6c25', textDecoration:'none'}}>Agrily</Navbar.Brand>
    </Link>

    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
    <Navbar.Collapse id="responsive-navbar-nav">
      <Nav className="me-auto">
        <Nav.Link href="#features">About Us</Nav.Link>
        <Nav.Link href="#pricing">Contact Us</Nav.Link>
        {/*<NavDropdown title="Dropdown" id="collasible-nav-dropdown">
          <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
        </NavDropdown>*/}
      </Nav>
      <Nav >
        
         
          <div style={{marginTop:'5px', marginRight:'5px'}}> 
          <Link style={{textDecoration:'none', color:'#000'}} to="/login">Login </Link> 
          </div> 
        

        
        <div > 
            <Button style={{backgroundColor:'#bc6c25', border:'none', padding:'5px 10px'}}> 
            <Link style={{textDecoration:'none', color:'#fff'}} to="/register"> Sign Up</Link>
            </Button>
        </div>
        

      </Nav>
    </Navbar.Collapse>
    </Container>
  </Navbar>


)

}

export default NavBar