
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Landing from './pages/Landing'
import Scriptures from './pages/Scriptures'
import Post from './pages/Post'
import Subscribe from './pages/Subscribe'
import Payment from './pages/Payment'
import './styles.css'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/scriptures', element: <Scriptures /> },
  { path: '/post/:date', element: <Post /> },
  { path: '/subscribe', element: <Subscribe /> },
  { path: '/payment', element: <Payment /> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
