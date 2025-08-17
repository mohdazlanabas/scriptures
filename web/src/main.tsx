
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Today from './pages/Today'
import Post from './pages/Post'
import './styles.css'

const router = createBrowserRouter([
  { path: '/', element: <Today /> },
  { path: '/post/:date', element: <Post /> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
