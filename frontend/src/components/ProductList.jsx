import React, {useState, useEffect} from 'react';
import {Row, Col} from 'react-bootstrap'
import axios from 'axios'
import { useToken } from '../auth/useToken';


function ProductList({email}) {
    const [products, setProducts] = useState([])
    const [token , setToken] = useToken()
 
    useEffect(()=>{
        const fetchData = () =>{
            
            const response =  axios.get(`http://localhost:5000/api/products/${email}`,{
            headers:{
                Authorization: `Bearer ${token}`
            }
            })
            .then(response => setProducts([...products, response.data]))
            .catch(err => console.log(err))
         
        console.log(products)
    }
    fetchData()
    })

    
  return <Row>
            {
                products.map((element, key)=>(
                    <Row key={key}><h1 style={{color:'black'}}> {element.name} </h1> </Row>
                ))
            }
        </Row>;
}

export default ProductList;
