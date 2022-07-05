import React, {Component} from 'react'
import {useState} from 'react'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import { Form, Row, Col, Button, Container, Alert} from 'react-bootstrap'
import farmer2 from '../images/farmer.jpg'
import {Link, useNavigate} from 'react-router-dom'
import {useToken} from '../auth/useToken'
import axios from 'axios'
import {useUser} from '../auth/useUser'
import FormData from 'form-data'
import TopBar from '../components/TopBar'


//Getting encoded payload and decoding it


class AddProduct extends Component {

	state = {
	// Initially, no file is selected
	selectedFile: null,
    errorMessage:'',
    name:'',
    quantity:'',
    description:'',
    price:"",
    imageURL:'',
    ownerEmail:'',
    isSold:false,
    soldDate:'',
    soldTo:'',
    responseData:''
	};

    
    componentDidMount(){
    const encodedPayload = localStorage.getItem('token').split('.')[1];
    const user = JSON.parse(atob(encodedPayload))
    this.setState({ownerEmail: user.email})
    console.log(user)
    }

    componentWillUnmount(){

    }

    logout = () => {
        localStorage.removeItem('token')
        console.log(localStorage.getItem('token'))
        window.location.href ='/index'
      }
	
	// On file select (from the pop up)
	onFileChange = event => {
	// Update the state
	this.setState({ selectedFile: event.target.files[0] });
	};
	
	// On file upload (click the upload button)
	handleSubmit = async(event) => {

    const {name, quantity, description, price, ownerEmail, imageURL, isSold, soldDate, soldTo} = this.state

    const errorMessage = typeof price == 'string' ? 
    (
        this.setState({errorMessage:'price must be a number '}) 
    ): ""

    

	// Create an object of formData
    event.preventDefault()
	// Send formData object
    try{    
        const response = await axios.post("http://localhost:5000/api/product", 
        {name,quantity,description, price, imageURL, ownerEmail, isSold, soldDate, soldTo}, {
            headers:{
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        response.data && this.setState({responseData: "Product saved successfully!"})

    }catch(error){

    }
        


	};
	
	// File content to be displayed after
	// file upload is complete
	
	
	render() {
	
	return (
		<div>
            <TopBar logout={this.logout}/>
			




            <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>
            <h3 className="text-center">Add Product</h3>
            <Container>
            <Row>  <Col md={4}></Col>
            <Col md={4}> 
            <form encType="multipart/form-data">
               
                { this.state.errorMessage && (<Alert  variant="warning"> {this.state.errorMessage} </Alert>) }
                { this.state.responseData && (<Alert  variant="warning"> {this.state.responseData} </Alert>) }


                <Form.Label id="name" label="name" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="text" 
                        name="name" 
                        placeholder="Product Name" 
                        style={{width:'100%'}}
                        value={this.state.name}
                        onChange={e=>this.setState({[e.target.name] : e.target.value})}/>
                </Form.Label> <br/>

                <Form.Label id="quantity" label="quantity" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="number" 
                        name="quantity" 
                        placeholder="Enter product quantity" 
                        style={{width:'100%'}}
                        value={this.state.quantity}
                        onChange={e=>this.setState({[e.target.name] : e.target.value})}/>
                </Form.Label> <br/>

                {/* <Form.Label id="Password" label="Password" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="file" 
                        name="image" 
                        placeholder="Password" 
                        style={{width:'100%'}}
                        onChange={this.onFileChange}/>
                </Form.Label> <br/> */}

                <Form.Label id="Password" label="Password" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="text" 
                        name="description" 
                        placeholder="description" 
                        style={{width:'100%'}}
                        value={this.state.description}
                        onChange={e=>this.setState({[e.target.name] : e.target.value})}/>
                </Form.Label> <br/>

                <Form.Label id="Password" label="Password" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="number" 
                        name="price" 
                        placeholder="price" 
                        style={{width:'100%'}}
                        value={this.state.price}
                        onChange={e=>this.setState({[e.target.name] : Number(e.target.value)})}/>
                </Form.Label> <br/>

                <Button 
                    type="submit" 
                    className="mb-2" 
                    style={{width:'100%'}}
                    onClick={this.handleSubmit}
                    disabled={
                        !this.state.name || !this.state.quantity || !this.state.price || !this.state.description
                    }
                    >
                    Sign Up
                </Button> <br/>

                

                
                
                    
            </form>
            

            </Col>
            <Col md={4}></Col>
            
            </Row>
            </Container>
            <Footer/>

		
		</div>
	);
	}
}

export default AddProduct;


















// import React from 'react'
// import {useState} from 'react'
// import Footer from '../components/Footer'
// import NavBar from '../components/NavBar'
// import { Form, Row, Col, Button, Container, Alert} from 'react-bootstrap'
// import farmer2 from '../images/farmer.jpg'
// import {Link, useNavigate} from 'react-router-dom'
// import {useToken} from '../auth/useToken'
// import axios from 'axios'
// import {useUser} from '../auth/useUser'
// import FormData from 'form-data'


// function AddProduct() {

    

//     const [token, setToken] = useToken()
//     const user = useUser()
//     //const navigate = useNavigate()

//     const config = {
//         headers: { Authorization: `Bearer ${token}` }
//     };

//     const [errorMessage, setErrorMessage] = useState("")

//     const [name, setName] = useState('')
//     const [quantity, setQuantity] = useState('')
//     const [image, setImage] = useState ('')
//     const [ownerEmail, setOwnerEmail] = useState(user.email) //default is active user
//     const [description, setDescription] = useState('')
//     const [price, setPrice] = useState('99.99')
//     const [isSold, setIsSold] = useState(false) //default is false
//     const [soldDate, setSoldDate] = useState(null) //to be assigned later
//     const [soldTo, setSoldTo] = useState('') //to be assigned later


//     const types = ['image/png', 'image/jpeg'];

//     const fileChangeHandler = (e) =>{
//         e.preventDefault()
        
//         let data = new FormData()
//         data.append('image', e.target.files[0])

//         setImage(data)

//         //setImage(selected);

//         console.log(image)

        
//     }


//     const handleSubmit = (e) =>{
//         e.preventDefault()
//         axios.post('http://localhost:5000/api/product',{
//             name,
//             quantity,
//             image,
//             ownerEmail,
//             description,
//             price,
//             isSold,
//             soldDate,
//             soldTo
            
//         }, 
//         {
//             headers: {
//                 'accept': 'application/json',
//                 'Accept-Language': 'en-US,en;q=0.8',
//                 'Content-Type': `multipart/form-data; boundary=${image._boundary}`,
//                 'Authorization': `Bearer ${token}`
//               }
//         }
//         )
//         .then((response) =>{
//             const data = response.data
//         } )
//         .catch(err=> {
//             console.log({Error: err})
//             setErrorMessage("Error: Something went wrong!")

//         })
    
//     }

//     return (
//         <div>
//             <NavBar/>
            // <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>
            // <h3 className="text-center">Add Product</h3>
            // <Container>
            // <Row>  <Col md={4}></Col>
            // <Col md={4}> 
            // <form encType="multipart/form-data">
               
            //     { errorMessage && (<Alert  variant="warning"> {errorMessage} </Alert>) }


            //     <Form.Label id="name" label="name" style={{width:'100%'}}>
            //         <Form.Control 
            //             size="sm" 
            //             type="text" 
            //             name="name" 
            //             placeholder="Product Name" 
            //             style={{width:'100%'}}
            //             value={name}
            //             onChange={e=>setName(e.target.value)}/>
            //     </Form.Label> <br/>

            //     <Form.Label id="quantity" label="quantity" style={{width:'100%'}}>
            //         <Form.Control 
            //             size="sm" 
            //             type="number" 
            //             name="quantity" 
            //             placeholder="Enter product quantity" 
            //             style={{width:'100%'}}
            //             value={quantity}
            //             onChange={e=>setQuantity(e.target.value)}/>
            //     </Form.Label> <br/>

            //     <Form.Label id="Password" label="Password" style={{width:'100%'}}>
            //         <Form.Control 
            //             size="sm" 
            //             type="file" 
            //             name="image" 
            //             placeholder="Password" 
            //             style={{width:'100%'}}
            //             onChange={(e) => fileChangeHandler(e)}/>
            //     </Form.Label> <br/>

            //     <Form.Label id="Password" label="Password" style={{width:'100%'}}>
            //         <Form.Control 
            //             size="sm" 
            //             type="text" 
            //             name="description" 
            //             placeholder="description" 
            //             style={{width:'100%'}}
            //             value={description}
            //             onChange={e=>setDescription(e.target.value)}/>
            //     </Form.Label> <br/>

            //     <Form.Label id="Password" label="Password" style={{width:'100%'}}>
            //         <Form.Control 
            //             size="sm" 
            //             type="number" 
            //             name="price" 
            //             placeholder="price" 
            //             style={{width:'100%'}}
            //             value={price}
            //             onChange={e=>setPrice(e.target.value)}/>
            //     </Form.Label> <br/>

            //     <Button 
            //         type="submit" 
            //         className="mb-2" 
            //         style={{width:'100%'}}
            //         onClick={handleSubmit}
            //         >
            //         Sign Up
            //     </Button> <br/>

                

                
                
                    
            // </form>
            

            // </Col>
            // <Col md={4}></Col>
            
            // </Row>
            // </Container>
            // <Footer/>
//         </div>
//     )
// }

// export default AddProduct
