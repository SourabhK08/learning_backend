import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [names, setNames] = useState([])

  useEffect(() => {
    axios.get('/api/names')
    .then((response) => {
      console.log("res====",response);
      
      setNames(response.data)
    })
    .catch((error) => {
      console.log("err--",error);
    })
  },[])

  return (
    <>
    <h1>Full stack project</h1>
      <h2>Names :- {names.length}</h2>
      
      {
      names.map((name) => (
        <div key={name.id}>
          <h3> {name?.name || 'N/A'}  </h3>
          <p> {name?.content || 'N/A'} </p>
        </div>
      ))
      }
    </>
  )
}

export default App
